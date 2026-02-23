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

  // Place Greek crosses using collision detection for no overlap
  const shapes = [];
  const minGap = 3; // small gap between Greek crosses
  const maxAttempts = 20000;
  const sizes = [55, 65, 75, 85];
  
  let placed = 0;
  let failed = 0;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = random(sizes);
    // Greek cross extends 's' from center in cardinal directions
    const extent = s;
    const margin = 45;
    const x = random(extent + margin, width - extent - margin);
    const y = random(extent + margin, height - extent - margin);
    
    let overlaps = false;
    for (const existing of shapes) {
      // Calculate distance between centers
      const dist = sqrt(pow(x - existing.x, 2) + pow(y - existing.y, 2));
      // Need at least sum of extents + gap to not overlap
      const requiredDist = extent + existing.s + minGap;
      
      if (dist < requiredDist) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      shapes.push({ x, y, s });
      placed++;
    } else {
      failed++;
    }
    
    // Continue until we've placed enough or can't find more spots
    if (shapes.length > 500 || (failed > 10000 && shapes.length > 50)) {
      break;
    }
  }
  
  console.log(`Placed ${placed}, failed ${failed}, total: ${shapes.length}`);

  // Calculate rotations based on neighbors
  const rotations = [];
  for (let i = 0; i < shapes.length; i++) {
    const p = shapes[i];
    
    // Find nearby neighbors and calculate influenced rotation
    let totalAngle = 0;
    let neighborCount = 0;
    
    for (let j = 0; j < shapes.length; j++) {
      if (i === j) continue;
      const other = shapes[j];
      const dist = sqrt(pow(p.x - other.x, 2) + pow(p.y - other.y, 2));
      
      // If close neighbor, influence rotation
      if (dist < 100) {
        const neighborBaseAngle = sin(other.x * 0.012) * 14 + cos(other.y * 0.012) * 9;
        totalAngle += neighborBaseAngle;
        neighborCount++;
      }
    }
    
    // Base angle from own position + neighbor influence
    const baseAngle = sin(p.x * 0.012) * 14 + cos(p.y * 0.012) * 9;
    if (neighborCount > 0) {
      rotations[i] = (baseAngle * 0.45) + (totalAngle / neighborCount) * 0.55 + random(-2, 2);
    } else {
      rotations[i] = baseAngle + random(-3, 3);
    }
  }
  
  // Draw each plus shape with neighbor-influenced rotations
  for (let i = 0; i < shapes.length; i++) {
    const p = shapes[i];
    drawDoubleOutlinedPlus(
      p.x,
      p.y,
      p.s,
      inkCol,
      rotations[i]
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

function drawDoubleOutlinedPlus(x, y, size, col, rotationAngle) {
  push();
  translate(x, y);

  // Use the passed-in rotation (influenced by neighbors)
  rotate(radians(rotationAngle));

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
    stroke(red(col), green(col), blue(col), 150 + random(50));
    strokeWeight(pressure);
    drawPoly(cross);
  }

  pop();
}
