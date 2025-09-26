// Fish class representing individual particles
class Fish {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(1, 3));
    this.acceleration = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.size = random(8, 16);
    this.colorPhase = random(TWO_PI);
    this.colorSpeed = random(0.01, 0.05);
    this.isPredator = false;
  }

  // Main flocking behaviors
  flock(fishes, predator) {
    let sep = this.separate(fishes);
    let ali = this.align(fishes);
    let coh = this.cohesion(fishes);
    let fol = this.followCursor();
    let avoidPred = this.avoidPredator(predator);

    // Weight the forces
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);
    fol.mult(2.0);
    avoidPred.mult(3.0); // Strong avoidance of predator

    // Apply forces
    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);
    // Only regular fish follow cursor, not predator
    if (!this.isPredator) {
      this.acceleration.add(fol);
    }
    this.acceleration.add(avoidPred);
  }

  // Predator hunting behavior - find the most catchable fish
  hunt(fishes) {
    if (fishes.length === 0) return createVector(0, 0);

    let bestTarget = null;
    let bestScore = -1;

    for (let fish of fishes) {
      let distance = p5.Vector.dist(this.position, fish.position);

      // Skip fish that are too far
      if (distance > 150) continue;

      // Calculate interception time (time for predator to reach fish)
      let interceptionTime = this.calculateInterceptionTime(fish.position, fish.velocity, distance);

      if (interceptionTime > 0 && interceptionTime < 8) { // Only consider reasonable interception times
        // Score based on interception time and distance
        // Lower interception time = better target
        // Closer distance = slightly better
        let score = (1 / interceptionTime) + (1 / (distance + 1)) * 0.1;

        if (score > bestScore) {
          bestScore = score;
          bestTarget = fish;
        }
      }
    }

    if (bestTarget) {
      return this.seek(bestTarget.position);
    }

    return createVector(0, 0);
  }

  // Calculate time for predator to intercept a moving target
  calculateInterceptionTime(targetPos, targetVel, distance) {
    let relativePos = p5.Vector.sub(targetPos, this.position);
    let relativeVel = p5.Vector.sub(targetVel, this.velocity);

    let a = relativeVel.magSq();
    let b = 2 * p5.Vector.dot(relativePos, relativeVel);
    let c = relativePos.magSq() - (this.maxSpeed * 8) * (this.maxSpeed * 8); // Max interception distance

    // Solve quadratic equation: a*t^2 + b*t + c = 0
    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return -1; // No solution

    let t1 = (-b - sqrt(discriminant)) / (2 * a);
    let t2 = (-b + sqrt(discriminant)) / (2 * a);

    // Return the smallest positive time
    if (t1 > 0 && t2 > 0) return min(t1, t2);
    if (t1 > 0) return t1;
    if (t2 > 0) return t2;

    return -1; // No positive solution
  }

  // Separation: steer to avoid crowding local flockmates
  separate(fishes) {
    let desiredSeparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;

    for (let other of fishes) {
      if (other === this) continue;
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }

    return steer;
  }

  // Alignment: steer towards the average heading of neighbors
  align(fishes) {
    let neighborDist = 50;
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of fishes) {
      if (other === this) continue;
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist) {
        sum.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion: steer to move toward the average position of neighbors
  cohesion(fishes) {
    let neighborDist = 50;
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of fishes) {
      if (other === this) continue;
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist) {
        sum.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    } else {
      return createVector(0, 0);
    }
  }

  // Follow cursor behavior
  followCursor() {
    let cursor = createVector(mouseX, mouseY);
    let distance = p5.Vector.dist(this.position, cursor);

    if (distance < 100) {
      return this.seek(cursor);
    } else {
      return createVector(0, 0);
    }
  }

  // Avoid predator behavior with darting
  avoidPredator(predator) {
    if (!predator) return createVector(0, 0);

    let predatorDist = 80;
    let d = p5.Vector.dist(this.position, predator.position);

    if (d < predatorDist) {
      let diff = p5.Vector.sub(this.position, predator.position);
      diff.normalize();

      // Create darting behavior when very close
      let panicMultiplier = 1.0;
      if (d < 40) { // Very close - panic mode
        panicMultiplier = map(d, 0, 40, 3.0, 1.5); // Stronger reaction when closer
        // Add some randomness to the escape direction
        diff.rotate(random(-PI/4, PI/4));
      }

      diff.div(d); // Weight by distance
      diff.mult(this.maxSpeed * panicMultiplier);
      diff.sub(this.velocity);
      diff.limit(this.maxForce * panicMultiplier); // Stronger avoidance when panicking
      return diff;
    }

    return createVector(0, 0);
  }

  // Seek a target position
  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }

  // Update fish position and physics
  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Wrap around edges
    if (this.position.x < -this.size) this.position.x = width + this.size;
    if (this.position.x > width + this.size) this.position.x = -this.size;
    if (this.position.y < -this.size) this.position.y = height + this.size;
    if (this.position.y > height + this.size) this.position.y = -this.size;

    // Update color phase for dynamic gradients
    this.colorPhase += this.colorSpeed;
  }

  // Draw the fish
  display() {
    push();
    translate(this.position.x, this.position.y);

    // Calculate rotation based on velocity
    let angle = this.velocity.heading();
    rotate(angle);

    if (this.isPredator) {
      // Predator appearance - larger, different colors
      let hue = map(sin(this.colorPhase), -1, 1, 0, 30); // Reddish hues
      let saturation = 80;
      let brightness = map(sin(this.colorPhase * 0.7), -1, 1, 70, 90);
      let alpha = 255;

      fill(hue, saturation, brightness, alpha);
      stroke(hue, saturation + 20, brightness + 20, alpha);
      strokeWeight(2);

      // Larger predator fish
      ellipse(0, 0, this.size * 3, this.size * 1.5);

      // Predator tail
      push();
      translate(-this.size * 1.5, 0);
      rotate(sin(frameCount * 0.4) * 0.4); // Faster tail movement
      ellipse(-this.size * 0.5, 0, this.size, this.size * 0.7);
      pop();

      // Predator eyes (more menacing)
      fill(255, 255, 255, 255);
      noStroke();
      ellipse(this.size * 0.8, -this.size * 0.3, this.size * 0.4, this.size * 0.4);
      ellipse(this.size * 0.8, this.size * 0.3, this.size * 0.4, this.size * 0.4);
      fill(255, 0, 0, 255); // Red eyes
      ellipse(this.size * 0.85, -this.size * 0.3, this.size * 0.2, this.size * 0.2);
      ellipse(this.size * 0.85, this.size * 0.3, this.size * 0.2, this.size * 0.2);

      // Predator fins
      fill(hue, saturation, brightness, alpha);
      triangle(this.size * 0.3, -this.size * 0.8, this.size * 0.6, -this.size * 0.5, this.size * 0.3, -this.size * 0.2);
      triangle(this.size * 0.3, this.size * 0.8, this.size * 0.6, this.size * 0.5, this.size * 0.3, this.size * 0.2);

    } else {
      // Regular fish appearance
      let hue = map(sin(this.colorPhase), -1, 1, 200, 240); // Blue hues
      let saturation = map(sin(this.colorPhase * 1.3), -1, 1, 70, 100);
      let brightness = map(sin(this.colorPhase * 0.7), -1, 1, 60, 90);
      let alpha = map(sin(this.colorPhase * 0.5), -1, 1, 150, 255);

      fill(hue, saturation, brightness, alpha);
      stroke(hue, saturation + 20, brightness + 20, alpha + 50);
      strokeWeight(1);

      // Draw fish shape (simple ellipse with tail)
      ellipse(0, 0, this.size * 2, this.size);

      // Draw tail
      push();
      translate(-this.size, 0);
      rotate(sin(frameCount * 0.3) * 0.3); // Waving tail
      ellipse(-this.size * 0.3, 0, this.size * 0.6, this.size * 0.4);
      pop();

      // Draw eye
      fill(255, 255, 255, 200);
      noStroke();
      ellipse(this.size * 0.3, -this.size * 0.2, this.size * 0.3, this.size * 0.3);
      fill(0, 0, 0, 255);
      ellipse(this.size * 0.35, -this.size * 0.2, this.size * 0.15, this.size * 0.15);
    }

    pop();
  }
}

// Global variables
let fishes = [];
let predator;
let respawnQueue = []; // Queue for fish waiting to respawn
let schoolSize = 50;
let schoolSizeSlider;
let resetBtn;
let sizeValueDisplay;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Get UI elements
  schoolSizeSlider = select('#schoolSize');
  resetBtn = select('#resetBtn');
  sizeValueDisplay = select('#sizeValue');

  // Set up event listeners
  schoolSizeSlider.input(updateSchoolSize);
  resetBtn.mousePressed(resetSchool);

  // Initialize school and predator
  initializeSchool();
}

function initializeSchool() {
  fishes = [];
  respawnQueue = [];

  // Create predator
  predator = new Fish(width/2, height/2);
  predator.isPredator = true;
  predator.size = 20;
  predator.maxSpeed = 6;
  predator.maxForce = 0.3;
  predator.colorPhase = 0;
  predator.colorSpeed = 0.02;

  // Create school fish
  for (let i = 0; i < schoolSize; i++) {
    let x = random(width);
    let y = random(height);
    fishes.push(new Fish(x, y));
  }
}

function updateSchoolSize() {
  schoolSize = schoolSizeSlider.value();
  sizeValueDisplay.html(schoolSize);

  // Adjust school size (keep predator separate)
  let currentSchoolSize = fishes.length;

  if (currentSchoolSize < schoolSize) {
    // Add more fish
    for (let i = currentSchoolSize; i < schoolSize; i++) {
      let x = random(width);
      let y = random(height);
      fishes.push(new Fish(x, y));
    }
  } else if (currentSchoolSize > schoolSize) {
    // Remove excess fish
    fishes.splice(schoolSize);
  }
}

function resetSchool() {
  initializeSchool();
}

function draw() {
  // Create underwater effect with gradient background
  for (let y = 0; y < height; y++) {
    let alpha = map(y, 0, height, 20, 80);
    stroke(0, 50, 100, alpha);
    line(0, y, width, y);
  }

  // Update predator behavior with intelligent hunting
  let huntingForce = predator.hunt(fishes);
  predator.acceleration.add(huntingForce);
  predator.update();

  // Update and display all fish
  for (let fish of fishes) {
    fish.flock(fishes, predator);
    fish.update();
    fish.display();
  }

  // Display predator
  predator.display();

  // Add some bubbles for underwater effect
  drawBubbles();

  // Check for predator eating fish
  checkPredatorEating();

  // Check for fish respawning
  checkRespawning();
}

function checkPredatorEating() {
  for (let i = fishes.length - 1; i >= 0; i--) {
    let fish = fishes[i];
    let distance = p5.Vector.dist(predator.position, fish.position);

    if (distance < predator.size) {
      // Predator eats the fish!
      fishes.splice(i, 1);

      // Add to respawn queue with timestamp
      respawnQueue.push({
        spawnTime: millis() + 5000, // 5 seconds from now
        x: random(width),
        y: random(height)
      });
    }
  }
}

function checkRespawning() {
  let currentTime = millis();

  // Check if any fish should respawn
  for (let i = respawnQueue.length - 1; i >= 0; i--) {
    if (currentTime >= respawnQueue[i].spawnTime) {
      // Respawn the fish
      let spawnData = respawnQueue.splice(i, 1)[0];
      let newFish = new Fish(spawnData.x, spawnData.y);
      fishes.push(newFish);

      // Update school size display
      schoolSize = fishes.length;
      schoolSizeSlider.value(schoolSize);
      sizeValueDisplay.html(schoolSize);
    }
  }
}

function drawBubbles() {
  for (let i = 0; i < 20; i++) {
    let x = (frameCount * 0.5 + i * 50) % (width + 50) - 25;
    let y = height - (frameCount * 0.3 + i * 30) % height;

    fill(255, 255, 255, 100);
    noStroke();
    circle(x, y, 3 + sin(frameCount * 0.1 + i) * 2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}