// Convert Processing code to p5.js
// Variables
let canvas;
let squareSize = 100;
// Controls the minimum and maximum random circle sizes
let minCircleSize = 50;
let maxCircleSize = 150;
let num_pts = 47;
let radius;
let rads_incr;
let radius_offset;
let rads_start_pt;
let arc_orig;

// Color arrays - converted from RGB to HSB to match the colorMode setting
let colors_rgb_red = [
  [0, 100, 100], [20, 99, 100], [32, 98, 100], [45, 96, 100],
  [18, 80, 100], [33, 79, 100], [35, 25, 100], [45, 96, 100],
  [0, 47, 94], [352, 89, 87], [357, 81, 70], [358, 100, 54],
  [360, 100, 50], [30, 70, 55], [355, 60, 65], [25, 71, 82],
  [30, 57, 80], [30, 25, 87], [25, 61, 96], [30, 85, 85],
  [45, 100, 100], [19, 100, 100], [25, 99, 100], [32, 98, 100],
  [45, 96, 100], [18, 80, 100], [33, 79, 100], [35, 25, 100],
  [45, 96, 100], [0, 47, 94], [352, 89, 87], [357, 81, 70],
  [358, 100, 54], [360, 100, 50], [30, 70, 55], [355, 60, 65],
  [25, 71, 82], [30, 57, 80], [30, 25, 87], [25, 61, 96],
  [30, 85, 85], [45, 100, 100], [19, 100, 100], [25, 99, 100],
  [32, 98, 100], [45, 96, 100], [18, 80, 100], [33, 79, 100],
  [35, 25, 100], [45, 96, 100], [0, 47, 94], [352, 89, 87],
  [357, 81, 70], [358, 100, 54], [360, 100, 50], [30, 70, 55],
  [355, 60, 65], [25, 71, 82], [30, 57, 80], [30, 25, 87],
  [25, 61, 96], [30, 85, 85], [45, 100, 100], [19, 100, 100],
  [25, 99, 100], [32, 98, 100], [45, 96, 100], [18, 80, 100],
  [33, 79, 100], [35, 25, 100], [45, 96, 100], [0, 47, 94],
  [352, 89, 87]
];

let colors_blue = [
  [208, 69, 71], [207, 70, 93], [240, 100, 50],
  [206, 88, 100], [240, 100, 80], [240, 100, 100],
  [240, 100, 55], [240, 100, 80], [240, 100, 50],
  [240, 78, 55], [240, 100, 55], [240, 100, 50],
  [208, 69, 71], [207, 70, 93], [240, 100, 50],
  [206, 88, 100], [240, 100, 80], [240, 100, 100],
  [240, 100, 55], [240, 100, 80], [240, 100, 50],
  [240, 78, 55], [240, 100, 55], [240, 100, 50],
  [208, 69, 71], [207, 70, 93], [240, 100, 50],
  [206, 88, 100], [240, 100, 80], [240, 100, 100],
  [240, 100, 55], [240, 100, 80], [240, 100, 50],
  [240, 78, 55], [240, 100, 55], [240, 100, 50],
  [208, 69, 71], [207, 70, 93], [240, 100, 50],
  [206, 88, 100], [240, 100, 80], [240, 100, 100],
  [240, 100, 55], [240, 100, 80], [240, 100, 50],
  [240, 78, 55], [240, 100, 55], [240, 100, 50],
  [208, 69, 71], [207, 70, 93], [240, 100, 50],
  [206, 88, 100], [240, 100, 80], [240, 100, 100],
  [240, 100, 55], [240, 100, 80], [240, 100, 50],
  [240, 78, 55], [240, 100, 55], [240, 100, 50],
  [208, 69, 71], [207, 70, 93], [240, 100, 50],
  [206, 88, 100], [240, 100, 80], [240, 100, 100],
  [240, 100, 55], [240, 100, 80], [240, 100, 50],
  [240, 78, 55], [240, 100, 55], [240, 100, 50]
];

let all_colors = [
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Red, Green, Blue
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Yellow, Magenta, Cyan
  [0, 100, 50], [120, 100, 50], [240, 100, 50], // Maroon, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // DarkOrange, Red-Orange, Pink
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Red, Green, Blue
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Yellow, Magenta, Cyan
  [0, 100, 50], [120, 100, 50], [240, 100, 50], // Maroon, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // DarkOrange, Red-Orange, Pink
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Red, Green, Blue
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Yellow, Magenta, Cyan
  [0, 100, 50], [120, 100, 50], [240, 100, 50], // Maroon, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // DarkOrange, Red-Orange, Pink
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Red, Green, Blue
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Yellow, Magenta, Cyan
  [0, 100, 50], [120, 100, 50], [240, 100, 50], // Maroon, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // DarkOrange, Red-Orange, Pink
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Red, Green, Blue
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Yellow, Magenta, Cyan
  [0, 100, 50], [120, 100, 50], [240, 100, 50], // Maroon, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100]  // DarkOrange, Red-Orange, Pink
];

let colors_standard = [
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Primary Colors
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Secondary Colors
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // Warm Tones
  [120, 100, 50], [240, 100, 50], [0, 0, 100], // Green, Navy, White
  [9, 89, 100], [303, 50, 85], [208, 69, 71], // Tomato, Orchid, Steel Blue
  [328, 100, 100], [195, 100, 100], [0, 33, 94], // Deep Pink, Deep Sky Blue, Light Coral
  [300, 100, 50], [60, 100, 100], [180, 100, 50], // Purple, Gold, Teal
  [60, 100, 100], [0, 100, 100], [120, 100, 100], // Gold, Red, Green
  [240, 100, 100], [355, 25, 100], [25, 100, 100], // Blue, Pink, Red-Orange
  [19, 75, 100], [180, 100, 100], [300, 100, 100], // Light Salmon, Aqua, Magenta
  [60, 100, 100], [120, 100, 50], [240, 100, 50], // Yellow, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // DarkOrange, Red-Orange, Pink
  [0, 100, 100], [120, 100, 100], [240, 100, 100], // Red, Green, Blue
  [60, 100, 100], [300, 100, 100], [180, 100, 100], // Yellow, Magenta, Cyan
  [0, 100, 50], [120, 100, 50], [240, 100, 50], // Maroon, Green, Navy
  [39, 100, 100], [25, 100, 100], [355, 25, 100], // DarkOrange, Red-Orange, Pink
];

// Wes Anderson color palette inspired by his films
let colors_wes_anderson = [
  [330, 60, 85],   // Pink (Grand Budapest Hotel)
  [280, 40, 90],   // Lavender (Grand Budapest Hotel)
  [20, 30, 95],    // Cream (various films)
  [40, 60, 90],    // Khaki (Moonrise Kingdom)
  [25, 80, 85],    // Orange (Darjeeling Limited)
  [350, 40, 60],   // Muted Red (The Royal Tenenbaums)
  [180, 30, 80],   // Teal (The Life Aquatic)
  [60, 40, 90],    // Yellow (Fantastic Mr. Fox)
  [200, 50, 85],   // Sky Blue (Moonrise Kingdom)
  [30, 50, 70],    // Brown (Darjeeling Limited)
  [0, 0, 95],      // White (clean whites used in many films)
  [0, 0, 20],      // Black (The Royal Tenenbaums)
  [340, 50, 80],   // Rose (Grand Budapest Hotel)
  [150, 30, 75],   // Muted Green (The Darjeeling Limited)
  [270, 30, 85],   // Muted Purple (The Grand Budapest Hotel)
  [45, 60, 90],    // Mustard (Moonrise Kingdom)
  [190, 40, 80],   // Light Blue (The Life Aquatic)
  [15, 70, 80],    // Red-Orange (The Royal Tenenbaums)
  [320, 40, 90],   // Light Pink (The Grand Budapest Hotel)
  [240, 30, 70],   // Muted Blue (various films)
  [60, 50, 85],    // Gold (The Royal Tenenbaums)
  [120, 30, 75],   // Muted Green (Fantastic Mr. Fox)
  [300, 30, 80],   // Muted Magenta (The Grand Budapest Hotel)
  [210, 40, 85],   // Powder Blue (Moonrise Kingdom)
  [345, 50, 85],   // Salmon (The Grand Budapest Hotel)
  [165, 30, 70],   // Sage Green (The Darjeeling Limited)
  [255, 40, 80],   // Periwinkle (The Life Aquatic)
  [75, 50, 85],    // Lemon Yellow (Fantastic Mr. Fox)
  [15, 60, 80],    // Burnt Orange (The Royal Tenenbaums)
  [315, 40, 85],   // Blush Pink (The Grand Budapest Hotel)
  [225, 30, 75],   // Dusty Blue (Moonrise Kingdom)
  [45, 70, 85],    // Golden Yellow (The Life Aquatic)
  [330, 50, 80],   // Coral (Darjeeling Limited)
  [180, 40, 80],   // Turquoise (The Life Aquatic)
  [300, 40, 85],   // Lilac (The Grand Budapest Hotel)
  [90, 40, 80],    // Olive (Fantastic Mr. Fox)
  [195, 50, 85],   // Cerulean (The Life Aquatic)
  [15, 80, 90],    // Vibrant Orange (The Royal Tenenbaums)
  [345, 40, 85],   // Soft Pink (The Grand Budapest Hotel)
  [240, 40, 80],   // Muted Blue (various films)
  [60, 60, 90],    // Bright Yellow (Fantastic Mr. Fox)
  [315, 50, 85],   // Rose Pink (The Grand Budapest Hotel)
  [165, 40, 75],   // Sage (The Darjeeling Limited)
  [270, 40, 85],   // Lavender (The Grand Budapest Hotel)
  [210, 50, 85],   // Sky Blue (Moonrise Kingdom)
  [30, 70, 85],    // Orange (Darjeeling Limited)
  [350, 50, 80],   // Muted Red (The Royal Tenenbaums)
  [180, 50, 80],   // Teal (The Life Aquatic)
  [0, 0, 100],     // Pure White (various films)
  [0, 0, 15],      // Near Black (The Royal Tenenbaums)
  [335, 60, 90],   // Hot Pink (The Grand Budapest Hotel)
  [150, 50, 85]    // Green (Fantastic Mr. Fox)
];

// Predominantly green color palette
let colors_green = [
  [120, 100, 100],  // Bright Green
  [120, 80, 90],    // Medium Green
  [120, 60, 80],    // Soft Green
  [150, 100, 100],  // Lime Green
  [150, 80, 90],    // Sage Green
  [150, 60, 80],    // Muted Lime
  [90, 100, 100],   // Emerald Green
  [90, 80, 90],     // Forest Green
  [90, 60, 80],     // Dark Green
  [180, 100, 100],  // Teal
  [180, 80, 90],    // Soft Teal
  [180, 60, 80],    // Muted Teal
  [135, 100, 100],  // Spring Green
  [135, 80, 90],    // Sea Green
  [135, 60, 80],    // Ocean Green
  [105, 100, 100],  // Jade Green
  [105, 80, 90],    // Pine Green
  [105, 60, 80],    // Fir Green
  [165, 100, 100],  // Chartreuse
  [165, 80, 90],    // Leaf Green
  [165, 60, 80],    // Moss Green
  [75, 100, 100],   // Grass Green
  [75, 80, 90],     // Olive Green
  [75, 60, 80],     // Military Green
  [120, 100, 80],   // Matte Green
  [120, 100, 60],   // Deep Green
  [150, 100, 80],   // Matte Lime
  [150, 100, 60],   // Deep Lime
  [90, 100, 80],    // Matte Emerald
  [90, 100, 60],    // Deep Emerald
  [180, 100, 80],   // Matte Teal
  [180, 100, 60],   // Deep Teal
  [135, 100, 80],   // Matte Spring
  [135, 100, 60],   // Deep Spring
  [105, 100, 80],   // Matte Jade
  [105, 100, 60],   // Deep Jade
  [165, 100, 80],   // Matte Chartreuse
  [165, 100, 60],   // Deep Chartreuse
  [75, 100, 80],    // Matte Grass
  [75, 100, 60],    // Deep Grass
  [120, 50, 100],   // Light Green
  [120, 50, 90],    // Pale Green
  [150, 50, 100],   // Light Lime
  [150, 50, 90],    // Pale Lime
  [90, 50, 100],    // Light Emerald
  [90, 50, 90],     // Pale Emerald
  [180, 50, 100],   // Light Teal
  [180, 50, 90],    // Pale Teal
  [135, 50, 100],   // Light Spring
  [135, 50, 90],    // Pale Spring
  [105, 50, 100],   // Light Jade
  [105, 50, 90]     // Pale Jade
];

// Easter-themed color palette
let colors_easter = [
  [300, 50, 95],    // Pastel Pink
  [280, 50, 95],    // Pastel Purple
  [240, 50, 95],    // Pastel Blue
  [180, 50, 95],    // Pastel Turquoise
  [120, 50, 95],    // Pastel Green
  [60, 50, 95],     // Pastel Yellow
  [45, 50, 95],     // Pastel Orange
  [15, 50, 95],     // Light Peach
  [0, 50, 95],      // Pastel Red
  [330, 50, 95],    // Light Pink
  [315, 50, 95],    // Lavender
  [270, 50, 95],    // Light Purple
  [255, 50, 95],    // Periwinkle
  [210, 50, 95],    // Sky Blue
  [165, 50, 95],    // Mint Green
  [150, 50, 95],    // Light Green
  [90, 50, 95],     // Light Lime
  [75, 50, 95],     // Light Yellow-Green
  [45, 50, 95],     // Light Yellow
  [30, 50, 95],     // Light Orange-Yellow
  [15, 50, 95],     // Light Orange
  [0, 0, 95],       // White
  [0, 0, 100],      // Pure White
  [240, 100, 100],  // Egg Blue
  [120, 100, 100],  // Grass Green
  [60, 100, 100],   // Sunny Yellow
  [300, 100, 100],  // Hot Pink
  [270, 100, 100],  // Vibrant Purple
  [30, 100, 100],   // Bright Orange
  [0, 100, 100],    // Bright Red
  [180, 100, 100],  // Bright Teal
  [150, 100, 100],  // Bright Green
  [210, 100, 100],  // Bright Blue
  [330, 100, 100],  // Bright Pink
  [0, 0, 85],       // Off-White
  [0, 0, 80],       // Cream
  [300, 30, 90],    // Soft Pink
  [270, 30, 90],    // Soft Purple
  [240, 30, 90],    // Soft Blue
  [180, 30, 90],    // Soft Teal
  [120, 30, 90],    // Soft Green
  [60, 30, 90],     // Soft Yellow
  [30, 30, 90],     // Soft Orange
  [0, 30, 90],      // Soft Red
  [330, 30, 90],    // Soft Magenta
  [210, 30, 90],    // Soft Cyan
  [150, 30, 90],    // Soft Lime
  [90, 30, 90],     // Soft Chartreuse
  [285, 40, 92],    // Easter Purple
  [15, 40, 92],     // Easter Orange
  [225, 40, 92]     // Easter Blue
];

let colors = colors_wes_anderson;

// Reference to color arrays for easy switching
const colorPalettes = {
  wes_anderson: colors_wes_anderson,
  all_colors: all_colors,
  colors_rgb_red: colors_rgb_red,
  colors_blue: colors_blue,
  colors_standard: colors_standard,
  colors_green: colors_green,
  colors_easter: colors_easter
};

function setup() {
  // Create canvas using full window dimensions
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvasContainer');
  
  // Adjust canvas width based on control panel state
  const controlPanel = document.getElementById('controlPanel');
  if (!controlPanel.classList.contains('hidden')) {
    canvas.width = windowWidth - 200;
  }
  
  background(0);
  blendMode(REPLACE);
  
  // Create graphics canvas
  graphicsCanvas = createGraphics(width, height);
  graphicsCanvas.smooth();
  graphicsCanvas.colorMode(HSB, 360, 100, 100);
  graphicsCanvas.noStroke();
  graphicsCanvas.background(0);
  
  draw_circles();
  
  // Draw the graphics canvas to the main canvas
  image(graphicsCanvas, 0, 0);
  
  // Set up event listeners for control panel
  setupControlPanel();
}

function windowResized() {
  // Resize canvas to fit window
  const controlPanel = document.getElementById('controlPanel');
  const canvasContainer = document.getElementById('canvasContainer');
  
  if (controlPanel.classList.contains('hidden')) {
    resizeCanvas(windowWidth, windowHeight);
  } else {
    resizeCanvas(windowWidth - 200, windowHeight);
  }
  
  // Recreate the graphics canvas with new dimensions
  graphicsCanvas = createGraphics(width, height);
  graphicsCanvas.smooth();
  graphicsCanvas.colorMode(HSB, 360, 100, 100);
  graphicsCanvas.noStroke();
  graphicsCanvas.background(0);
  draw_circles();
}

function draw() {
  // Draw the graphics canvas to the main canvas
  image(graphicsCanvas, 0, 0);
}

function setupControlPanel() {
  // Set up event listeners for control panel elements
  document.getElementById('colorPalette').addEventListener('change', function() {
    let selectedPalette = this.value;
    colors = colorPalettes[selectedPalette];
    regenerateArt();
  });
  
  document.getElementById('minCircleSize').addEventListener('input', function() {
    minCircleSize = parseInt(this.value);
    // Ensure minCircleSize doesn't exceed maxCircleSize
    if (minCircleSize > maxCircleSize) {
      maxCircleSize = minCircleSize;
      document.getElementById('maxCircleSize').value = minCircleSize;
    }
    regenerateArt();
  });
  
  document.getElementById('maxCircleSize').addEventListener('input', function() {
    maxCircleSize = parseInt(this.value);
    // Ensure maxCircleSize doesn't go below minCircleSize
    if (maxCircleSize < minCircleSize) {
      minCircleSize = maxCircleSize;
      document.getElementById('minCircleSize').value = maxCircleSize;
    }
    regenerateArt();
  });
  
  document.getElementById('regenerateBtn').addEventListener('click', function() {
    regenerateArt();
  });
  
  document.getElementById('saveBtn').addEventListener('click', function() {
    saveArt();
  });
  
  // Set up event listener for toggle button
  document.getElementById('togglePanel').addEventListener('click', function() {
    toggleControlPanel();
  });
  
  // Initialize toggle button position
  const controlPanel = document.getElementById('controlPanel');
  const toggleBtn = document.getElementById('togglePanel');
  if (controlPanel.classList.contains('hidden')) {
    toggleBtn.style.left = '10px';
  } else {
    toggleBtn.style.left = '130px';
  }
}

function toggleControlPanel() {
  const controlPanel = document.getElementById('controlPanel');
  const canvasContainer = document.getElementById('canvasContainer');
  const toggleBtn = document.getElementById('togglePanel');
  
  controlPanel.classList.toggle('hidden');
  canvasContainer.classList.toggle('expanded');
  toggleBtn.classList.toggle('panel-open');
  
  // Update button text and position based on panel state
  if (controlPanel.classList.contains('hidden')) {
    toggleBtn.textContent = '▶';
    // When panel is hidden, button should be at left: 10px
    toggleBtn.style.left = '10px';
  } else {
    toggleBtn.textContent = '◀';
    // When panel is visible, button should be inside the panel with padding (200px width - 50px button width - 20px padding)
    toggleBtn.style.left = '130px';
  }
  
  // Trigger window resize to adjust canvas
  windowResized();
}

function regenerateArt() {
  // Clear the graphics canvas
  graphicsCanvas.background(0);
  
  // Redraw the circles with the new color palette
  draw_circles();
  
  // Redraw the main canvas
  redraw();
}

function saveArt() {
  // Ask for confirmation before saving the file
  if (confirm("Do you want to save the artwork?")) {
    // Save the graphics canvas
    saveCanvas(graphicsCanvas, "circleverse-" + new Date().getTime(), "png");
  }
}

function save_screenshot() {
  // Ask for confirmation before saving the screenshot
  if (confirm("Do you want to save a screenshot?")) {
    saveCanvas(graphicsCanvas, "circleverse-screenshot-" + new Date().getTime(), "png");
  }
}

function mousePressed() {
  // Only trigger splat if the mouse is pressed directly on the canvas
  // and not on any UI elements
  
  // Get toggle button position and dimensions
  const toggleBtn = document.getElementById('togglePanel');
  const rect = toggleBtn.getBoundingClientRect();
  const canvasRect = canvas.elt.getBoundingClientRect();
  
  // Calculate adjusted mouse coordinates relative to canvas
  const adjustedMouseX = mouseX;
  const adjustedMouseY = mouseY;
  
  // Check if mouse is within toggle button bounds
  if (adjustedMouseX >= rect.left - canvasRect.left &&
      adjustedMouseX <= rect.right - canvasRect.left &&
      adjustedMouseY >= rect.top - canvasRect.top &&
      adjustedMouseY <= rect.bottom - canvasRect.top) {
    // Click is on the toggle button, don't trigger splat
    return;
  }
  
  // Only trigger splat if mouse is within canvas boundaries
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    splat(mouseX, mouseY);
  }
}

function mouseDragged() {
  // Only trigger splat if the mouse is dragged directly on the canvas
  // and not on any UI elements
  
  // Get toggle button position and dimensions
  const toggleBtn = document.getElementById('togglePanel');
  const rect = toggleBtn.getBoundingClientRect();
  const canvasRect = canvas.elt.getBoundingClientRect();
  
  // Calculate adjusted mouse coordinates relative to canvas
  const adjustedMouseX = mouseX;
  const adjustedMouseY = mouseY;
  
  // Check if mouse is within toggle button bounds
  if (adjustedMouseX >= rect.left - canvasRect.left &&
      adjustedMouseX <= rect.right - canvasRect.left &&
      adjustedMouseY >= rect.top - canvasRect.top &&
      adjustedMouseY <= rect.bottom - canvasRect.top) {
    // Drag is on the toggle button, don't trigger splat
    return;
  }
  
  // Only trigger splat if mouse is within canvas boundaries
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    splat(mouseX, mouseY);
  }
}

function draw_circles() {
  for (let i = 1; i < graphicsCanvas.width/squareSize; i++) {
    for (let j = 1; j < graphicsCanvas.height/squareSize; j++) {
      let posX = i * 100 + floor(random(-25, 25));
      let posY = j * 100 + floor(random(-25, 25));
      let circle_center = createVector(posX, posY);
      
      let circle_diameter = random(minCircleSize, maxCircleSize);
      
      // Fill with random color
      let randomColorFromArray = floor(random(colors.length));
      graphicsCanvas.fill(colors[randomColorFromArray][0], colors[randomColorFromArray][1], colors[randomColorFromArray][2]);
      
      // Stroke details
      let randomStrokeColorFromArray = floor(random(colors.length));
      graphicsCanvas.strokeWeight(random(1.5, 5.0));
      graphicsCanvas.stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
      
      let randomRotate = random(0, TWO_PI);
      
      graphicsCanvas.ellipse(circle_center.x, circle_center.y, circle_diameter * random(0.8, 1.2), circle_diameter * random(0.8, 1.2));
      
      graphicsCanvas.noFill();
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
  graphicsCanvas.stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
  graphicsCanvas.strokeWeight(random(2, 6));
  render_arc(arc_orig, TWO_PI*random(1/6, 1.5), random(3, 47), circle_diameter);
}

function render_arc(orig, arc_len, pts, circle_diameter) {
  let new_radius;
  let new_x=0;
  let new_y=0;
  let curr_rads=0;
  
  graphicsCanvas.beginShape();
  rads_incr = arc_len/pts;
  rads_start_pt = random(TWO_PI);
  radius = (circle_diameter/2)*random(1/10, 1);
  
  let randomXOffset = random(0.5, 10);
  let randomYOffset = random(0.5, 10);
  
  graphicsCanvas.translate(orig.x + randomXOffset, orig.y + randomYOffset);
  graphicsCanvas.curveVertex(cos(rads_start_pt)*radius, sin(rads_start_pt)*radius);
  
  for (let k=0; k<num_pts; k++) {
    curr_rads = rads_start_pt + (k*rads_incr);
    new_radius = radius + random(-5, 5);
    new_x = cos(curr_rads)*new_radius;
    new_y = sin(curr_rads)*new_radius;
    graphicsCanvas.curveVertex(new_x, new_y);
  }
  graphicsCanvas.curveVertex(new_x, new_y);
  graphicsCanvas.endShape();
  graphicsCanvas.translate(-(orig.x + randomXOffset), -(orig.y + randomYOffset));
}

function splat(x, y) {
  let rad = 17;
  graphicsCanvas.fill(random(360), 100, 100);
  for (let i=3; i<29; i+=.35) {
    let angle = random(0, TWO_PI);
    let splatX = x + cos(angle)*2*i;
    let splatY = y + sin(angle)*3*i;
    graphicsCanvas.ellipse(splatX, splatY, rad-i, rad-i+1.8);
  }
}