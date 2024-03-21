PGraphics canvas;

import processing.serial.*;
import java.util.*;
import org.gicentre.handy.*;

Serial port;    // Create an object from Serial class
String val;     // Data received from the serial port

int squareSize = 100;

int num_pts=47;
float radius;
float rads_incr;
float radius_offset;
float rads_start_pt;
PVector arc_orig;

HandyRenderer h;

color[][] colors_rgb_red  = {
  {255, 0, 0}, {255, 69, 0}, {255, 140, 0}, {255, 215, 0},
  {255, 160, 122}, {255, 105, 180}, {255, 192, 203}, {255, 215, 0},
  {240, 128, 128}, {220, 20, 60}, {178, 34, 34}, {139, 0, 0},
  {128, 0, 0}, {139, 69, 19}, {165, 42, 42}, {210, 105, 30},
  {205, 133, 63}, {222, 184, 135}, {244, 164, 96}, {218, 165, 32},
  {255, 215, 0}, {255, 99, 71}, {255, 69, 0}, {255, 140, 0},
  {255, 215, 0}, {255, 160, 122}, {255, 105, 180}, {255, 192, 203},
  {255, 215, 0}, {240, 128, 128}, {220, 20, 60}, {178, 34, 34},
  {139, 0, 0}, {128, 0, 0}, {139, 69, 19}, {165, 42, 42},
  {210, 105, 30}, {205, 133, 63}, {222, 184, 135}, {244, 164, 96},
  {218, 165, 32}, {255, 215, 0}, {255, 99, 71}, {255, 69, 0},
  {255, 140, 0}, {255, 215, 0}, {255, 160, 122}, {255, 105, 180},
  {255, 192, 203}, {255, 215, 0}, {240, 128, 128}, {220, 20, 60},
  {178, 34, 34}, {139, 0, 0}, {128, 0, 0}, {139, 69, 19},
  {165, 42, 42}, {210, 105, 30}, {205, 133, 63}, {222, 184, 135},
  {244, 164, 96}, {218, 165, 32}, {255, 215, 0}, {255, 99, 71},
  {255, 69, 0}, {255, 140, 0}, {255, 215, 0}, {255, 160, 122},
  {255, 105, 180}, {255, 192, 203}, {255, 215, 0}, {240, 128, 128},
  {220, 20, 60}
};

color[][] colors_blue = {
  {70, 130, 180}, {100, 149, 237}, {0, 0, 128},
  {30, 144, 255}, {0, 0, 205}, {0, 0, 255},
  {0, 0, 139}, {0, 0, 205}, {0, 0, 128},
  {25, 25, 112}, {0, 0, 139}, {0, 0, 128},
  {70, 130, 180}, {100, 149, 237}, {0, 0, 128},
  {30, 144, 255}, {0, 0, 205}, {0, 0, 255},
  {0, 0, 139}, {0, 0, 205}, {0, 0, 128},
  {25, 25, 112}, {0, 0, 139}, {0, 0, 128},
  {70, 130, 180}, {100, 149, 237}, {0, 0, 128},
  {30, 144, 255}, {0, 0, 205}, {0, 0, 255},
  {0, 0, 139}, {0, 0, 205}, {0, 0, 128},
  {25, 25, 112}, {0, 0, 139}, {0, 0, 128},
  {70, 130, 180}, {100, 149, 237}, {0, 0, 128},
  {30, 144, 255}, {0, 0, 205}, {0, 0, 255},
  {0, 0, 139}, {0, 0, 205}, {0, 0, 128},
  {25, 25, 112}, {0, 0, 139}, {0, 0, 128},
  {70, 130, 180}, {100, 149, 237}, {0, 0, 128},
  {30, 144, 255}, {0, 0, 205}, {0, 0, 255},
  {0, 0, 139}, {0, 0, 205}, {0, 0, 128},
  {25, 25, 112}, {0, 0, 139}, {0, 0, 128},
  {70, 130, 180}, {100, 149, 237}, {0, 0, 128},
  {30, 144, 255}, {0, 0, 205}, {0, 0, 255},
  {0, 0, 139}, {0, 0, 205}, {0, 0, 128},
  {25, 25, 112}, {0, 0, 139}, {0, 0, 128}
};

color[][] all_colors = {
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Red, Green, Blue
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Yellow, Magenta, Cyan
  {128, 0, 0}, {0, 128, 0}, {0, 0, 128}, // Maroon, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // DarkOrange, Red-Orange, Pink
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Red, Green, Blue
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Yellow, Magenta, Cyan
  {128, 0, 0}, {0, 128, 0}, {0, 0, 128}, // Maroon, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // DarkOrange, Red-Orange, Pink
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Red, Green, Blue
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Yellow, Magenta, Cyan
  {128, 0, 0}, {0, 128, 0}, {0, 0, 128}, // Maroon, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // DarkOrange, Red-Orange, Pink
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Red, Green, Blue
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Yellow, Magenta, Cyan
  {128, 0, 0}, {0, 128, 0}, {0, 0, 128}, // Maroon, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // DarkOrange, Red-Orange, Pink
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Red, Green, Blue
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Yellow, Magenta, Cyan
  {128, 0, 0}, {0, 128, 0}, {0, 0, 128}, // Maroon, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}  // DarkOrange, Red-Orange, Pink
};

color[][] colors = {
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Primary Colors
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Secondary Colors
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // Warm Tones
  {0, 128, 0}, {0, 0, 128}, {255, 255, 255}, // Green, Navy, White
  {255, 99, 71}, {218, 112, 214}, {70, 130, 180}, // Tomato, Orchid, Steel Blue
  {255, 20, 147}, {0, 191, 255}, {240, 128, 128}, // Deep Pink, Deep Sky Blue, Light Coral
  {128, 0, 128}, {255, 215, 0}, {0, 128, 128}, // Purple, Gold, Teal
  {255, 215, 0}, {255, 0, 0}, {0, 255, 0}, // Gold, Red, Green
  {0, 0, 255}, {255, 192, 203}, {255, 69, 0}, // Blue, Pink, Red-Orange
  {255, 160, 122}, {0, 255, 255}, {255, 0, 255}, // Light Salmon, Aqua, Magenta
  {255, 255, 0}, {0, 128, 0}, {0, 0, 128}, // Yellow, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // DarkOrange, Red-Orange, Pink
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255}, // Red, Green, Blue
  {255, 255, 0}, {255, 0, 255}, {0, 255, 255}, // Yellow, Magenta, Cyan
  {128, 0, 0}, {0, 128, 0}, {0, 0, 128}, // Maroon, Green, Navy
  {255, 140, 0}, {255, 69, 0}, {255, 192, 203}, // DarkOrange, Red-Orange, Pink
};

void settings() {
  fullScreen();
}
void setup() {
  
  h = new HandyRenderer(this);
  h = HandyPresets.createWaterAndInk(this);
  
  background(0);
  blendMode(REPLACE);
  // port = new Serial(this, "/dev/cu.usbmodem14201", 115200);
  
  canvas = createGraphics(1000, 1000, JAVA2D);
  canvas.beginDraw();
  canvas.smooth();  
  canvas.colorMode(HSB, 360, 100, 100);
  canvas.noStroke();
  canvas.endDraw();
  
  draw_circles();
  save_screenshot();
};

void save_screenshot() {
  Date d = new Date();
  save("img" + d.getTime() + ".png");
}

//void mouseClicked() {
//  background(0);
//  draw_circles();
//  save_screenshot();
//}

void mousePressed() {
  splat(mouseX, mouseY);
}

void mouseDragged() {
  splat(mouseX, mouseY);
}

void draw() {
  //if ( port.available() > 0) { // If data is available,
  //  val = port.readStringUntil('\n');         // read it and store it in val
  //}
  println(val); //print out in the console  
}

void draw_circles() {
  for (int i = 1; i < displayWidth/squareSize; i = i+1) {
    println(i);
    for (int j = 1; j < displayHeight/squareSize; j = j+1) {
      print(j + " ");
      int posX = i * 100 + int(random(-25, 25));
      int posY = j * 100 + int(random(-25, 25));
      PVector circle_center = new PVector(posX, posY);

      float circle_diameter = random(squareSize - 50, squareSize + 50);

      int randomColorFromArray = int(random(colors.length));

      h.setIsHandy(false);
      fill(colors[randomColorFromArray][0], colors[randomColorFromArray][1], colors[randomColorFromArray][2]);
      //noStroke();
      //rotate(random(0, 0.5));
      h.setIsHandy(true);
      h.ellipse(circle_center.x, circle_center.y, circle_diameter, circle_diameter * random(0.8, 1.2));
      //rotate(0);

      noFill();
      arc_orig = circle_center;

      int number_of_arcs = int(random(3, 10));
      for (int arc_count = 0; arc_count < number_of_arcs; arc_count = arc_count + 1) {
        initiate_arc(arc_orig, circle_diameter);
      }
      /*
      randomStrokeColorFromArray = int(random(colors.length));
       stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
       strokeWeight(random(2, 6));
       render_arc(arc_orig, TWO_PI/random(1,6), random(3, 47), circle_diameter);
       
       randomStrokeColorFromArray = int(random(colors.length));
       stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
       strokeWeight(random(2, 6));
       render_arc(arc_orig, TWO_PI/random(1,6), random(3, 47), circle_diameter);
       */


      /*
      beginShape();
       float startingPositionX = posX + (sqSz/2) + random(TWO_PI);
       float startingPositionY = posY + (sqSz/2) + random(TWO_PI);
       curveVertex(startingPositionX, startingPositionY);
       curveVertex(startingPositionX, startingPositionY);
       //curveVertex(posX + (sqSz/2) + sin(2), posY + (sqSz/2) + cos(2));
       //curveVertex(posX + (sqSz/2) + sin(4), posY + (sqSz/2) + cos(4));
       //curveVertex(posX + (sqSz/2) + sin(4), posY + (sqSz/2) + cos(4));
       curveVertex(startingPositionX + random(TWO_PI), startingPositionY + random(TWO_PI));
       curveVertex(posX, posY + (sqSz/2));
       curveVertex(posX, posY + (sqSz/2));
       endShape();
       */
    }
  }
}

void initiate_arc(PVector arc_orig, float circle_diameter) {
  int randomStrokeColorFromArray = int(random(colors.length));
  stroke(colors[randomStrokeColorFromArray][0], colors[randomStrokeColorFromArray][1], colors[randomStrokeColorFromArray][2]);
  strokeWeight(random(2, 6));
  render_arc(arc_orig, TWO_PI*random(1/6, 1.5), random(3, 47), circle_diameter);
}

void render_arc(PVector orig, float arc_len, float pts, float circle_diameter) {
  float new_radius;
  float new_x=0;
  float new_y=0;
  float curr_rads=0;

  beginShape();
  rads_incr = arc_len/pts;
  rads_start_pt = random(TWO_PI);
  radius = (circle_diameter/2)*random(1/10, 1);

  translate(orig.x, orig.y);
  curveVertex(cos(rads_start_pt)*radius, sin(rads_start_pt)*radius);
  //curveVertex(radius, 0);
  for (int k=0; k<num_pts; k++) {
    curr_rads = rads_start_pt + (k*rads_incr);
    new_radius = radius + random(-5, 5);
    new_x = cos(curr_rads)*new_radius;
    new_y = sin(curr_rads)*new_radius;
    curveVertex(new_x, new_y);
  }
  curveVertex(new_x, new_y);
  endShape();
  translate(-orig.x, -orig.y);
}

void splat(float x, float y) {
  int rad = 17;
  //beginDraw();
  fill(random(360), 100, 100);
  for (float i=3; i<29; i+=.35) {
    float angle = random(0, TWO_PI);
    float splatX = x + cos(angle)*2*i;
    float splatY = y + sin(angle)*3*i;
    ellipse(splatX, splatY, rad-i, rad-i+1.8);
  }
  //endDraw();
}
