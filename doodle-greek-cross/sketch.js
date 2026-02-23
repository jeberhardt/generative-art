// p5.js sketch: Uniform interlocking Greek crosses in brick pattern
// All crosses are the same size (100px) with even interlocking

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);

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
      drawGreekCross(x, y, size);
      x += spacingX;
    }
    
    y += spacingY;
    row++;
  }
  
  pop();
}

// Draw a clean geometric Greek cross outline (plus sign)
function drawGreekCross(x, y, size) {
  push();
  translate(x, y);
  
  noFill();
  stroke(0);
  strokeWeight(3);
  
  // Greek cross: arms sized so there's always 10px gap between any tabs
  const armWidth = size * 0.95;  // arms are 95% of size = 95px
  const extent = size;
  
  // Draw as centered cross outline
  beginShape();
  vertex(-armWidth/2, -extent);
  vertex(armWidth/2, -extent);
  vertex(armWidth/2, -armWidth/2);
  vertex(extent, -armWidth/2);
  vertex(extent, armWidth/2);
  vertex(armWidth/2, armWidth/2);
  vertex(armWidth/2, extent);
  vertex(-armWidth/2, extent);
  vertex(-armWidth/2, armWidth/2);
  vertex(-extent, armWidth/2);
  vertex(-extent, -armWidth/2);
  vertex(-armWidth/2, -armWidth/2);
  endShape(CLOSE);
  
  pop();
}
