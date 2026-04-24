new p5(function(p) {

  const NUM_BOUNDS = 12;
  const BASE_LINES_PER_SECTION = 60;  // minimum; wide sections get more
  let linesPerSection = [];
  const ARC_STEPS = 80;
  const RADIAL_STEPS = 80;
  const DURATION = 20;

  const SECTION_COLORS = [
    [26,  95, 180],
    [204,  34,   0],
    [123,  47, 190],
    [224, 123,   0],
    [200, 168,   0],
    [204,  34,   0],
    [107,  58,  42],
    [123,  47, 190],
    [ 45, 138,  45],
    [ 26, 122, 180],
    [224,  80,   0],
    [192,  24, 106],
  ];

  let noiseSeeds = [];
  let boundaryBaseAngles = [];
  let bezierControls = [];
  let sectionSpacing = [];
  let boundarySeeds = [];
  let INNER_R, OUTER_R, CX, CY, SIZE;
  let baseCX, baseCY;

  function makeSeed(minThick, maxThick) {
    return {
      rOff:      p.random(1000),
      angOff:    p.random(1000),
      tOff:      p.random(100),
      thickOff:  p.random(1000),
      jitterOff: p.random(1000),
      amp:       p.random(0.8, 1.2),
      baseThick: p.random(minThick, maxThick),
    };
  }

  p.setup = function() {
    let W = window.innerWidth; let H = window.innerHeight;
    p.createCanvas(W, H);
    p.noFill();
    baseCX = W / 2;
    baseCY = H / 2;
    CX = baseCX;
    CY = baseCY;
    OUTER_R = Math.sqrt(baseCX*baseCX + baseCY*baseCY) * 1.05; INNER_R = 0;

    // Place spokes with irregular but safely-spaced base angles.
    // Each spoke gets an even base slice plus a random offset of up to ±30% of the slice.
    // This guarantees no two base angles are too close before bezier deflection.
    let sliceSize = p.TWO_PI / NUM_BOUNDS;
    let rawAngles = [];
    for (let i = 0; i < NUM_BOUNDS; i++) {
      let base = i * sliceSize;
      let jitter = p.random(-sliceSize * 0.3, sliceSize * 0.3);
      rawAngles.push(base + jitter);
    }
    boundaryBaseAngles = rawAngles;

    for (let sec = 0; sec < NUM_BOUNDS; sec++) {
      boundarySeeds[sec] = makeSeed(1.8, 3.2);

      // Each black spoke gets 2-5 control points with varied character:
      // some wide sweeping bends, some sharp localised kinks.
      let numCtrl = Math.floor(p.random(2, 6));
      let ctrls = [];
      let prevAngle = boundaryBaseAngles[(sec + NUM_BOUNDS - 1) % NUM_BOUNDS];
      let nextAngle = boundaryBaseAngles[(sec + 1) % NUM_BOUNDS];
      let gapPrev = boundaryBaseAngles[sec] - prevAngle;
      let gapNext = nextAngle - boundaryBaseAngles[sec];
      if (gapPrev < 0) gapPrev += p.TWO_PI;
      if (gapNext < 0) gapNext += p.TWO_PI;
      // Use 55% of the gap so lines bow dramatically without ever crossing
      let maxDeflect = Math.min(gapPrev, gapNext) * 0.55;
      for (let c = 0; c < numCtrl; c++) {
        ctrls.push({
          rFrac:     p.random(0.05, 0.95),
          amp:       p.random(maxDeflect * 0.4, maxDeflect),
          width:     p.random(0.18, 0.45), // wide Gaussian only — no sharp kinks
          phase:     p.random(p.TWO_PI),
          phase2:    p.random(p.TWO_PI),   // second harmonic phase
          speed:     p.random(0.3, 2.2),
          speed2:    p.random(0.5, 1.8),   // second harmonic speed
          harmonic:  p.random(0.2, 0.7),   // blend of 2nd harmonic
          direction: p.random() > 0.5 ? 1 : -1,
        });
      }
      bezierControls[sec] = ctrls;

      // Generate positions by filling from 0→1 until no gap exceeds maxGapFrac.
      // Scale gap threshold by angular width: wider sections need tighter radial
      // spacing so the visual density stays consistent across all sections.
      let thisAngle = boundaryBaseAngles[(sec + 1) % NUM_BOUNDS] - boundaryBaseAngles[sec];
      if (thisAngle < 0) thisAngle += p.TWO_PI;
      let avgAngle = p.TWO_PI / NUM_BOUNDS;
      let widthRatio = thisAngle / avgAngle;
      let maxGapPx = 10 / Math.max(widthRatio, 1.0);
      let maxGapFrac = maxGapPx / OUTER_R;

      let positions = [0.0];
      let cursor = 0.0;
      let li = 0;
      while (cursor < 1.0 - maxGapFrac * 0.5) {
        // Step forward by roughly maxGapFrac, with small noise irregularity
        let step = maxGapFrac * (0.7 + p.noise(sec * 7.3 + li * 0.6) * 0.6);
        cursor = Math.min(cursor + step, 1.0);
        positions.push(cursor);
        li++;
        if (li > 2000) break; // safety cap
      }
      // Ensure last position is exactly 1.0
      positions[positions.length - 1] = 1.0;

      linesPerSection[sec] = positions.length;
      // Generate a noise seed for each line
      noiseSeeds[sec] = [];
      for (let i = 0; i < positions.length; i++) {
        noiseSeeds[sec][i] = makeSeed(0.7, 1.4);
      }
      sectionSpacing[sec] = positions;
    }
  };

  function boundaryAngle(boundIndex, r, t) {
    let baseAngle = boundaryBaseAngles[boundIndex];
    let rFrac = r / OUTER_R;
    let phase = boundIndex * 1.1;
    let wave1 = p.sin(p.TWO_PI * t / DURATION + phase) * 0.20 * rFrac;
    let wave2 = p.sin(p.TWO_PI * t / DURATION * 1.7 + phase * 1.3 + rFrac * 3.0) * 0.10 * rFrac;
    let wave3 = p.sin(p.TWO_PI * t / DURATION * 0.5 + phase * 0.6) * 0.08 * rFrac;
    return baseAngle + wave1 + wave2 + wave3;
  }

  function boundaryPoint(boundIndex, r, t) {
    let angle = boundaryAngle(boundIndex, r, t);
    return p.createVector(CX + r * p.cos(angle), CY + r * p.sin(angle));
  }

  // Draw a hand-drawn line segment by segment with varying thickness,
  // path wobble, hand-tremor jitter, and ink-density opacity variation.
  // col: [r,g,b], alphaRange: [min,max]
  function drawHandLine(steps, getAngleAtF, col, alphaRange, seed, t) {
    let prevX = null, prevY = null;

    for (let s = 0; s <= steps; s++) {
      let f = s / steps;

      // Slow path wobble
      let pathNoise = p.noise(seed.rOff + f * 4.0, t * 0.06 + seed.tOff);
      let wobble = (pathNoise - 0.5) * 2.5 * seed.amp;

      // High-freq hand tremor jitter
      let jitterNoise = p.noise(seed.jitterOff + f * 18.0, t * 0.12 + seed.tOff);
      let jitter = (jitterNoise - 0.5) * 0.8;

      let { r, angle } = getAngleAtF(f, t);
      let rr = r + wobble + jitter;
      let x = CX + rr * p.cos(angle);
      let y = CY + rr * p.sin(angle);

      if (prevX !== null) {
        // Pressure: smooth thickness variation
        let thickNoise = p.noise(seed.thickOff + f * 5.0, t * 0.04 + seed.tOff);
        let thick = seed.baseThick * p.map(thickNoise, 0, 1, 0.55, 1.55);

        // Ink density: opacity variation
        let alphaNoise = p.noise(seed.angOff + f * 6.0, t * 0.032 + seed.tOff);
        let alpha = p.map(alphaNoise, 0, 1, alphaRange[0], alphaRange[1]);

        p.stroke(col[0], col[1], col[2], alpha);
        p.strokeWeight(thick);
        p.line(prevX, prevY, x, y);
      }

      prevX = x;
      prevY = y;
    }
  }

  // Build a compounding drift array for one arc line, pinned to 0 at both ends.
  function buildDrift(seed, r, t) {
    let driftSteps = ARC_STEPS + 1;
    let raw = new Float32Array(driftSteps);
    raw[0] = 0;
    for (let s = 1; s < driftSteps; s++) {
      let fPrev = (s - 1) / ARC_STEPS;
      let nd = p.noise(seed.rOff + 88.3 + fPrev * 2.5, t * 0.044 + seed.tOff + 3.7);
      raw[s] = raw[s - 1] + (nd - 0.5) * 0.6;
    }
    let driftScale = r * 0.055;
    let endVal = raw[driftSteps - 1];
    for (let s = 0; s < driftSteps; s++) {
      raw[s] = (raw[s] - endVal * (s / ARC_STEPS)) * driftScale;
    }
    return raw;
  }

  function drawHandArc(boundA, boundB, r, col, t, seed, curvature, driftArr) {
    drawHandLine(ARC_STEPS, (f) => {
      let si = Math.round(f * ARC_STEPS);
      let actualR = driftArr[si];

      // Evaluate boundary angles at the actual drawn radius each step,
      // so arcs follow the black lines accurately when they curve dramatically.
      let aA = trueAngle(boundA, actualR, t);
      let aB = trueAngle(boundB, actualR, t);
      let delta = aB - aA;
      while (delta >  p.PI) delta -= p.TWO_PI;
      while (delta < -p.PI) delta += p.TWO_PI;

      // Interpolate strictly between the two boundaries
      let angle = aA + delta * f;

      return { r: actualR, angle };
    }, col, [170, 230], seed, t);
  }

  // Per-frame cache: resolvedAngles[boundIndex][stepIndex] = clamped angle
  let resolvedAngles = [];
  let resolvedFrame = -1;

  // Raw deflected angle for one boundary at radius r, no clamping
  function rawDeflectedAngle(boundIndex, r, t) {
    let baseAngle = boundaryAngle(boundIndex, r, t);
    let ctrls = bezierControls[boundIndex];
    let tRad = p.TWO_PI * t / DURATION;
    let f = r / OUTER_R;
    let angleOffset = 0;
    for (let c = 0; c < ctrls.length; c++) {
      let ctrl = ctrls[c];
      let dist = f - ctrl.rFrac;
      let envelope = Math.exp(-(dist * dist) / (2 * ctrl.width * ctrl.width));
      let osc1 = Math.sin(tRad * ctrl.speed + ctrl.phase);
      let osc2 = Math.sin(tRad * ctrl.speed2 * 2.0 + ctrl.phase2);
      let osc = osc1 + ctrl.harmonic * osc2;
      angleOffset += ctrl.direction * ctrl.amp * envelope * osc;
    }
    return baseAngle + angleOffset;
  }

  // Resolve all boundary angles for the current frame in one sorted pass.
  // Each boundary is clamped against already-resolved neighbours so the true
  // drawn positions of adjacent lines are used as fences — not just base angles.
  function resolveAngles(t) {
    if (resolvedFrame === p.frameCount) return; // already done this frame
    resolvedFrame = p.frameCount;

    const STEPS = RADIAL_STEPS;
    const MIN_GAP = 0.15;

    resolvedAngles = [];
    for (let i = 0; i < NUM_BOUNDS; i++) {
      resolvedAngles[i] = new Float32Array(STEPS + 1);
    }

    for (let s = 0; s <= STEPS; s++) {
      let r = INNER_R + (OUTER_R - INNER_R) * (s / STEPS);

      // Compute raw deflected angle for every boundary
      let raw = new Float32Array(NUM_BOUNDS);
      for (let i = 0; i < NUM_BOUNDS; i++) {
        raw[i] = rawDeflectedAngle(i, r, t);
      }

      // Sort boundaries by their base angle order (they were placed in angular order)
      // and clamp each one so it stays between its resolved neighbours with MIN_GAP.
      // Forward pass: each line must be > previous + MIN_GAP
      for (let i = 0; i < NUM_BOUNDS; i++) {
        let angle = raw[i];
        if (i > 0) {
          let lo = resolvedAngles[i - 1][s] + MIN_GAP;
          // normalise
          while (angle < lo - p.PI) angle += p.TWO_PI;
          while (angle > lo + p.PI) angle -= p.TWO_PI;
          if (angle < lo) angle = lo;
        }
        resolvedAngles[i][s] = angle;
      }

      // Backward pass: each line must be < next - MIN_GAP (handles the last→first wrap)
      for (let i = NUM_BOUNDS - 1; i >= 0; i--) {
        let angle = resolvedAngles[i][s];
        let nextI = (i + 1) % NUM_BOUNDS;
        let hi = resolvedAngles[nextI][s] - MIN_GAP;
        // For the wrap-around pair, adjust hi into same range
        if (i === NUM_BOUNDS - 1) hi = resolvedAngles[0][s] + p.TWO_PI - MIN_GAP;
        while (angle > hi + p.PI) angle -= p.TWO_PI;
        while (angle < hi - p.PI) angle += p.TWO_PI;
        if (angle > hi) angle = hi;
        resolvedAngles[i][s] = angle;
      }
    }

    // Smoothing pass: apply a Gaussian blur along each boundary's angle array
    // to eliminate any kinks introduced by clamping. Multiple passes for strength.
    const SMOOTH_PASSES = 4;
    const SMOOTH_KERNEL = [0.15, 0.20, 0.30, 0.20, 0.15]; // 5-tap Gaussian
    for (let i = 0; i < NUM_BOUNDS; i++) {
      for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
        let src = new Float32Array(resolvedAngles[i]);
        for (let s = 2; s <= STEPS - 2; s++) {
          resolvedAngles[i][s] =
            src[s-2] * SMOOTH_KERNEL[0] +
            src[s-1] * SMOOTH_KERNEL[1] +
            src[s  ] * SMOOTH_KERNEL[2] +
            src[s+1] * SMOOTH_KERNEL[3] +
            src[s+2] * SMOOTH_KERNEL[4];
        }
      }
    }
  }

  // Public API: returns the resolved angle for boundary at radius r this frame.
  function trueAngle(boundIndex, r, t) {
    resolveAngles(t);
    let sf = (r - INNER_R) / (OUTER_R - INNER_R) * RADIAL_STEPS;
    let s0 = Math.max(0, Math.min(RADIAL_STEPS - 1, Math.floor(sf)));
    let s1 = Math.min(RADIAL_STEPS, s0 + 1);
    let frac = sf - s0;
    return resolvedAngles[boundIndex][s0] * (1 - frac) + resolvedAngles[boundIndex][s1] * frac;
  }

  function drawHandBoundary(boundIndex, t) {
    let seed = boundarySeeds[boundIndex];
    drawHandLine(RADIAL_STEPS, (f) => {
      let r = INNER_R + (OUTER_R - INNER_R) * f;
      return { r, angle: trueAngle(boundIndex, r, t) };
    }, [15, 15, 15], [200, 255], seed, t);
  }

  function drawSection(sectionIndex, t) {
    let boundA = sectionIndex;
    let boundB = (sectionIndex + 1) % NUM_BOUNDS;
    let col = SECTION_COLORS[sectionIndex % SECTION_COLORS.length];
    let curvature = (sectionIndex % 2 === 0) ? 1 : -1;
    let n = linesPerSection[sectionIndex];

    // Scale bulge by the angular gap between boundaries at mid-radius,
    // so narrow sections get a flatter arc and avoid acute angles.
    let midR = OUTER_R * 0.5;
    let angA = trueAngle(boundA, midR, t);
    let angB = trueAngle(boundB, midR, t);
    let angGap = angB - angA;
    while (angGap < 0) angGap += p.TWO_PI;
    while (angGap > p.PI) angGap -= p.TWO_PI;
    angGap = Math.abs(angGap);
    let avgGap = p.TWO_PI / NUM_BOUNDS;
    // Bulge scales linearly with section width — narrow sections get near-zero bulge
    let bulgeScale = p.constrain(angGap / avgGap, 0.0, 1.0);

    // 1. For each line compute its base r and bulge+drift at every arc step
    let baseR = new Float32Array(n);
    let allR = []; // allR[li][s] = effective r at step s before clamping

    for (let li = 0; li < n; li++) {
      let f = sectionSpacing[sectionIndex][li];
      let r = INNER_R + (OUTER_R - INNER_R) * f;
      baseR[li] = r;

      let drift = buildDrift(noiseSeeds[sectionIndex][li], r, t);
      let bulgeAmt = curvature * r * 0.18 * bulgeScale;
      let lineR = new Float32Array(ARC_STEPS + 1);
      for (let s = 0; s <= ARC_STEPS; s++) {
        let frac = s / ARC_STEPS;
        lineR[s] = r + bulgeAmt * Math.sin(frac * Math.PI) + drift[s];
      }
      allR.push(lineR);
    }

    // 2. Cap drift magnitude so no line can ever reach its neighbour.
    //    Max drift = half the minimum gap between adjacent base radii.
    //    This means lines stay separated purely through their base spacing —
    //    no hard per-step clamping needed, so paths stay smooth.
    let minLineGap = Math.max(5, (OUTER_R - INNER_R) * 0.01);

    // Find the smallest gap between adjacent base radii
    let sortedBase = Array.from(baseR).sort((a, b) => a - b);
    let smallestGap = Infinity;
    for (let k = 1; k < n; k++) {
      smallestGap = Math.min(smallestGap, sortedBase[k] - sortedBase[k - 1]);
    }
    // Allow drift of at most 40% of the smallest gap so lines can never meet
    let maxDrift = Math.max(0, smallestGap * 0.4 - minLineGap * 0.5);

    // Normalise each drift array so its peak stays within maxDrift
    for (let li = 0; li < n; li++) {
      let peak = 0;
      for (let s = 0; s <= ARC_STEPS; s++) {
        // drift is allR[li][s] - (baseR[li] + bulge at s)
        let frac = s / ARC_STEPS;
        let bulge = (curvature * baseR[li] * 0.18) * Math.sin(frac * Math.PI);
        let drift = allR[li][s] - baseR[li] - bulge;
        peak = Math.max(peak, Math.abs(drift));
      }
      if (peak > maxDrift && peak > 0) {
        let scale = maxDrift / peak;
        for (let s = 0; s <= ARC_STEPS; s++) {
          let frac = s / ARC_STEPS;
          let bulge = (curvature * baseR[li] * 0.18 * bulgeScale) * Math.sin(frac * Math.PI);
          let drift = allR[li][s] - baseR[li] - bulge;
          allR[li][s] = baseR[li] + bulge + drift * scale;
        }
      }
    }

    // 3. Draw each line — no step-by-step clamping, paths stay smooth
    for (let li = 0; li < n; li++) {
      drawHandArc(boundA, boundB, baseR[li], col, t, noiseSeeds[sectionIndex][li], curvature, allR[li]);
    }
  }

  p.draw = function() {
    p.clear();
    p.background(248, 244, 238);

    let t = (p.millis() / 1000) % DURATION;

    // Gently drift the centerpoint using slow noise — wanders up to ~4% of canvas
    let driftAmt = Math.min(baseCX, baseCY) * 0.04;
    CX = baseCX + (p.noise(t * 0.05, 0.0) - 0.5) * 2 * driftAmt;
    CY = baseCY + (p.noise(0.0, t * 0.05 + 99.3) - 0.5) * 2 * driftAmt;

    p.noFill();
    for (let i = 0; i < NUM_BOUNDS; i++) {
      drawSection(i, t);
    }

    for (let i = 0; i < NUM_BOUNDS; i++) {
      drawHandBoundary(i, t);
    }

    // Center dot
    p.noStroke();
    p.fill(30, 30, 30);
    p.circle(CX, CY, 5);
  };

});
