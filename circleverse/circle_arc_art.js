// Convert Processing code to p5.js
// Variables
let canvas;
let squareSize = 100;
let num_pts = 47;
let radius;
let rads_incr;
let radius_offset;
let rads_start_pt;
let arc_orig;

// Color arrays
let colors_rgb_red = [
  [255, 0, 0], [255, 69, 0], [255, 140, 0], [255, 215, 0],
  [255, 160, 122], [255, 105, 180], [255, 192, 203], [255, 215, 0],
  [240, 128, 128], [220, 20, 60], [178, 34, 34], [139, 0, 0],
  [128, 0, 0], [139, 69, 19], [165, 42, 42], [210, 105, 30],
  [205, 133, 63], [222, 184, 135], [244, 164, 96], [218, 165, 32],
  [255, 215, 0], [255, 99, 71], [255, 69, 0], [255, 140, 0],
  [255, 215, 0], [255, 160, 122], [255, 105, 180], [255, 192, 203],
  [255, 215, 0], [240, 128, 128], [220, 20, 60], [178, 34, 34],
  [139, 0, 0], [128, 0, 0], [139, 69, 19], [165, 42, 42],
  [210, 105, 30], [205, 133, 63], [222, 184, 135], [244, 164, 96],
  [218, 165, 32], [255, 215, 0], [255, 99, 71], [255, 69, 0],
  [255, 140, 0], [255, 215, 0], [255, 160, 122], [255, 105, 180],
  [255, 192, 203], [255, 215, 0], [240, 128, 128], [220, 20, 60],
  [178, 34, 34], [139, 0, 0], [128, 0, 0], [139, 69, 19],
  [165, 42, 42], [210, 105, 30], [205, 133, 63], [222, 184, 135],
  [244, 164, 96], [218, 165, 32], [255, 215, 0], [255, 99, 71],
  [255, 69, 0], [255, 140, 0], [255, 215, 0], [255, 160, 122],
  [255, 105, 180], [255, 192, 203], [255, 215, 0], [240, 128, 128],
  [220, 20, 60]
];

let colors_blue = [
  [70, 130, 180], [100, 149, 237], [0, 0, 128],
  [30, 144, 255], [0, 0, 205], [0, 0, 255],
  [0, 0, 139], [0, 0, 205], [0, 0, 128],
  [25, 25, 112], [0, 0, 139], [0, 0, 128],
  [70, 130, 180], [100, 149, 237], [0, 0, 128],
  [30, 144, 255], [0, 0, 205], [0, 0, 255],
  [0, 0, 139], [0, 0, 205], [0, 0, 128],
  [25, 25, 112], [0, 0, 139], [0, 0, 128],
  [70, 130, 180], [100, 149, 237], [0, 0, 128],
  [30, 144, 255], [0, 0, 205], [0, 0, 255],
  [0, 0, 139], [0, 0, 205], [0, 0, 128],
  [25, 25, 112], [0, 0, 139], [0, 0, 128],
  [70, 130, 180], [100, 149, 237], [0, 0, 128],
  [30, 144, 255], [0, 0, 205], [0, 0, 255],
  [0, 0, 139], [0, 0, 205], [0, 0, 128],
  [25, 25, 112], [0, 0, 139], [0, 0, 128],
  [70, 130, 180], [100, 149, 237], [0, 0, 128],
  [30, 144, 255], [0, 0, 205], [0, 0, 255],
  [0, 0, 139], [0, 0, 205], [0, 0, 128],
  [25, 25, 112], [0, 0, 139], [0, 0, 128],
  [70, 130, 180], [100, 149, 237], [0, 0, 128],
  [30, 144, 255], [0, 0, 205], [0, 0, 255],
  [0, 0, 139], [0, 0, 205], [0, 0, 128],
  [25, 25, 112], [0, 0, 139], [0, 0, 128]
];

let all_colors = [
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Red, Green, Blue
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Yellow, Magenta, Cyan
  [128, 0, 0], [0, 128, 0], [0, 0, 128], // Maroon, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // DarkOrange, Red-Orange, Pink
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Red, Green, Blue
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Yellow, Magenta, Cyan
  [128, 0, 0], [0, 128, 0], [0, 0, 128], // Maroon, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // DarkOrange, Red-Orange, Pink
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Red, Green, Blue
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Yellow, Magenta, Cyan
  [128, 0, 0], [0, 128, 0], [0, 0, 128], // Maroon, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // DarkOrange, Red-Orange, Pink
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Red, Green, Blue
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Yellow, Magenta, Cyan
  [128, 0, 0], [0, 128, 0], [0, 0, 128], // Maroon, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // DarkOrange, Red-Orange, Pink
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Red, Green, Blue
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Yellow, Magenta, Cyan
  [128, 0, 0], [0, 128, 0], [0, 0, 128], // Maroon, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203]  // DarkOrange, Red-Orange, Pink
];

let colors_standard = [
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Primary Colors
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Secondary Colors
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // Warm Tones
  [0, 128, 0], [0, 0, 128], [255, 255, 255], // Green, Navy, White
  [255, 99, 71], [218, 112, 214], [70, 130, 180], // Tomato, Orchid, Steel Blue
  [255, 20, 147], [0, 191, 255], [240, 128, 128], // Deep Pink, Deep Sky Blue, Light Coral
  [128, 0, 128], [255, 215, 0], [0, 128, 128], // Purple, Gold, Teal
  [255, 215, 0], [255, 0, 0], [0, 255, 0], // Gold, Red, Green
  [0, 0, 255], [255, 192, 203], [255, 69, 0], // Blue, Pink, Red-Orange
  [255, 160, 122], [0, 255, 255], [255, 0, 255], // Light Salmon, Aqua, Magenta
  [255, 255, 0], [0, 128, 0], [0, 0, 128], // Yellow, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // DarkOrange, Red-Orange, Pink
  [255, 0, 0], [0, 255, 0], [0, 0, 255], // Red, Green, Blue
  [255, 255, 0], [255, 0, 255], [0, 255, 255], // Yellow, Magenta, Cyan
  [128, 0, 0], [0, 128, 0], [0, 0, 128], // Maroon, Green, Navy
  [255, 140, 0], [255, 69, 0], [255, 192, 203], // DarkOrange, Red-Orange, Pink
];

let colors = all_colors;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  blendMode(REPLACE);
  
  canvas = createGraphics(1000, 1000);
  canvas.smooth();
  canvas.colorMode(HSB, 360, 100, 100);
  canvas.noStroke();
  
  draw_circles();
  save_screenshot();
  
  // Draw the graphics canvas to the main canvas
  image(canvas, 0, 0);
}

function draw() {
  // Draw the graphics canvas to the main canvas
  image(canvas, 0, 0);
}

function save_screenshot() {
  let d = new Date();
  saveCanvas("img" + d.getTime(), "png");
}

function mousePressed() {
  splat(mouseX, mouseY);
}

function mouseDragged() {
  splat(mouseX, mouseY);
}

function draw_circles() {
  for (let i = 1; i < canvas.width/squareSize; i++) {
    for (let j = 1; j < canvas.height/squareSize; j++) {
      let posX = i * 100 + floor(random(-25, 25));
      let posY = j * 100 + floor(random(-25, 25));
      let circle_center = createVector(posX, posY);
      
      let circle_diameter = random(squareSize - 50, squareSize + 50);
      
      // Fill with random color
      let randomColorFromArray = floor(random(colors.length));
      canvas.fill(colors[randomColorFromArray][0], colors[randomColorFromArray][1], colors[randomColorFromArray][2]);
      
      // Stroke details
      let randomStrokeColorFromArray = floor(random(colors.length));
      canvas.strokeWeight(random(1.5, 5.0));
      canvas.stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
      
      let randomRotate = random(0, TWO_PI);
      
      canvas.ellipse(circle_center.x, circle_center.y, circle_diameter * random(0.8, 1.2), circle_diameter * random(0.8, 1.2));
      
      canvas.noFill();
      arc_orig = circle_center;
      
      let number_of_arcs = floor(random(3, 10));
      for (let arc_count = 0; arc_count < number_of_arcs; arc_count++) {
        initiate_arc(arc_orig, circle_diameter);
      }
    }
  }
}

function initiate_arc(arc_orig, circle_diameter) {
  let randomStrokeColorFromArray = floor(random(colors.length));
  canvas.stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
  canvas.strokeWeight(random(2, 6));
  render_arc(arc_orig, TWO_PI*random(1/6, 1.5), random(3, 47), circle_diameter);
}

function render_arc(orig, arc_len, pts, circle_diameter) {
  let new_radius;
  let new_x=0;
  let new_y=0;
  let curr_rads=0;
  
  canvas.beginShape();
  rads_incr = arc_len/pts;
  rads_start_pt = random(TWO_PI);
  radius = (circle_diameter/2)*random(1/10, 1);
  
  let randomXOffset = random(0.5, 10);
  let randomYOffset = random(0.5, 10);
  
  canvas.translate(orig.x + randomXOffset, orig.y + randomYOffset);
  canvas.curveVertex(cos(rads_start_pt)*radius, sin(rads_start_pt)*radius);
  
  for (let k=0; k<num_pts; k++) {
    curr_rads = rads_start_pt + (k*rads_incr);
    new_radius = radius + random(-5, 5);
    new_x = cos(curr_rads)*new_radius;
    new_y = sin(curr_rads)*new_radius;
    canvas.curveVertex(new_x, new_y);
  }
  canvas.curveVertex(new_x, new_y);
  canvas.endShape();
  canvas.translate(-(orig.x + randomXOffset), -(orig.y + randomYOffset));
}

function splat(x, y) {
  let rad = 17;
  canvas.fill(random(360), 100, 100);
  for (let i=3; i<29; i+=.35) {
    let angle = random(0, TWO_PI);
    let splatX = x + cos(angle)*2*i;
    let splatY = y + sin(angle)*3*i;
    canvas.ellipse(splatX, splatY, rad-i, rad-i+1.8);
  }
}