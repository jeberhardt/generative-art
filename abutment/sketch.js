new p5(function(p) {

  let W = window.innerWidth, H = window.innerHeight;
  const STROKE_W = 10;        // marker width
  const NUM_LINES = 22;       // roughly how many lines to attempt
  const STEP = 2;             // march step size in pixels
  const NOISE_SCALE = 0.008;  // gentle Perlin curl
  const NOISE_STRENGTH = 0.6; // max angular deviation per step (radians)
  const MAX_ANGLE_DRIFT = 0.18; // max total deviation from starting angle (radians ~10°)
  const MARGIN = 20;
  const MIN_GAP = 28;         // minimum clear distance between parallel lines

  // Each completed line is stored as array of {x,y} points
  let lines = [];
  // All known intersection points between lines
  let intersections = [];
  // Noise offsets per line for variety
  let noiseOffsets = [];

  p.setup = function() {
    let cnv = p.createCanvas(W, H);
    cnv.parent(document.body);
    p.noLoop();
    generate();
  };

  p.windowResized = function() {
    W = window.innerWidth;
    H = window.innerHeight;
    p.resizeCanvas(W, H);
    generate();
  };

  function generate() {
    lines = [];
    intersections = [];
    noiseOffsets = [];
    p.noiseSeed(p.floor(p.random(99999)));
    p.randomSeed(p.floor(p.random(99999)));
    showLoading();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      buildLines();
      p.redraw();
      hideLoading();
    }));
  }

  // ── Edge sampling ──────────────────────────────────────────────
  // Returns {x, y, angle} for a random starting point on a canvas edge
  function randomEdgeStart() {
    const side = p.floor(p.random(4)); // 0=top,1=right,2=bottom,3=left
    let x, y, angle;
    const spread = p.PI * 0.55; // how wide an arc of directions is allowed

    const offscreen = STROKE_W * 2;
    if (side === 0) {       // top
      x = p.random(W * 0.1, W * 0.9);
      y = -offscreen;
      angle = p.random(p.PI * 0.1, p.PI * 0.9);
    } else if (side === 1) { // right
      x = W + offscreen;
      y = p.random(H * 0.1, H * 0.9);
      angle = p.random(p.PI * 0.6, p.PI * 1.4);
    } else if (side === 2) { // bottom
      x = p.random(W * 0.1, W * 0.9);
      y = H + offscreen;
      angle = p.random(p.PI * 1.1, p.PI * 1.9);
    } else {                // left
      x = -offscreen;
      y = p.random(H * 0.1, H * 0.9);
      angle = p.random(-p.PI * 0.4, p.PI * 0.4);
    }
    return { x, y, angle };
  }

  // ── Segment–segment intersection ───────────────────────────────
  // Returns t ∈ [0,1] along seg A if it intersects seg B, else null
  function segIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
    const dx1 = ax2 - ax1, dy1 = ay2 - ay1;
    const dx2 = bx2 - bx1, dy2 = by2 - by1;
    const denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((bx1 - ax1) * dy2 - (by1 - ay1) * dx2) / denom;
    const u = ((bx1 - ax1) * dy1 - (by1 - ay1) * dx1) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return t;
    return null;
  }

  // Point at parameter t along a polyline
  function polylinePoint(pts, t) {
    if (pts.length < 2) return pts[0];
    const totalLen = polylineLength(pts);
    const target = t * totalLen;
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const segLen = p.dist(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
      if (acc + segLen >= target) {
        const frac = (target - acc) / segLen;
        return {
          x: p.lerp(pts[i].x, pts[i+1].x, frac),
          y: p.lerp(pts[i].y, pts[i+1].y, frac)
        };
      }
      acc += segLen;
    }
    return pts[pts.length - 1];
  }

  function polylineLength(pts) {
    let l = 0;
    for (let i = 0; i < pts.length - 1; i++)
      l += p.dist(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    return l;
  }

  // ── Check if a point is too close to any known intersection ────
  function nearExistingIntersection(x, y, radius) {
    for (const ix of intersections) {
      if (p.dist(x, y, ix.x, ix.y) < radius) return true;
    }
    return false;
  }

  // ── March one line ──────────────────────────────────────────────

  // ── Point-to-segment distance ───────────────────────────────────
  function ptSegDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx*dx + dy*dy;
    if (lenSq === 0) return p.dist(px, py, ax, ay);
    const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
    return p.dist(px, py, ax + t*dx, ay + t*dy);
  }

  // Returns true if newPts runs near-parallel to an existing line for a sustained stretch.
  // A crossing is exempt: if the two lines actually intersect near a close point, reset the counter.
  function linesActuallyCross(ptsA, ptsB) {
    for (let i = 0; i < ptsA.length - 1; i++) {
      for (let j = 0; j < ptsB.length - 1; j++) {
        const t = segIntersect(ptsA[i].x, ptsA[i].y, ptsA[i+1].x, ptsA[i+1].y,
                               ptsB[j].x, ptsB[j].y, ptsB[j+1].x, ptsB[j+1].y);
        if (t !== null) return true;
      }
    }
    return false;
  }

  // Find all crossing points between two polylines
  function crossingPoints(ptsA, ptsB) {
    const pts = [];
    for (let i = 0; i < ptsA.length - 1; i++) {
      for (let j = 0; j < ptsB.length - 1; j++) {
        const t = segIntersect(ptsA[i].x, ptsA[i].y, ptsA[i+1].x, ptsA[i+1].y,
                               ptsB[j].x, ptsB[j].y, ptsB[j+1].x, ptsB[j+1].y);
        if (t !== null) {
          pts.push({
            x: ptsA[i].x + (ptsA[i+1].x - ptsA[i].x) * t,
            y: ptsA[i].y + (ptsA[i+1].y - ptsA[i].y) * t
          });
        }
      }
    }
    return pts;
  }

  function lineTooClose(newPts) {
    for (const other of lines) {
      const crossPts = crossingPoints(newPts, other);
      // Check every sampled point on the new line
      let closeCount = 0;
      for (let i = 0; i < newPts.length; i += 3) {
        const np = newPts[i];
        // If this point is near a crossing, it's transitioning — reset and skip
        let nearCross = false;
        for (const cp of crossPts) {
          if (p.dist(np.x, np.y, cp.x, cp.y) < MIN_GAP * 1.2) { nearCross = true; break; }
        }
        if (nearCross) { closeCount = 0; continue; }

        let minD = Infinity;
        for (let si = 0; si < other.length - 1; si++) {
          const d = ptSegDist(np.x, np.y, other[si].x, other[si].y, other[si+1].x, other[si+1].y);
          if (d < minD) minD = d;
        }
        if (minD < MIN_GAP && minD > STROKE_W * 0.6) {
          closeCount++;
          if (closeCount > 6) return true;
        } else {
          closeCount = 0;
        }
      }
    }
    return false;
  }

  // Returns array of points; also records intersections found
  function marchLine(noiseOff) {
    const start = randomEdgeStart();
    let x = start.x;
    let y = start.y;
    let angle = start.angle;

    const pts = [{ x, y }];
    const startAngle = angle;
    let crossings = 0;
    let prevCrossCount = 0;
    // Lock the drift direction on first significant bend — no S-curves
    let driftSign = 0;

    const maxSteps = (W + H) * 3;

    for (let step = 0; step < maxSteps; step++) {
      // Gentle Perlin noise angular drift
      const noiseVal = p.noise(x * NOISE_SCALE + noiseOff, y * NOISE_SCALE + noiseOff * 1.3);
      angle += (noiseVal - 0.5) * NOISE_STRENGTH * 0.25;
      // Clamp total drift from starting angle
      const drift = ((angle - startAngle + p.PI * 3) % (p.TWO_PI)) - p.PI;
      // Once a drift direction is established, only allow drift in that direction
      if (driftSign === 0 && Math.abs(drift) > 0.02) {
        driftSign = Math.sign(drift);
      }
      if (driftSign !== 0 && Math.sign(drift) !== driftSign && Math.abs(drift) > 0.01) {
        angle = startAngle; // snap back to straight rather than crossing to other side
      }
      if (Math.abs(drift) > MAX_ANGLE_DRIFT) {
        angle = startAngle + driftSign * MAX_ANGLE_DRIFT;
      }

      const nx = x + Math.cos(angle) * STEP;
      const ny = y + Math.sin(angle) * STEP;

      // Collect ALL crossings this step across all lines, sorted nearest-first
      const hitsThisStep = [];
      for (let li = 0; li < lines.length; li++) {
        const other = lines[li];
        for (let si = 0; si < other.length - 1; si++) {
          const t = segIntersect(x, y, nx, ny,
                                  other[si].x, other[si].y,
                                  other[si+1].x, other[si+1].y);
          if (t !== null) {
            const ix = x + Math.cos(angle) * STEP * t;
            const iy = y + Math.sin(angle) * STEP * t;
            if (!nearExistingIntersection(ix, iy, STROKE_W * 1.5)) {
              hitsThisStep.push({ t, ix, iy, li });
            }
          }
        }
      }
      hitsThisStep.sort((a, b) => a.t - b.t);

      let stopHere = false;
      let stopX = nx, stopY = ny;

      for (const hit of hitsThisStep) {
        // Skip this crossing if it lands too close to an existing intersection —
        // prevents 3 lines clustering at the same junction and killing whitespace
        if (nearExistingIntersection(hit.ix, hit.iy, STROKE_W * 4)) continue;
        crossings++;
        intersections.push({ x: hit.ix, y: hit.iy, lineA: lines.length, lineB: hit.li });
        if (crossings === 2) {
          // Abutting: stop exactly at this 2nd crossing
          stopX = hit.ix;
          stopY = hit.iy;
          stopHere = true;
          break;
        }
        // crossing === 1: pass through it, continue marching
      }

      pts.push({ x: stopX, y: stopY });
      x = stopX;
      y = stopY;

      if (stopHere) break;

      // Check if we've left the canvas (use generous margin so off-canvas starts aren't killed)
      const EXIT = STROKE_W * 4;
      if (x < -EXIT || x > W + EXIT || y < -EXIT || y > H + EXIT) break;
    }

    return pts;
  }

  // ── Build all lines ─────────────────────────────────────────────
  function buildLines() {
    let attempts = 0;
    while (lines.length < NUM_LINES && attempts < NUM_LINES * 6) {
      attempts++;
      const noiseOff = p.random(1000);
      const pts = marchLine(noiseOff);

      // Require at least some minimum length
      if (polylineLength(pts) < W * 0.2) continue;

      // Reject if it runs too close to an existing line (no crowding)
      if (lineTooClose(pts)) continue;

      lines.push(pts);
      noiseOffsets.push(noiseOff);
    }
  }

  // ── Draw a thick polyline as filled quads (opaque, no blending) ─
  function drawThickPolyline(pts, w) {
    if (pts.length < 2) return;

    p.beginShape(p.TRIANGLE_STRIP);
    for (let i = 0; i < pts.length; i++) {
      // Tangent direction
      let tx, ty;
      if (i === 0) {
        tx = pts[1].x - pts[0].x;
        ty = pts[1].y - pts[0].y;
      } else if (i === pts.length - 1) {
        tx = pts[i].x - pts[i-1].x;
        ty = pts[i].y - pts[i-1].y;
      } else {
        tx = pts[i+1].x - pts[i-1].x;
        ty = pts[i+1].y - pts[i-1].y;
      }
      const len = Math.sqrt(tx*tx + ty*ty) || 1;
      // Normal (perpendicular)
      const nx = -ty / len * w * 0.5;
      const ny =  tx / len * w * 0.5;

      p.vertex(pts[i].x + nx, pts[i].y + ny);
      p.vertex(pts[i].x - nx, pts[i].y - ny);
    }
    p.endShape();
  }

  // ── Render ──────────────────────────────────────────────────────
  p.draw = function() {
    // Off-white textured paper feel
    p.background(245, 243, 238);

    // Subtle paper grain
    p.loadPixels();
    for (let i = 0; i < p.pixels.length; i += 4) {
      const grain = p.random(-6, 6);
      p.pixels[i]   = p.constrain(p.pixels[i]   + grain, 0, 255);
      p.pixels[i+1] = p.constrain(p.pixels[i+1] + grain, 0, 255);
      p.pixels[i+2] = p.constrain(p.pixels[i+2] + grain, 0, 255);
    }
    p.updatePixels();

    // Draw each line as a solid opaque filled shape
    // Draw white "knock-out" background behind each line first to ensure opacity
    p.noStroke();

    for (const pts of lines) {
      // White knockout slightly wider
      p.fill(245, 243, 238);
      drawThickPolyline(pts, STROKE_W + 2);
    }

    for (const pts of lines) {
      // Teal/cyan marker colour — slightly varied for authenticity
      const hShift = p.random(-5, 5);
      p.fill(0 + hShift, 186 + hShift, 209 + hShift);
      drawThickPolyline(pts, STROKE_W);

      // Subtle inner highlight (marker ink is slightly lighter at center)
      p.fill(20 + hShift, 210 + hShift, 230 + hShift, 60);
      drawThickPolyline(pts, STROKE_W * 0.35);
    }

  };

  document.getElementById('regen').onclick = () => generate();
  document.getElementById('save').onclick = () => downloadCanvas('abutment.png');

});
