// p5.js sketch: hand-drawn "plus tile" shapes with double outlines
// Paste into https://editor.p5js.org/

let paperCol, inkCol;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);

  paperCol = color(238, 231, 222);   // warm off-white paper
  inkCol   = color(38, 120, 158);    // blue marker-ish

  noLoop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(paperCol);

  // subtle paper grain
  noStroke();
  for (let i = 0; i < 25000; i++) {
    const x = random(width), y = random(height);
    const a = random(6, 14);
    fill(255, 255, 255, a);
    rect(x, y, 1, 1);
  }

  // Plus shapes - arranged with small 5-20px gaps between crosses
  // Every other row is offset for a staggered pattern
  // Each cross has arms extending size/2 from center
  const shapes = [
    // Row 1 (offset right)
    { x: 100, y: 100, s: 100 },
    { x: 230, y: 100, s: 90 },
    { x: 350, y: 100, s: 80 },
    { x: 460, y: 100, s: 100 },
    { x: 590, y: 100, s: 70 },
    { x: 690, y: 100, s: 90 },
    { x: 810, y: 100, s: 80 },
    
    // Row 2 (offset left) - gap of ~100-120px vertically
    { x: 60, y: 200, s: 110 },
    { x: 200, y: 200, s: 100 },
    { x: 330, y: 200, s: 90 },
    { x: 450, y: 200, s: 80 },
    { x: 560, y: 200, s: 100 },
    { x: 690, y: 200, s: 90 },
    { x: 820, y: 200, s: 70 },
    
    // Row 3 (offset right)
    { x: 100, y: 300, s: 90 },
    { x: 220, y: 300, s: 80 },
    { x: 330, y: 300, s: 110 },
    { x: 470, y: 300, s: 90 },
    { x: 590, y: 300, s: 70 },
    { x: 690, y: 300, s: 100 },
    { x: 820, y: 300, s: 80 },
    
    // Row 4 (offset left)
    { x: 60, y: 400, s: 120 },
    { x: 210, y: 400, s: 100 },
    { x: 340, y: 400, s: 80 },
    { x: 450, y: 400, s: 90 },
    { x: 570, y: 400, s: 110 },
    { x: 710, y: 400, s: 80 },
    { x: 820, y: 400, s: 100 },
    
    // Row 5 (offset right)
    { x: 100, y: 500, s: 80 },
    { x: 210, y: 500, s: 100 },
    { x: 340, y: 500, s: 90 },
    { x: 460, y: 500, s: 70 },
    { x: 560, y: 500, s: 80 },
    { x: 670, y: 500, s: 100 },
    { x: 800, y: 500, s: 90 },
    
    // Row 6 (offset left)
    { x: 60, y: 600, s: 100 },
    { x: 200, y: 600, s: 90 },
    { x: 320, y: 600, s: 110 },
    { x: 460, y: 600, s: 80 },
    { x: 570, y: 600, s: 100 },
    { x: 700, y: 600, s: 90 },
    { x: 820, y: 600, s: 80 },
    
    // Row 7 (offset right)
    { x: 100, y: 700, s: 90 },
    { x: 220, y: 700, s: 80 },
    { x: 330, y: 700, s: 100 },
    { x: 460, y: 700, s: 90 },
    { x: 580, y: 700, s: 70 },
    { x: 680, y: 700, s: 100 },
    { x: 810, y: 700, s: 80 },
    
    // Row 8 (offset left)
    { x: 60, y: 800, s: 110 },
    { x: 200, y: 800, s: 100 },
    { x: 330, y: 800, s: 80 },
    { x: 440, y: 800, s: 90 },
    { x: 560, y: 800, s: 100 },
    { x: 690, y: 800, s: 80 },
    { x: 810, y: 800, s: 90 },
  ];

  // Draw each plus shape
  for (let i = 0; i < shapes.length; i++) {
    const p = shapes[i];
    
    drawDoubleOutlinedPlus(
      p.x,
      p.y,
      p.s,
      inkCol
    );
  }
}

// Cross/plus made from a polyomino outline
function plusVertices(size, inset = 0) {
  const u = (size / 3);
  const r = u - inset;

  const pts = [
    [-u, -3*u], [ u, -3*u], [ u, -u], [ 3*u, -u],
    [ 3*u,  u], [ u,  u], [ u,  3*u], [-u,  3*u],
    [-u,  u], [-3*u,  u], [-3*u, -u], [-u, -u]
  ];

  const out = [];
  for (const [x, y] of pts) {
    let ix = x;
    let iy = y;

    if (x > 0) ix -= inset;
    if (x < 0) ix += inset;
    if (y > 0) iy -= inset;
    if (y < 0) iy += inset;

    out.push(createVector(ix, iy));
  }

  for (const v of out) {
    if (abs(v.x) === 3*u - inset) v.x = (3*u - inset) * 0.985 * Math.sign(v.x);
    if (abs(v.y) === 3*u - inset) v.y = (3*u - inset) * 0.985 * Math.sign(v.y);
  }

  return out;
}

// Hand-drawn wobble along edges
function wobble(poly, seed, amp) {
  noiseSeed(seed);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const v = poly[i].copy();
    const n1 = noise(v.x * 0.01 + 10.1, v.y * 0.01 + 20.2);
    const n2 = noise(v.x * 0.01 + 40.3, v.y * 0.01 + 50.4);
    v.x += map(n1, 0, 1, -amp, amp);
    v.y += map(n2, 0, 1, -amp, amp);
    out.push(v);
  }
  return out;
}

function drawPoly(poly) {
  beginShape();
  for (let i = 0; i < poly.length; i++) {
    vertex(poly[i].x, poly[i].y);
  }
  endShape(CLOSE);
}

function drawDoubleOutlinedPlus(x, y, size, col) {
  push();
  translate(x, y);

  // Tiny rotation for hand-drawn feel
  rotate(radians(random(-6, 6)));

  // Outer line
  stroke(col);
  strokeWeight(7);
  strokeJoin(ROUND);
  strokeCap(ROUND);
  noFill();

  let outer = plusVertices(size, 0);
  outer = wobble(outer, int(random(1e6)), 10);
  drawPoly(outer);

  // Faint retrace line
  strokeWeight(2.2);
  stroke(red(col), green(col), blue(col), 130);
  let retrace = wobble(plusVertices(size, 0), int(random(1e6)), 7);
  drawPoly(retrace);

  pop();
}
