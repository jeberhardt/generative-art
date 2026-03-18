let cfg = {
  numRibbons:      11,
  bandWidth:       14,
  roughness:       1.8,
  seed:            Math.floor(Math.random() * 99999)
};

const CONTROLS_HEIGHT = 160;
let S = window.innerWidth;
let H = window.innerHeight - CONTROLS_HEIGHT;
const STEPS = 150;

const sketch = (p) => {

  p.setup = () => {
    S = window.innerWidth;
    H = window.innerHeight - CONTROLS_HEIGHT;
    p.createCanvas(S, H).parent('sketch-container');
    p.noLoop();
    redraw();
  };

  // ── Main draw ─────────────────────────────────────────────────
  function redraw() {
    p.randomSeed(cfg.seed);
    p.noiseSeed(cfg.seed);
    p.background(238, 225, 207);
    addPaperTexture();

    p.stroke(42, 36, 28);
    p.strokeWeight(1.1);
    p.noFill();

    // Build ribbon descriptors.
    // Distribute all endpoints evenly around the perimeter by dividing it
    // into 2*numRibbons slots, shuffling, then pairing them up — ensuring
    // no ribbon starts and ends on the same edge.
    let n       = cfg.numRibbons;
    let perim   = 2 * S + 2 * H;
    let slots   = Array.from({ length: 2 * n }, (_, i) => {
      // Base position evenly spaced, jittered within its slot
      let base  = (i / (2 * n)) * perim;
      let jitter = (p.random() - 0.5) * (perim / (2 * n)) * 0.6;
      return (base + jitter + perim) % perim;
    });
    // Shuffle slots
    for (let i = slots.length - 1; i > 0; i--) {
      let j = Math.floor(p.random(i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    let all = [];
    for (let i = 0; i < n; i++) {
      // Pick two slots; retry second if it lands on the same edge as first
      let s1 = slots[i * 2];
      let s2 = slots[i * 2 + 1];
      if (perimEdge(s1) === perimEdge(s2)) {
        // Swap s2 with a slot from a different pair on a different edge
        for (let k = i * 2 + 2; k < slots.length; k++) {
          if (perimEdge(slots[k]) !== perimEdge(s1)) {
            [slots[i * 2 + 1], slots[k]] = [slots[k], slots[i * 2 + 1]];
            s2 = slots[i * 2 + 1];
            break;
          }
        }
      }
      all.push(buildRibbon(perimPoint(s1), perimPoint(s2)));
    }

    // First pass: compute jittered strands for all ribbons
    for (let rb of all) buildDrawn(rb);

    // Draw ribbons in order, fill then lines per ribbon — weave established
    for (let rb of all) drawRibbon(rb);

    // Build a map of all crossing indices per strand so we can find
    // the arc-length distance to the nearest neighbouring crossing.
    let strandCrossings = all.map(() => [[], []]);
    for (let i = 1; i < all.length; i++) {
      for (let j = 0; j < i; j++) {
        for (let os = 0; os < 2; os++) {
          for (let us = 0; us < 2; us++) {
            let crs = findStrandCrossings(all[i].drawn[os], all[j].drawn[us], 1);
            for (let cr of crs) {
              strandCrossings[i][os].push(closestIdx(all[i].drawn[os], cr));
              strandCrossings[j][us].push(closestIdx(all[j].drawn[us], cr));
            }
          }
        }
      }
    }
    for (let i = 0; i < all.length; i++)
      for (let s = 0; s < 2; s++)
        strandCrossings[i][s].sort((a, b) => a - b);

    p.noFill();
    for (let i = 1; i < all.length; i++) {
      for (let j = 0; j < i; j++) {
        for (let os = 0; os < 2; os++) {
          for (let us = 0; us < 2; us++) {
            let overStrand  = all[i].drawn[os];
            let underStrand = all[j].drawn[us];
            let crossings   = findStrandCrossings(overStrand, underStrand, 1);
            for (let cr of crossings) {
              let oki = closestIdx(overStrand,  cr);
              let uki = closestIdx(underStrand, cr);

              let tryDirs = [[1, -1], [-1, 1], [1, 1], [-1, -1]];
              let bestGreen, bestBlue;

              for (let [od, ud] of tryDirs) {
                // Distance to next crossing on each strand in this direction
                let oDist = distToNextCrossing(overStrand,  oki, od, strandCrossings[i][os]);
                let uDist = distToNextCrossing(underStrand, uki, ud, strandCrossings[j][us]);

                let g = strandPointAt(overStrand,  cr, oDist * 0.25, od);
                let b = strandPointAt(underStrand, cr, uDist * 0.25, ud);

                let mx = 0.25*g[0] + 0.5*cr.x + 0.25*b[0];
                let my = 0.25*g[1] + 0.5*cr.y + 0.25*b[1];
                let onPaper = !all.some(rb => pointInRibbon(mx, my, rb));
                if (onPaper) { bestGreen = g; bestBlue = b; break; }
              }

              if (!bestGreen) continue;

              let green = bestGreen;
              let blue  = bestBlue;

              let gki = closestIdx(overStrand,  { x: green[0], y: green[1] });
              let bki = closestIdx(underStrand, { x: blue[0],  y: blue[1]  });

              // Sample the bezier arc
              let arcPts = [];
              for (let t = 0; t <= 1; t += 1/16) {
                arcPts.push({
                  x: (1-t)*(1-t)*green[0] + 2*(1-t)*t*cr.x + t*t*blue[0],
                  y: (1-t)*(1-t)*green[1] + 2*(1-t)*t*cr.y + t*t*blue[1]
                });
              }

              // Over-strand segment from green back to crossing
              let oSeg = gki < oki
                ? overStrand.slice(gki, oki + 1)
                : overStrand.slice(oki, gki + 1).reverse();

              // Under-strand segment from crossing to blue
              let uSeg = uki < bki
                ? underStrand.slice(uki, bki + 1)
                : underStrand.slice(bki, uki + 1).reverse();

              p.push();
              p.fill(42, 36, 28);
              p.noStroke();
              p.beginShape();
              for (let pt of arcPts)               p.vertex(pt.x, pt.y);
              for (let pt of [...uSeg].reverse())  p.vertex(pt.x, pt.y);
              for (let pt of [...oSeg].reverse())  p.vertex(pt.x, pt.y);
              p.endShape(p.CLOSE);
              p.pop();
            }
          }
        }
      }
    }
  }

  // Ray-casting point-in-polygon test against a ribbon's fill polygon
  function pointInRibbon(px, py, rb) {
    let poly = [...rb.drawn[0], ...[...rb.drawn[1]].reverse()];
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      let xi = poly[i].x, yi = poly[i].y;
      let xj = poly[j].x, yj = poly[j].y;
      if (((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Arc-length distance from strand index ki to the nearest other crossing
  // index in direction dir. Falls back to distance to strand end.
  function distToNextCrossing(strand, ki, dir, crossingIdxs) {
    // Find the nearest crossing index in direction dir from ki
    let nearest = null;
    for (let ci of crossingIdxs) {
      if (dir > 0 && ci > ki) {
        if (nearest === null || ci < nearest) nearest = ci;
      } else if (dir < 0 && ci < ki) {
        if (nearest === null || ci > nearest) nearest = ci;
      }
    }
    // If no next crossing, use distance to end of strand
    let target = nearest !== null ? nearest : (dir > 0 ? strand.length - 1 : 0);
    // Measure arc length from ki to target
    let d = 0;
    let step = dir > 0 ? 1 : -1;
    for (let k = ki; k !== target; k += step) {
      let nx = k + step;
      if (nx < 0 || nx >= strand.length) break;
      d += Math.hypot(strand[nx].x - strand[k].x, strand[nx].y - strand[k].y);
    }
    return Math.max(d, 5); // minimum 5px to avoid zero-size shapes
  }

  function strandPointAt(strand, cr, dist, dir) {
    let ki = closestIdx(strand, cr);
    let d = 0, k = ki;
    while (k + dir >= 0 && k + dir < strand.length) {
      let dx = strand[k + dir].x - strand[k].x;
      let dy = strand[k + dir].y - strand[k].y;
      d += Math.sqrt(dx*dx + dy*dy);
      k += dir;
      if (d >= dist) return [strand[k].x, strand[k].y];
    }
    // Fallback: try other direction
    dir = -dir; d = 0; k = ki;
    while (k + dir >= 0 && k + dir < strand.length) {
      let dx = strand[k + dir].x - strand[k].x;
      let dy = strand[k + dir].y - strand[k].y;
      d += Math.sqrt(dx*dx + dy*dy);
      k += dir;
      if (d >= dist) return [strand[k].x, strand[k].y];
    }
    return [strand[ki].x, strand[ki].y];
  }



  // ── Ribbon builders ───────────────────────────────────────────
  //
  // Each ribbon is a PAIR of completely independent bezier lines.
  // Both lines share approximate start/end edge regions so they
  // feel like they belong together, but each has its own random
  // control points (1–6), so they are never parallel.
  // The band width offsets the start/end points slightly apart
  // perpendicular to the general travel direction.

  function buildRibbon([sx, sy], [ex, ey]) {
    let bw = cfg.bandWidth;

    let numCP = Math.floor(p.random(1, 7));
    let cps = [];

    // Perpendicular to the chord — all control points bow to the same side
    // for a sweeping arc feel rather than a zigzag
    let dx = ex - sx, dy = ey - sy;
    let chordLen = Math.sqrt(dx*dx + dy*dy) || 1;
    let px = -dy / chordLen, py = dx / chordLen;

    let D = (S + H) / 2; // average dimension for scale-independent sizing
    let arcBias = p.random(D * 0.05, D * 0.25) * (p.random() > 0.5 ? 1 : -1);

    for (let k = 0; k < numCP; k++) {
      let t = (k + 1) / (numCP + 1);
      let envelope = Math.sin(t * Math.PI);
      let wobble = p.random(-D * 0.03, D * 0.03);
      let dev = arcBias * envelope + wobble;
      cps.push({
        x: p.lerp(sx, ex, t) + px * dev,
        y: p.lerp(sy, ey, t) + py * dev
      });
    }

    // Sample the shared centreline
    let poly   = [{ x: sx, y: sy }, ...cps, { x: ex, y: ey }];
    let centre = [];
    for (let i = 0; i <= STEPS; i++) {
      centre.push(deCasteljau(poly, i / STEPS));
    }

    // Perpendicular unit vector at each point (for the ±bw offset)
    let perps = centre.map((pt, i) => {
      let prev = centre[Math.max(0, i - 1)];
      let next = centre[Math.min(centre.length - 1, i + 1)];
      let dx = next.x - prev.x, dy = next.y - prev.y;
      let len = Math.sqrt(dx*dx + dy*dy) || 1;
      return { x: -dy / len, y: dx / len };
    });

    // Two strands: offset ±bw/2 from centre, each with its own tiny
    // independent per-point noise (0.05% of canvas = ~0.3px at 600px)
    let tinyDev = D * 0.0005;
    let strands = [+1, -1].map((sign, si) => {
      let nb = p.random(10000);
      return centre.map(({ x, y }, i) => {
        let t  = i / (STEPS);
        let nx = (p.noise(nb,       t * 6) - 0.5) * tinyDev;
        let ny = (p.noise(nb + 500, t * 6) - 0.5) * tinyDev;
        return {
          x: x + perps[i].x * sign * bw * 0.5 + nx,
          y: y + perps[i].y * sign * bw * 0.5 + ny
        };
      });
    });

    return { strands, noiseBase: p.random(10000) };
  }

  function deCasteljau(pts, t) {
    let p2 = pts.map(q => ({ ...q }));
    while (p2.length > 1) {
      let next = [];
      for (let i = 0; i < p2.length - 1; i++) {
        next.push({
          x: (1 - t) * p2[i].x + t * p2[i+1].x,
          y: (1 - t) * p2[i].y + t * p2[i+1].y
        });
      }
      p2 = next;
    }
    return p2[0];
  }

  function buildDrawn(rb) {
    rb.drawn = rb.strands.map((pts, si) => {
      let nb = rb.noiseBase + si * 1317;
      return pts.map(({ x, y }, i) => {
        let t  = i / (pts.length - 1);
        let nx = (p.noise(nb,       t * 5) - 0.5) * cfg.roughness * 0.8;
        let ny = (p.noise(nb + 999, t * 5) - 0.5) * cfg.roughness * 0.8;
        return { x: x + nx, y: y + ny };
      });
    });
  }

  // ── Draw ribbon ───────────────────────────────────────────────
  function drawRibbon(rb) {
    let jittered = rb.drawn;

    // Pass 1: paper-colour fill
    p.push();
    p.fill(238, 225, 207);
    p.noStroke();
    p.beginShape();
    for (let pt of jittered[0])                p.vertex(pt.x, pt.y);
    for (let pt of [...jittered[1]].reverse()) p.vertex(pt.x, pt.y);
    p.endShape(p.CLOSE);
    p.pop();

    // Pass 2: ink lines
    p.push();
    p.stroke(42, 36, 28);
    p.strokeWeight(1.1);
    p.noFill();
    for (let jpts of jittered) {
      p.beginShape();
      for (let pt of jpts) p.curveVertex(pt.x, pt.y);
      p.endShape();
    }
    p.pop();
  }

  function findStrandCrossings(sA, sB, step = 2) {
    let results = [];
    for (let i = 0; i < sA.length - step; i += step) {
      for (let j = 0; j < sB.length - step; j += step) {
        let ix = segIntersect(sA[i], sA[i + step], sB[j], sB[j + step]);
        if (ix) results.push({ x: ix.x, y: ix.y, iA: i, iB: j });
      }
    }
    return results.filter((cr, idx) =>
      !results.slice(0, idx).some(prev =>
        Math.hypot(cr.x - prev.x, cr.y - prev.y) < cfg.bandWidth * 0.5
      )
    );
  }

  function segIntersect(p1, p2, p3, p4) {
    let dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
    let dx2 = p4.x - p3.x, dy2 = p4.y - p3.y;
    let denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 0.0001) return null;
    let dx3 = p3.x - p1.x, dy3 = p3.y - p1.y;
    let t = (dx3 * dy2 - dy3 * dx2) / denom;
    let u = (dx3 * dy1 - dy3 * dx1) / denom;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: p1.x + t * dx1, y: p1.y + t * dy1, t, u };
  }

  function closestIdx(strand, cr) {
    let minD = Infinity, minI = 0;
    for (let i = 0; i < strand.length; i++) {
      let d = Math.hypot(strand[i].x - cr.x, strand[i].y - cr.y);
      if (d < minD) { minD = d; minI = i; }
    }
    return minI;
  }



  // Convert a perimeter distance (0..2S+2H) to an [x,y] point on the canvas edge.
  // Edges: top (0..S), right (S..S+H), bottom (S+H..2S+H), left (2S+H..2S+2H)
  function perimPoint(d) {
    let perim = 2 * S + 2 * H;
    d = ((d % perim) + perim) % perim;
    if (d < S)           return [d,      -15];           // top
    if (d < S + H)       return [S + 15, d - S];        // right
    if (d < 2 * S + H)   return [S - (d - S - H), H + 15]; // bottom
    return [-15, H - (d - 2 * S - H)];                  // left
  }

  function perimEdge(d) {
    let perim = 2 * S + 2 * H;
    d = ((d % perim) + perim) % perim;
    if (d < S)         return 0; // top
    if (d < S + H)     return 1; // right
    if (d < 2 * S + H) return 2; // bottom
    return 3;                    // left
  }

  // ── Paper texture ────────────────────────────────────────────

  function addPaperTexture() {
    p.loadPixels();
    for (let x = 0; x < S; x++) {
      for (let y = 0; y < H; y++) {
        let n   = p.noise(x * 0.04, y * 0.04) * 8 - 4;
        let idx = (x + y * S) * 4;
        p.pixels[idx]   = Math.min(255, Math.max(0, p.pixels[idx]   + n));
        p.pixels[idx+1] = Math.min(255, Math.max(0, p.pixels[idx+1] + n));
        p.pixels[idx+2] = Math.min(255, Math.max(0, p.pixels[idx+2] + n));
      }
    }
    p.updatePixels();
  }

  p.redrawAll = () => redraw();
  p.saveIt   = () => p.save('ribbon-tangle.png');
};

let myP5 = new p5(sketch);

// ── Controls ─────────────────────────────────────────────────────
function wire(sliderId, valId, key, parse) {
  let el = document.getElementById(sliderId);
  let vl = document.getElementById(valId);
  el.addEventListener('input', () => {
    cfg[key] = parse(el.value);
    vl.textContent = el.value;
    cfg.seed = Math.floor(Math.random() * 99999);
    myP5.redrawAll();
  });
}
wire('s-ribbons', 'v-ribbons', 'numRibbons', parseInt);
wire('s-width',   'v-width',   'bandWidth',  parseInt);
wire('s-rough',   'v-rough',   'roughness',  parseFloat);

document.getElementById('btn-regen').addEventListener('click', () => {
  cfg.seed = Math.floor(Math.random() * 99999);
  myP5.redrawAll();
});
document.getElementById('btn-save').addEventListener('click', () => myP5.saveIt());

const overlay = document.getElementById('popover-overlay');
document.getElementById('btn-doodle').addEventListener('click', () => overlay.classList.add('open'));
overlay.addEventListener('click', () => overlay.classList.remove('open'));
