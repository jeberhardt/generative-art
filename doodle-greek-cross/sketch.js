// p5.js sketch: Hand-drawn Greek crosses in brick pattern
// Uses the hand-drawn style from the doodle folder

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

  // Rotate the entire canvas randomly between 25-65 degrees
  const rotationAngle = random(25, 65);
  
  push();
  translate(width/2, height/2);
  rotate(radians(rotationAngle));
  translate(-width/2, -height/2);

  // All crosses are 100px (extent from center)
  const size = 100;
  const gap = 10;
  
  // A Greek cross with extent 'size' has total width = 2*size
  const spacingX = size * 2 + gap;
  const spacingY = size * 1.5 + gap;
  
  // Offset for brick pattern (half width)
  const offsetX = size + gap / 2;
  
  // Draw crosses in brick pattern - start above visible canvas
  let row = 0;
  let y = -size * 6;
  
  while (y < height + size * 6) {
    const xOffset = (row % 2 === 1) ? offsetX : 0;
    let x = -size * 4 + xOffset;
    
    while (x < width + size * 4) {
      drawHandDrawnGreekCross(x, y, size);
      x += spacingX;
    }
    
    y += spacingY;
    row++;
  }
  
  pop();
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

// Draw a hand-drawn Greek cross with wobble and pressure variation
function drawHandDrawnGreekCross(x, y, size) {
  push();
  translate(x, y);
  
  strokeJoin(ROUND);
  strokeCap(ROUND);
  noFill();
  
  // Draw Greek cross with noticeable wobble for irregularity
  let cross = plusVertices(size, 0);
  cross = wobble(cross, int(random(1e6)), 15);
  
  // Random pressure sensitivity - draw multiple passes with varying thickness
  const pressurePasses = 3;
  for (let p = 0; p < pressurePasses; p++) {
    // Random stroke weight per pass (1.5 to 4) to simulate pressure variation
    const pressure = random(1.5, 4);
    stroke(red(inkCol), green(inkCol), blue(inkCol), 150 + random(50));
    strokeWeight(pressure);
    drawPoly(cross);
  }
  
  pop();
}
