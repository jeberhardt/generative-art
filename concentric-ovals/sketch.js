new p5(function(p) {

  const COLORS = [
    '#d94040','#e8673a','#e8943a','#e8c43a',
    '#7bc44a','#3aae6e','#3a9e8e','#3a6eb5',
    '#4a4ab5','#7a3ab5','#c43a8e','#e03a7a',
    '#8B5E3C','#3aaeae','#1a7a4a','#c47a3a',
    '#6a3ab5','#3ab5a0','#b53a6a','#5a8a2a',
  ];

  let W, H;
  let ovals = [];

  p.setup = function() {
    W = p.windowWidth;
    H = p.windowHeight;
    p.createCanvas(W, H);
    p.noLoop();
    p.randomSeed(99);
    p.noiseSeed(42);
    packOvals();
  };

  p.windowResized = function() {
    W = p.windowWidth;
    H = p.windowHeight;
    p.resizeCanvas(W, H);
    p.randomSeed(99);
    p.noiseSeed(42);
    packOvals();
    p.redraw();
  };

  function packOvals() {
    ovals = [];

    const maxOvals = Math.floor(W * H / 8000);
    const minR = 18;
    const maxR = 88;
    const pad = 6;
    const MIN_RINGS = 5;
    let colorIdx = 0;

    function makeRingRadii(r, rings) {
      const weights = [];
      for (let i = 0; i < rings; i++) weights.push(p.random(0.3, 1.0));
      const total = weights.reduce((a, b) => a + b, 0);
      const ringRadii = [r];
      let remaining = r;
      for (let i = 0; i < rings - 1; i++) {
        remaining -= (weights[i] / total) * r;
        ringRadii.push(remaining);
      }
      ringRadii.push(0);
      return ringRadii;
    }

    function makeOvalProps(cx, cy, r) {
      // aspect < 1 means ry < rx, so rx is always the widest axis.
      // The bounding circle radius is r = rx — nothing ever protrudes beyond it.
      const aspect  = p.random(0.72, 0.95);
      const angle   = p.random(-0.28, 0.28);
      const rings   = Math.max(MIN_RINGS, Math.round(p.map(r, minR, maxR, MIN_RINGS, 14)));
      const shape   = p.random() < 0.2 ? 'teardrop' : 'oval';
      const col     = COLORS[colorIdx % COLORS.length];
      const ringRadii = makeRingRadii(r, rings);
      colorIdx++;
      // rx = r (widest), ry = r * aspect (narrower). Bounding circle = r.
      return { cx, cy, r, rx: r, ry: r * aspect, angle, col, rings, shape, ringRadii };
    }

    function overlapsAny(cx, cy, r) {
      for (let ov of ovals) {
        const d = p.dist(cx, cy, ov.cx, ov.cy);
        if (d < r + ov.r - 0.3) return true;
      }
      return false;
    }

    function inBounds(cx, cy, r) {
      return cx - r >= pad && cx + r <= W - pad &&
             cy - r >= pad && cy + r <= H - pad;
    }

    const r0 = p.random(50, maxR);
    ovals.push(makeOvalProps(
      W / 2 + p.random(-40, 40),
      H / 2 + p.random(-40, 40),
      r0
    ));

    const maxAttempts = maxOvals * 600;
    let attempts = 0;

    while (ovals.length < maxOvals && attempts < maxAttempts) {
      attempts++;
      const parent = ovals[Math.floor(p.random(ovals.length))];
      const newR   = p.random(minR, maxR);
      const ang    = p.random(p.TWO_PI);
      const dist   = parent.r + newR;
      const cx     = parent.cx + dist * Math.cos(ang);
      const cy     = parent.cy + dist * Math.sin(ang);

      if (!inBounds(cx, cy, newR)) continue;
      if (overlapsAny(cx, cy, newR)) continue;

      ovals.push(makeOvalProps(cx, cy, newR));
    }

    // Cull any circle with no touching neighbour
    const EPS = 2.0;
    ovals = ovals.filter((ov, i) => {
      for (let j = 0; j < ovals.length; j++) {
        if (i === j) continue;
        const d = p.dist(ov.cx, ov.cy, ovals[j].cx, ovals[j].cy);
        if (d <= ov.r + ovals[j].r + EPS) return true;
      }
      return false;
    });
  }

  p.draw = function() {
    p.background(252, 250, 245);
    for (let ov of ovals) drawOval(ov);
  };

  function drawOval(ov) {
    const { cx, cy, rx, ry, angle, col, rings, shape, ringRadii } = ov;
    p.noFill();
    p.stroke(col);
    p.strokeWeight(1.2);

    p.push();
    p.translate(cx, cy);
    p.rotate(angle);

    for (let i = 0; i <= rings; i++) {
      const rr      = ringRadii[i];
      const crx     = rr;
      const cry     = rr * (ry / rx);   // aspect ratio preserved
      const isOuter = (i === 0);        // outermost ring: no wobble

      if (shape === 'teardrop' && i < rings) {
        drawTeardrop(crx, cry, i, isOuter);
      } else {
        drawWobblyEllipse(crx, cry, i, isOuter);
      }
    }

    p.strokeWeight(2.2);
    p.point(p.random(-1.2, 1.2), p.random(-1.2, 1.2));
    p.pop();
  }

  // noWobble=true on the outermost ring so it sits exactly at bounding radius
  function drawWobblyEllipse(rx, ry, ringIdx, noWobble) {
    if (rx < 1 || ry < 1) return;
    const pts    = 60;
    const wobble = noWobble ? 0 : p.map(rx, 3, 90, 0.2, 1.8);
    p.beginShape();
    for (let i = 0; i <= pts; i++) {
      const theta = (i / pts) * p.TWO_PI;
      const nx = p.noise(ringIdx * 10 + p.cos(theta) * 1.5, p.sin(theta) * 1.5);
      const ny = p.noise(ringIdx * 10 + 99 + p.cos(theta) * 1.5, p.sin(theta) * 1.5);
      const dx = p.map(nx, 0, 1, -wobble, wobble);
      const dy = p.map(ny, 0, 1, -wobble, wobble);
      p.curveVertex(rx * p.cos(theta) + dx, ry * p.sin(theta) + dy);
    }
    p.endShape(p.CLOSE);
  }

  function drawTeardrop(rx, ry, ringIdx, noWobble) {
    if (rx < 1 || ry < 1) return;
    const pts    = 60;
    const wobble = noWobble ? 0 : p.map(rx, 3, 90, 0.2, 1.6);
    p.beginShape();
    for (let i = 0; i <= pts; i++) {
      const theta   = (i / pts) * p.TWO_PI;
      const squeeze = 1 + 0.35 * p.cos(theta + p.PI);
      const nx = p.noise(ringIdx * 5 + p.cos(theta) * 1.5 + 200, p.sin(theta) * 1.5);
      const ny = p.noise(ringIdx * 5 + p.cos(theta) + 300, p.sin(theta));
      const dx = p.map(nx, 0, 1, -wobble, wobble);
      const dy = p.map(ny, 0, 1, -wobble, wobble);
      p.curveVertex(rx * p.cos(theta) * squeeze + dx, ry * p.sin(theta) + dy);
    }
    p.endShape(p.CLOSE);
  }

});
