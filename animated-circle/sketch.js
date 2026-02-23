// Ball class to represent each basketball
class Ball {
  constructor(x, y) {
    this.xPos = x;
    this.yPos = y;
    this.yVelocity = 0;
    this.xVelocity = 0;
    this.circleSize = 30; // Smaller size for additional balls
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.isAtRest = false;
    this.circleColor = random([
      'red',
      'blue',
      'yellow',
      'green',
      'orange',
      'purple'
    ]);
  }
  
  update() {
    // Only apply physics if not at rest
    if (!this.isAtRest) {
      // Apply gravity
      this.yVelocity += 0.2;
      this.yPos += this.yVelocity;
      
      // Apply horizontal velocity
      this.xPos += this.xVelocity;
      
      // Apply damping to horizontal velocity
      this.xVelocity *= 0.99;
      
      // Update rotation based on rotationSpeed
      this.rotation += this.rotationSpeed;
      this.rotationSpeed *= 0.95; // Slow down rotation over time
      
      // Floor collision
      if (this.yPos > height - floorHeight - this.circleSize) {
        this.yPos = height - floorHeight - this.circleSize;
        this.yVelocity = -this.yVelocity * 0.8; // Bounce with damping
        
        // Apply friction to horizontal velocity when on floor
        this.xVelocity *= 0.9;
        
        // Transfer some horizontal velocity to rotation on bounce
        this.rotationSpeed += this.xVelocity * 0.05;
        
        // Check if ball is at rest (very small velocity)
        if (abs(this.yVelocity) < 0.5 && abs(this.xVelocity) < 0.5) {
          this.yVelocity = 0;
          this.xVelocity = 0;
          this.isAtRest = true;
        } else {
          // Change color on bounce
          let newColor;
          const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
          do {
            newColor = random(colors);
          } while (newColor === this.circleColor && colors.length > 1);
          this.circleColor = newColor;
        }
      }
      
      // Ceiling collision
      if (this.yPos < this.circleSize + wallWidth) {
        this.yPos = this.circleSize + wallWidth;
        this.yVelocity = -this.yVelocity * 0.8;
        this.isAtRest = false; // Not at rest if hitting ceiling
        
        // Transfer some horizontal velocity to rotation on bounce
        this.rotationSpeed += this.xVelocity * 0.05;
      }
      
      // Wall collisions
      if (this.xPos < this.circleSize + wallWidth) {
        this.xPos = this.circleSize + wallWidth;
        this.xVelocity = -this.xVelocity * 0.8;
        this.isAtRest = false; // Not at rest if hitting wall
        
        // Transfer some vertical velocity to rotation on bounce
        this.rotationSpeed += this.yVelocity * 0.05;
      }
      if (this.xPos > width - this.circleSize - wallWidth) {
        this.xPos = width - this.circleSize - wallWidth;
        this.xVelocity = -this.xVelocity * 0.8;
        this.isAtRest = false; // Not at rest if hitting wall
        
        // Transfer some vertical velocity to rotation on bounce
        this.rotationSpeed += this.yVelocity * 0.05;
      }
    }
  }
  
  draw() {
    // Draw basketball
    this.drawBasketball();
    
    // Draw animated arc only if not at rest
    if (!this.isAtRest) {
      noFill();
      stroke('#e74c3c');
      strokeWeight(2);
      arc(this.xPos, this.yPos, this.circleSize * 2, this.circleSize * 2, 0, angle);
    }
  }
  
  drawBasketball() {
    push(); // Save the current transformation matrix
    translate(this.xPos, this.yPos); // Move to the ball's position
    rotate(this.rotation); // Apply rotation
    
    // Draw basketball base color (orange)
    fill(210, 105, 30); // Orange color
    stroke(0);
    strokeWeight(2);
    circle(0, 0, this.circleSize * 2);
    
    // Draw basketball lines - improved pattern
    stroke(0);
    strokeWeight(2);
    noFill();
    
    // Horizontal line around the middle
    beginShape();
    for (let i = 0; i <= 50; i++) {
      let a = map(i, 0, 50, 0, TWO_PI);
      let px = cos(a) * this.circleSize / 1.5;
      let py = sin(a) * this.circleSize / 7;
      vertex(px, py);
    }
    endShape();
    
    // First curved line - from top to bottom, slightly curved
    beginShape();
    for (let i = 0; i <= 50; i++) {
      let a = map(i, 0, 50, -PI/2, PI/2);
      let px = sin(a) * this.circleSize / 1.7;
      let py = cos(a) * this.circleSize / 1.7;
      vertex(px, py);
    }
    endShape();
    
    // Second curved line - perpendicular to the first
    beginShape();
    for (let i = 0; i <= 50; i++) {
      let a = map(i, 0, 50, -PI/2, PI/2);
      let px = cos(a) * this.circleSize / 1.7;
      let py = sin(a) * this.circleSize / 1.7;
      vertex(px, py);
    }
    endShape();
    
    // Add small curves at the poles to make it look more realistic
    // Top curve
    beginShape();
    for (let i = 0; i <= 20; i++) {
      let a = map(i, 0, 20, 0, PI);
      let px = cos(a) * this.circleSize / 4;
      let py = -this.circleSize / 1.7 + sin(a) * this.circleSize / 6;
      vertex(px, py);
    }
    endShape();
    
    // Bottom curve
    beginShape();
    for (let i = 0; i <= 20; i++) {
      let a = map(i, 0, 20, 0, PI);
      let px = cos(a) * this.circleSize / 4;
      let py = this.circleSize / 1.7 - sin(a) * this.circleSize / 6;
      vertex(px, py);
    }
    endShape();
    
    pop(); // Restore the previous transformation matrix
  }
  
  isPointInside(x, y) {
    let distance = dist(x, y, this.xPos, this.yPos);
    return distance < this.circleSize;
  }
  
  throwBall(mouseVelocityX, mouseVelocityY) {
    this.xVelocity = mouseVelocityX * 0.5;
    this.yVelocity = mouseVelocityY * 0.5;
    this.rotationSpeed = mouseVelocityX * 0.05;
    this.isAtRest = false;
  }
}

let angle = 0;
let balls = []; // Array to hold all balls
let floorHeight = 100;
let wallWidth = 20;
let backWallDepth = 200;
let isDragging = false;
let draggedBall = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseVelocityX = 0;
let mouseVelocityY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create initial ball
  balls.push(new Ball(width / 2, height / 2));
}

function draw() {
  background(200); // Light grey background
  
  // Draw room elements
  drawRoom();
  
  // Update and draw all balls
  for (let ball of balls) {
    ball.update();
    ball.draw();
  }
  
  // Update global angle for animated arcs
  angle += 0.05;
  if (angle > TWO_PI) {
    angle = 0;
  }
}

function drawRoom() {
  // Draw back wall (creates 3D effect)
  fill(140); // Darker grey for back wall to enhance depth
  quad(
    wallWidth, wallWidth,                    // Top-left
    width - wallWidth, wallWidth,           // Top-right
    width - wallWidth, height - floorHeight, // Bottom-right
    wallWidth, height - floorHeight          // Bottom-left
  );
  
  // Draw window on back wall
  let windowWidth = 150;
  let windowHeight = 100;
  let windowX = (width - windowWidth) / 2;
  let windowY = wallWidth + 30;
  
  // Window frame
  fill(100);
  rect(windowX - 5, windowY - 5, windowWidth + 10, windowHeight + 10);
  
  // Window glass
  fill(180, 200, 220, 150); // Light blue with transparency
  rect(windowX, windowY, windowWidth, windowHeight);
  
  // Draw floor
  fill(100); // Darker grey for the floor
  beginShape();
  vertex(0, height - floorHeight);
  vertex(wallWidth, height - floorHeight - backWallDepth/3);
  vertex(width - wallWidth, height - floorHeight - backWallDepth/3);
  vertex(width, height - floorHeight);
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
  
  // Draw left wall
  fill(120); // Medium grey for left wall
  beginShape();
  vertex(0, 0);
  vertex(wallWidth, wallWidth);
  vertex(wallWidth, height - floorHeight - backWallDepth/3);
  vertex(0, height - floorHeight);
  vertex(0, height);
  vertex(0, 0);
  endShape(CLOSE);
  
  // Draw right wall
  fill(120); // Medium grey for right wall
  beginShape();
  vertex(width, 0);
  vertex(width - wallWidth, wallWidth);
  vertex(width - wallWidth, height - floorHeight - backWallDepth/3);
  vertex(width, height - floorHeight);
  vertex(width, height);
  vertex(width, 0);
  endShape(CLOSE);
  
  // Draw ceiling
  fill(160); // Medium grey for ceiling
  beginShape();
  vertex(0, 0);
  vertex(width, 0);
  vertex(width - wallWidth, wallWidth);
  vertex(wallWidth, wallWidth);
  endShape(CLOSE);
  
  // Add some visual details to floor for depth
  fill(80);
  for (let i = 0; i < width; i += 40) {
    rect(i, height - floorHeight/2, 20, 8);
  }
}

function mousePressed() {
  // Check if mouse is over any existing ball
  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];
    if (ball.isPointInside(mouseX, mouseY)) {
      isDragging = true;
      draggedBall = ball;
      dragOffsetX = ball.xPos - mouseX;
      dragOffsetY = ball.yPos - mouseY;
      ball.yVelocity = 0; // Stop velocity when dragging
      ball.xVelocity = 0;
      ball.isAtRest = false; // Not at rest when dragging
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      mouseVelocityX = 0;
      mouseVelocityY = 0;
      return;
    }
  }
  
  // If not over any ball, create a new ball at mouse position
  // But only if click is within room bounds
  if (mouseX > wallWidth && mouseX < width - wallWidth && 
      mouseY > wallWidth && mouseY < height - floorHeight) {
    balls.push(new Ball(mouseX, mouseY));
  }
}

function mouseDragged() {
  if (isDragging && draggedBall) {
    draggedBall.xPos = mouseX + dragOffsetX;
    draggedBall.yPos = mouseY + dragOffsetY;
    
    // Constrain position to room bounds
    draggedBall.xPos = constrain(draggedBall.xPos, draggedBall.circleSize + wallWidth, width - draggedBall.circleSize - wallWidth);
    draggedBall.yPos = constrain(draggedBall.yPos, draggedBall.circleSize + wallWidth, height - floorHeight - draggedBall.circleSize);
  }
}

function mouseReleased() {
  if (isDragging && draggedBall) {
    isDragging = false;
    
    // Apply velocity based on mouse movement when released
    draggedBall.throwBall(mouseVelocityX, mouseVelocityY);
    
    draggedBall = null;
  }
  
  // Reset mouse velocity tracking
  mouseVelocityX = 0;
  mouseVelocityY = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Constrain all balls to new canvas bounds
  for (let ball of balls) {
    ball.xPos = constrain(ball.xPos, ball.circleSize + wallWidth, width - ball.circleSize - wallWidth);
    ball.yPos = constrain(ball.yPos, ball.circleSize + wallWidth, height - floorHeight - ball.circleSize);
  }
}