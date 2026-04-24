new p5(function(p) {

  const W = window.innerWidth, H = window.innerHeight;

  let units = [];

  p.setup = function() {
    let cnv = p.createCanvas(W, H);
    cnv.parent(document.body);
    p.noLoop();
    generate();
  };

  function generate() {
    showLoading();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      buildUnits();
      p.redraw();
      hideLoading();
    }));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pointOnEdge(edge, t) {
    switch(edge) {
      case 0: return p.createVector(0,     t * H);
      case 1: return p.createVector(W,     t * H);
      case 2: return p.createVector(t * W, 0);
      case 3: return p.createVector(t * W, H);
    }
  }

  function lerp2(a, b, t) {
    return p.createVector(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }

  function rayHitsCanvas(origin, dir) {
    let hits = [];
    if (Math.abs(dir.x) > 0.0001) {
      let t = (0 - origin.x) / dir.x;
      if (t > 0.001) { let y = origin.y + dir.y*t; if (y>=0&&y<=H) hits.push({t, pt: p.createVector(0,y)}); }
      t = (W - origin.x) / dir.x;
      if (t > 0.001) { let y = origin.y + dir.y*t; if (y>=0&&y<=H) hits.push({t, pt: p.createVector(W,y)}); }
    }
    if (Math.abs(dir.y) > 0.0001) {
      let t = (0 - origin.y) / dir.y;
      if (t > 0.001) { let x = origin.x + dir.x*t; if (x>=0&&x<=W) hits.push({t, pt: p.createVector(x,0)}); }
      t = (H - origin.y) / dir.y;
      if (t > 0.001) { let x = origin.x + dir.x*t; if (x>=0&&x<=W) hits.push({t, pt: p.createVector(x,H)}); }
    }
    if (!hits.length) return null;
    hits.sort((a,b) => a.t - b.t);
    return hits[0];
  }

  // Returns the intersection point of two segments, or null if they don't intersect.
  function segIntersectPt(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
    const dx1 = ax2 - ax1, dy1 = ay2 - ay1;
    const dx2 = bx2 - bx1, dy2 = by2 - by1;
    const denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((bx1 - ax1) * dy2 - (by1 - ay1) * dx2) / denom;
    const u = ((bx1 - ax1) * dy1 - (by1 - ay1) * dx1) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1)
      return p.createVector(ax1 + t * dx1, ay1 + t * dy1);
    return null;
  }

  function generateUnit(color, existingUnits = []) {
    let isHorizontal = p.random() < 0.5;
    let entryEdge = isHorizontal ? 0 : 2;
    let exitEdge  = isHorizontal ? 1 : 3;

    let p1 = pointOnEdge(entryEdge, p.random(0.05, 0.95));
    let p2 = pointOnEdge(exitEdge,  p.random(0.05, 0.95));

    let trunkDir = p5.Vector.sub(p2, p1);
    let angle = Math.atan2(trunkDir.y, trunkDir.x) * 180 / Math.PI;
    let straightAngle = isHorizontal ? 0 : 90;
    let deviation = angle - straightAngle;
    while (deviation >  180) deviation -= 360;
    while (deviation < -180) deviation += 360;
    if (Math.abs(deviation) > 25) {
      let clampedRad = (straightAngle + Math.sign(deviation) * 25) * Math.PI / 180;
      let hit = rayHitsCanvas(p1, p.createVector(Math.cos(clampedRad), Math.sin(clampedRad)));
      if (hit) p2 = hit.pt;
    }
    trunkDir = p5.Vector.sub(p2, p1);
    let trunkDirN = trunkDir.copy().normalize();

    function crossSign(pt) {
      return trunkDir.x * (pt.y - p1.y) - trunkDir.y * (pt.x - p1.x);
    }

    let entryNormal = isHorizontal ? p.createVector(1, 0) : p.createVector(0, 1);
    let crossVal = trunkDirN.x * entryNormal.y - trunkDirN.y * entryNormal.x;
    let sideA = crossVal >= 0 ? -1 : 1;
    let sideB = -sideA;

    const MIN_DOT = Math.cos(55 * Math.PI / 180);
    const MAX_DOT = Math.cos(15 * Math.PI / 180);

    function randomPointOnEdge(edge) {
      return pointOnEdge(edge, p.random(0.05, 0.95));
    }

    const MIN_STUB = 100;

    function findLanding(attachPt, wantSide, wantNegativeDot, maxTries = 150) {
      for (let i = 0; i < maxTries; i++) {
        let edge = p.random() < 0.5 ? entryEdge : exitEdge;
        let candidate = randomPointOnEdge(edge);
        let cs = crossSign(candidate);
        if (wantSide > 0 && cs <= 0) continue;
        if (wantSide < 0 && cs >= 0) continue;
        let branchVec = p5.Vector.sub(candidate, attachPt).normalize();
        let dot = branchVec.dot(trunkDirN);
        if (wantNegativeDot && dot >= 0) continue;
        if (!wantNegativeDot && dot <= 0) continue;
        let absDot = Math.abs(dot);
        if (absDot < MIN_DOT || absDot > MAX_DOT) continue;
        // Reject if any existing line crosses this branch within MIN_STUB of the endpoint
        let stub = false;
        for (const u of existingUnits) {
          const segs = [
            [u.trunk.p1,   u.trunk.p2],
            [u.branchA.start, u.branchA.end],
            [u.branchB.start, u.branchB.end],
          ];
          for (const [a, b] of segs) {
            const ix = segIntersectPt(
              attachPt.x, attachPt.y, candidate.x, candidate.y,
              a.x, a.y, b.x, b.y
            );
            if (ix && p5.Vector.dist(ix, candidate) < MIN_STUB) { stub = true; break; }
          }
          if (stub) break;
        }
        if (stub) continue;
        return candidate;
      }
      for (let i = 0; i < 100; i++) {
        let edge = wantNegativeDot ? entryEdge : exitEdge;
        let candidate = randomPointOnEdge(edge);
        let cs = crossSign(candidate);
        if (wantSide > 0 && cs <= 0) continue;
        if (wantSide < 0 && cs >= 0) continue;
        let stub = false;
        for (const u of existingUnits) {
          const segs = [
            [u.trunk.p1,      u.trunk.p2],
            [u.branchA.start, u.branchA.end],
            [u.branchB.start, u.branchB.end],
          ];
          for (const [a, b] of segs) {
            const ix = segIntersectPt(
              attachPt.x, attachPt.y, candidate.x, candidate.y,
              a.x, a.y, b.x, b.y
            );
            if (ix && p5.Vector.dist(ix, candidate) < MIN_STUB) { stub = true; break; }
          }
          if (stub) break;
        }
        if (!stub) return candidate;
      }
      return randomPointOnEdge(wantNegativeDot ? entryEdge : exitEdge);
    }

    let attachA = lerp2(p1, p2, p.random(0.25, 0.45));
    let attachB = lerp2(p1, p2, p.random(0.55, 0.75));
    let endA = findLanding(attachA, sideA,  true);
    let endB = findLanding(attachB, sideB, false);

    return {
      color,
      trunk:   { p1, p2 },
      branchA: { start: attachA, end: endA },
      branchB: { start: attachB, end: endB },
    };
  }

  function requiredAngleDiff(dist) {
    let t = Math.min(1, Math.max(0, (dist - 50) / (400 - 50)));
    return 45 + (5 - 45) * t;
  }

  function trunkAngle(unit) {
    let d = p5.Vector.sub(unit.trunk.p2, unit.trunk.p1);
    let a = Math.atan2(d.y, d.x) * 180 / Math.PI;
    if (a < 0) a += 180;
    return a;
  }

  function isAngleCompatible(candidate, existingUnits) {
    let candAngle = trunkAngle(candidate);
    for (let existing of existingUnits) {
      let dist = p5.Vector.dist(candidate.trunk.p1, existing.trunk.p1);
      let needed = requiredAngleDiff(dist);
      let diff = Math.abs(candAngle - trunkAngle(existing));
      if (diff > 90) diff = 180 - diff;
      if (diff < needed) return false;
    }
    return true;
  }

  function buildUnits() {
    units = [];
    let numUnits = Math.floor(p.random(8, 13));
    const selectedPalette = document.getElementById('palette').value;
    let colors = shuffle([...getPalette(selectedPalette)]).slice(0, numUnits);
    for (let i = 0; i < numUnits; i++) {
      let attempts = 0, unit;
      do {
        unit = generateUnit(colors[i], units);
        attempts++;
      } while (!isAngleCompatible(unit, units) && attempts < 50);
      units.push(unit);
    }
  }

  p.draw = function() {
    p.background(245);
    const style = document.getElementById('line-style').value;
    for (const unit of units) {
      const { p1, p2 } = unit.trunk;
      drawLine(p, p1.x, p1.y, p2.x, p2.y, unit.color, style);
      drawLine(p, unit.branchA.start.x, unit.branchA.start.y, unit.branchA.end.x, unit.branchA.end.y, unit.color, style);
      drawLine(p, unit.branchB.start.x, unit.branchB.start.y, unit.branchB.end.x, unit.branchB.end.y, unit.color, style);
    }
  };

  document.getElementById('regen').onclick = () => generate();
  document.getElementById('save').onclick = () => downloadCanvas('branching-out.png');
  document.getElementById('palette').addEventListener('change', () => generate());
  document.getElementById('line-style').addEventListener('change', () => p.redraw());

});
