let horses = [];
let winner = null;
let adjectives = ["Majestic", "Regal", "Elegant", "Noble", "Grand", "Imperial", "Luxurious", "Opulent", "Prestigious", "Sophisticated"];
let nouns = ["Thunder", "Storm", "Blaze", "Spirit", "Comet", "Phantom", "Eclipse", "Tempest", "Aurora", "Zephyr"];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 3; i++) {
    let name = random(adjectives) + " " + random(nouns);
    horses.push({
      name: name,
      color: color(random(100, 255), random(100, 255), random(100, 255)),
      t: random(0, TWO_PI), // start at random position
      speed: random(0.02, 0.05),
      laps: 0
    });
  }
  let button = createButton('Speed Up');
  button.position(10, height - 50);
  button.mousePressed(() => {
    horses.forEach(horse => horse.speed += 0.01);
  });
}

function draw() {
  // Sky
  fill(135, 206, 235); // light blue
  rect(0, 0, width, height / 2);
  // Grass
  fill(34, 139, 34); // green
  rect(0, height / 2, width, height / 2);
  // Draw figure 8 path
  stroke(0);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i <= 100; i++) {
    let t = map(i, 0, 100, 0, TWO_PI);
    let x = width / 2 + sin(t) * width / 4;
    let y = height / 2 + sin(2 * t) * height / 4;
    vertex(x, y);
  }
  endShape();
  // Horses
  fill('green');
  noStroke();
  textSize(50);
  textAlign(CENTER, CENTER);
  if (!winner) {
    horses.forEach((horse, index) => {
      let x = width / 2 + sin(horse.t) * width / 4;
      let baseY = height / 2 + sin(2 * horse.t) * height / 4;
      let y = baseY + sin(horse.t * 20) * 10; // running motion
      fill(horse.color);
      ellipse(x, y, 60, 40);
      fill(0);
      text('🐎', x, y);
      horse.t += horse.speed;
      if (horse.t > TWO_PI) {
        horse.t -= TWO_PI;
        horse.laps++;
        if (horse.laps == 4 && !winner) {
          winner = horse.name;
        }
      }
    });
  } else {
    // Display winner
    horses.forEach((horse, index) => {
      if (horse.name === winner) {
        let x = width / 2 + sin(horse.t) * width / 4;
        let baseY = height / 2 + sin(2 * horse.t) * height / 4;
        let y = baseY + sin(horse.t * 20) * 10;
        fill(horse.color);
        text('🐎', x, y);
      }
    });
    fill(255, 0, 0);
    textSize(32);
    text(`Winner: ${winner}`, width / 2, height / 2 + 100);
  }
  // Display laps
  fill(0);
  textSize(16);
  horses.forEach((horse, index) => {
    text(`${horse.name}: ${horse.laps} laps`, 10, 20 + index * 20);
  });
  fill('green');
  textSize(50);
}