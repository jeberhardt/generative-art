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
  redraw();
}

function draw() {
  background(paperCol);

  // subtle paper grain - scales with canvas size
  noStroke();
  const grainCount = (width * height) / 400;  // maintain consistent density
  for (let i = 0; i < grainCount; i++) {
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
  
  // Scale size based on canvas dimensions
  const baseSize = min(width, height);
  const size = baseSize * 0.12;  // Cross extent scales with canvas
  const gap = size * 0.1;  // Gap also scales proportionally
  
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

// Cross/plus made from a polyomino outline with asymmetric arm widths
function plusVertices(size, armWidthTop, armWidthRight, armWidthBottom, armWidthLeft) {
  // Each arm can have different width - creates asymmetric cross
  // Gap between arms = size - armWidth
  // For gap of 5-10px: armWidth = 90-95 (when size=100)
  
  const pts = [
    [-armWidthLeft/2, -size],        // top-left of top arm
    [ armWidthRight/2, -size],        // top-right of top arm
    [ armWidthRight/2, -armWidthTop/2],    // inner corner TR
    [ size, -armWidthTop/2],          // top-right of right arm
    [ size, armWidthBottom/2],        // bottom-right of right arm
    [ armWidthRight/2, armWidthBottom/2],   // inner corner BR
    [ armWidthRight/2, size],         // bottom-right of bottom arm
    [-armWidthLeft/2, size],          // bottom-left of bottom arm
    [-armWidthLeft/2, armWidthBottom/2],   // inner corner BL
    [-size, armWidthBottom/2],         // bottom-left of left arm
    [-size, -armWidthTop/2],          // top-left of left arm
    [-armWidthLeft/2, -armWidthTop/2]      // inner corner TL
  ];

  const out = [];
  for (const [x, y] of pts) {
    out.push(createVector(x, y));
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
  
  // Random arm widths between 90-95% of size to get gap of 5-10%
  const armWidthTop    = size * random(0.90, 0.95);
  const armWidthRight  = size * random(0.90, 0.95);
  const armWidthBottom = size * random(0.90, 0.95);
  const armWidthLeft   = size * random(0.90, 0.95);
  
  // Draw Greek cross with noticeable wobble for irregularity
  let cross = plusVertices(size, armWidthTop, armWidthRight, armWidthBottom, armWidthLeft);
  cross = wobble(cross, int(random(1e6)), size * 0.15);
  
  // Random pressure sensitivity - draw multiple passes with varying thickness
  const pressurePasses = 3;
  for (let p = 0; p < pressurePasses; p++) {
    // Random stroke weight per pass to simulate pressure variation
    const pressure = size * random(0.015, 0.04);
    stroke(red(inkCol), green(inkCol), blue(inkCol), 150 + random(50));
    strokeWeight(pressure);
    drawPoly(cross);
  }
  
  pop();
}
