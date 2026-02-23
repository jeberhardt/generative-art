let trainT = 0; // Position along track (0 to 1)
let smokeParticles = [];
let trackLength = 0;
let trackSamples = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  calculateTrackLength();
}

function calculateTrackLength() {
  // Pre-calculate track positions and cumulative distances
  trackSamples = [];
  let prevX = 0, prevY = 0;
  trackLength = 0;
  
  for (let t = 0; t <= 1; t += 0.001) {
    let pos = getTrackPositionRaw(t);
    if (t > 0) {
      let dx = pos.x - prevX;
      let dy = pos.y - prevY;
      trackLength += sqrt(dx * dx + dy * dy);
    }
    trackSamples.push({ t: t, distance: trackLength });
    prevX = pos.x;
    prevY = pos.y;
  }
}

function getTFromDistance(targetDistance) {
  // Convert distance along track to t parameter
  if (targetDistance <= 0) return 0;
  if (targetDistance >= trackLength) return 1;
  
  // Handle wrapping
  while (targetDistance < 0) targetDistance += trackLength;
  while (targetDistance > trackLength) targetDistance -= trackLength;
  
  // Binary search for the right t value
  for (let i = 1; i < trackSamples.length; i++) {
    if (trackSamples[i].distance >= targetDistance) {
      let d1 = trackSamples[i - 1].distance;
      let d2 = trackSamples[i].distance;
      let t1 = trackSamples[i - 1].t;
      let t2 = trackSamples[i].t;
      let ratio = (targetDistance - d1) / (d2 - d1);
      return t1 + ratio * (t2 - t1);
    }
  }
  return 1;
}

function draw() {
  background(220);
  
  // Define control points for the curved track
  let startX = 0;
  let startY = 0;
  let endX = width;
  let endY = height;
  
  // Control points for the curves
  let cp1x = width * 0.3;
  let cp1y = height * 0.2;
  let cp2x = width * 0.4;
  let cp2y = height * 0.5;
  let cp3x = width * 0.6;
  let cp3y = height * 0.5;
  let cp4x = width * 0.7;
  let cp4y = height * 0.8;
  
  // Draw railroad ties first (behind rails)
  stroke(139, 90, 43);
  strokeWeight(3);
  for (let t = 0; t <= 1; t += 0.02) {
    let pos = getTrackPositionRaw(t);
    let angle = getTrackAngleRaw(t);
    
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    line(-20, 0, 20, 0);
    pop();
  }
  
  // Draw two parallel rails
  let railOffset = 12;
  
  // Left rail
  stroke(80, 50, 20);
  strokeWeight(3);
  beginShape();
  for (let t = 0; t <= 1; t += 0.01) {
    let pos = getTrackPositionRaw(t);
    let angle = getTrackAngleRaw(t);
    let offsetX = cos(angle + HALF_PI) * railOffset;
    let offsetY = sin(angle + HALF_PI) * railOffset;
    vertex(pos.x + offsetX, pos.y + offsetY);
  }
  endShape();
  
  // Right rail
  beginShape();
  for (let t = 0; t <= 1; t += 0.01) {
    let pos = getTrackPositionRaw(t);
    let angle = getTrackAngleRaw(t);
    let offsetX = cos(angle - HALF_PI) * railOffset;
    let offsetY = sin(angle - HALF_PI) * railOffset;
    vertex(pos.x + offsetX, pos.y + offsetY);
  }
  endShape();
  
  // Update train position (move by distance per frame)
  let speed = 2; // pixels per frame
  let currentDistance = trainT * trackLength;
  currentDistance += speed;
  if (currentDistance > trackLength) currentDistance -= trackLength;
  trainT = currentDistance / trackLength;
  
  // Fixed visual gap between all cars and engine (in pixels)
  let visualGap = 15;
  
  // Engine body width: 50 (extends 25 back from center)
  // Car body width: 40 (extends 20 front/back from center)
  // For equal visual gaps:
  // Engine-to-car spacing = visualGap + 25 (engine back) + 20 (car front) = 60
  // Car-to-car spacing = visualGap + 20 (car back) + 20 (car front) = 55
  let engineToCarSpacing = visualGap + 45; // 60
  let carSpacing = visualGap + 40; // 55
  
  // Draw train cars (from back to front)
  let carColors = ['#8B4513', '#A0522D', '#CD853F']; // 3 cars
  
  // Draw 3 cars first (behind engine)
  for (let i = 0; i < 3; i++) {
    let carDistance;
    if (i === 0) {
      // First car uses engine-to-car spacing
      carDistance = currentDistance - engineToCarSpacing;
    } else {
      // Other cars use standard car spacing
      carDistance = currentDistance - engineToCarSpacing - i * carSpacing;
    }
    let carT = getTFromDistance(carDistance);
    drawTrainCar(carT, carColors[i]);
  }
  
  // Draw engine
  drawEngine(trainT);
  
  // Update and draw smoke particles
  updateSmoke();
}

function getTrackPositionRaw(t) {
  let x, y;
  if (t <= 0.5) {
    x = bezierPoint(0, width * 0.3, width * 0.4, width * 0.5, t * 2);
    y = bezierPoint(0, height * 0.2, height * 0.5, height * 0.5, t * 2);
  } else {
    x = bezierPoint(width * 0.5, width * 0.6, width * 0.7, width, (t - 0.5) * 2);
    y = bezierPoint(height * 0.5, height * 0.5, height * 0.8, height, (t - 0.5) * 2);
  }
  return { x, y };
}

function getTrackAngleRaw(t) {
  let dx, dy;
  if (t <= 0.5) {
    dx = bezierTangent(0, width * 0.3, width * 0.4, width * 0.5, t * 2);
    dy = bezierTangent(0, height * 0.2, height * 0.5, height * 0.5, t * 2);
  } else {
    dx = bezierTangent(width * 0.5, width * 0.6, width * 0.7, width, (t - 0.5) * 2);
    dy = bezierTangent(height * 0.5, height * 0.5, height * 0.8, height, (t - 0.5) * 2);
  }
  return atan2(dy, dx);
}

function drawEngine(t) {
  let pos = getTrackPositionRaw(t);
  let angle = getTrackAngleRaw(t);
  
  push();
  translate(pos.x, pos.y);
  rotate(angle);
  
  // Engine body
  fill(50, 50, 50);
  stroke(30);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, 50, 25, 3);
  
  // Cabin
  fill(70, 70, 70);
  rect(-10, 0, 20, 30, 2);
  
  // Chimney
  fill(40);
  rect(18, -15, 10, 10, 2);
  
  // Front
  fill(60, 60, 60);
  rect(22, 0, 15, 20, 3);
  
  // Wheels
  fill(30);
  stroke(20);
  ellipse(-15, 15, 12, 12);
  ellipse(10, 15, 12, 12);
  ellipse(-15, -15, 12, 12);
  ellipse(10, -15, 12, 12);
  
  // Add smoke
  if (frameCount % 5 === 0) {
    smokeParticles.push({
      x: pos.x + cos(angle) * 18 + cos(angle + HALF_PI) * (-15),
      y: pos.y + sin(angle) * 18 + sin(angle + HALF_PI) * (-15),
      vx: random(-0.5, 0.5),
      vy: random(-1, -0.5),
      size: random(8, 15),
      alpha: 200
    });
  }
  
  pop();
}

function drawTrainCar(t, carColor) {
  let pos = getTrackPositionRaw(t);
  let angle = getTrackAngleRaw(t);
  
  push();
  translate(pos.x, pos.y);
  rotate(angle);
  
  // Car body
  fill(carColor);
  stroke(60, 40, 20);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, 40, 20, 2);
  
  // Wheels
  fill(30);
  stroke(20);
  ellipse(-12, 12, 10, 10);
  ellipse(12, 12, 10, 10);
  ellipse(-12, -12, 10, 10);
  ellipse(12, -12, 10, 10);
  
  pop();
}

function updateSmoke() {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    let p = smokeParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.size += 0.3;
    p.alpha -= 3;
    
    // Draw smoke
    noStroke();
    fill(200, 200, 200, p.alpha);
    ellipse(p.x, p.y, p.size, p.size);
    
    // Remove faded particles
    if (p.alpha <= 0) {
      smokeParticles.splice(i, 1);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateTrackLength();
}
