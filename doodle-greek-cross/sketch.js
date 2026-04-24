// p5.js sketch: Hand-drawn Greek crosses in brick pattern
// Uses the hand-drawn style from the doodle folder

let paperCol, inkCol;
let crosses = [];  // Store cross data for interactivity
let rotationAngle;
let baseSize, size, gap, spacingX, spacingY, offsetX;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);

  paperCol = color(238, 231, 222);   // warm off-white paper
  inkCol   = color(38, 120, 158);    // blue marker-ish

  // Use seeded random for consistent cross shapes
  randomSeed(42);
  rotationAngle = random(25, 65);
  
  calculateDimensions();
  generateCrosses();
  
  loop();
}

function calculateDimensions() {
  baseSize = min(width, height);
  size = baseSize * 0.12;  // Cross extent scales with canvas
  gap = size * 0.1;  // Gap also scales proportionally
  
  // A Greek cross with extent 'size' has total width = 2*size
  spacingX = size * 2 + gap;
  spacingY = size * 1.5 + gap;
  
  // Offset for brick pattern (half width)
  offsetX = size + gap / 2;
}

function generateCrosses() {
  crosses = [];
  randomSeed(42);  // Reset seed for consistent cross shapes
  
  let row = 0;
  let y = -size * 6;
  
  while (y < height + size * 6) {
    const xOffset = (row % 2 === 1) ? offsetX : 0;
    let x = -size * 4 + xOffset;
    
    while (x < width + size * 4) {
      // Generate random arm widths for this cross (seeded)
      const armWidthTop    = size * random(0.90, 0.95);
      const armWidthRight  = size * random(0.90, 0.95);
      const armWidthBottom = size * random(0.90, 0.95);
      const armWidthLeft   = size * random(0.90, 0.95);
      
      crosses.push({
        x: x,
        y: y,
        size: size,
        armWidthTop,
        armWidthRight,
        armWidthBottom,
        armWidthLeft,
        alpha: 255,
        fading: false,
        // Pre-compute random values for consistent rendering
        wobbleSeed: int(x * 10000 + y),
        pressureOffsets: [random(1), random(1), random(1)]
      });
      
      x += spacingX;
    }
    
    y += spacingY;
    row++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  randomSeed(42);
  rotationAngle = random(25, 65);
  calculateDimensions();
  generateCrosses();
}

function draw() {
  background(paperCol);

  // subtle paper grain - use static random seed for consistent positions
  noStroke();
  const grainCount = (width * height) / 400;
  randomSeed(123);  // Fixed seed for consistent grain
  for (let i = 0; i < grainCount; i++) {
    const x = random(width), y = random(height);
    const a = random(6, 14);
    fill(255, 255, 255, a);
    rect(x, y, 1, 1);
  }

  push();
  translate(width/2, height/2);
  rotate(radians(rotationAngle));
  translate(-width/2, -height/2);
  
  // Draw all crosses
  for (let cross of crosses) {
    if (cross.alpha > 0) {
      drawHandDrawnGreekCross(cross);
    }
  }
  
  pop();
}

function mousePressed() {
  // Transform mouse coordinates to rotated canvas space
  let mx = mouseX - width/2;
  let my = mouseY - height/2;
  
  // Rotate the point in the opposite direction
  let rx = mx * cos(radians(-rotationAngle)) - my * sin(radians(-rotationAngle));
  let ry = mx * sin(radians(-rotationAngle)) + my * cos(radians(-rotationAngle));
  
  rx += width/2;
  ry += height/2;
  
  // Check each cross for click
  for (let cross of crosses) {
    if (!cross.fading && isPointInCross(rx, ry, cross)) {
      cross.fading = true;
      break;  // Only fade one at a time
    }
  }
}

function isPointInCross(px, py, cross) {
  // Check if point is within the cross bounds (approximate as bounding box)
  const halfSize = cross.size;
  const halfArm = max(cross.armWidthTop, cross.armWidthRight, cross.armWidthBottom, cross.armWidthLeft) / 2;
  
  // Bounding box of the cross
  const left = cross.x - halfSize;
  const right = cross.x + halfSize;
  const top = cross.y - halfSize;
  const bottom = cross.y + halfSize;
  
  if (px < left || px > right || py < top || py > bottom) {
    return false;
  }
  
  // More precise check: is point in any arm?
  const ax = cross.armWidthRight / 2;
  const bx = cross.armWidthLeft / 2;
  const ay = cross.armWidthBottom / 2;
  const by = cross.armWidthTop / 2;
  
  const cx = cross.x;
  const cy = cross.y;
  
  // Check horizontal arm (center strip)
  if (py >= cy - ay && py <= cy + ay && px >= cx - halfSize && px <= cx + halfSize) {
    return true;
  }
  
  // Check vertical arm (center strip)
  if (px >= cx - bx && px <= cx + ax && py >= cy - halfSize && py <= cy + halfSize) {
    return true;
  }
  
  return false;
}

// Cross/plus made from a polyomino outline with asymmetric arm widths
function plusVertices(size, armWidthTop, armWidthRight, armWidthBottom, armWidthLeft) {
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
function drawHandDrawnGreekCross(cross) {
  push();
  translate(cross.x, cross.y);
  
  strokeJoin(ROUND);
  strokeCap(ROUND);
  noFill();
  
  // Use stored arm widths
  const armWidthTop    = cross.armWidthTop;
  const armWidthRight  = cross.armWidthRight;
  const armWidthBottom = cross.armWidthBottom;
  const armWidthLeft   = cross.armWidthLeft;
  
  // Draw Greek cross with wobble
  let crossShape = plusVertices(cross.size, armWidthTop, armWidthRight, armWidthBottom, armWidthLeft);
  crossShape = wobble(crossShape, cross.wobbleSeed, cross.size * 0.15);
  
  // Handle fading
  if (cross.fading) {
    cross.alpha -= 8;  // Fade speed
    if (cross.alpha < 0) cross.alpha = 0;
  }
  
  // Random pressure sensitivity - use pre-computed offsets for consistent rendering
  const pressurePasses = 3;
  for (let p = 0; p < pressurePasses; p++) {
    const pressure = cross.size * (0.025 + cross.pressureOffsets[p] * 0.015);
    stroke(red(inkCol), green(inkCol), blue(inkCol), cross.alpha * (0.7 + cross.pressureOffsets[p] * 0.2));
    strokeWeight(pressure);
    drawPoly(crossShape);
  }
  
  pop();
}
