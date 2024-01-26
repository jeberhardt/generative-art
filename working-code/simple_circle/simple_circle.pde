int num_pts=47;
float radius;
float rads_incr;
float radius_offset;
float rads_start_pt;
PVector arc_orig;

void settings() {
  size(400, 400);
}
void setup() {
  radius_offset=width/500;
  background(255);
  stroke(0);
  noFill();
  arc_orig = new PVector(10, 44);
  render_arc(arc_orig, TWO_PI/4, num_pts);
};


void render_arc(PVector orig, float arc_len, float pts) {
  float new_radius;
  float new_x=0;
  float new_y=0;
  float curr_rads=0;

  beginShape();
  rads_incr = arc_len/pts;
  rads_start_pt = random(TWO_PI);
  radius = width/2.66;

  translate(width/2, height/2);
  curveVertex(cos(rads_start_pt)*radius, sin(rads_start_pt)*radius);
  //curveVertex(radius, 0);
  for (int i=0; i<num_pts; i++) {
    curr_rads = rads_start_pt + (i*rads_incr);
    new_radius = radius + random(-radius_offset, radius_offset);
    new_x = cos(curr_rads)*new_radius;
    new_y = sin(curr_rads)*new_radius;
    curveVertex(new_x, new_y);
  }
  curveVertex(new_x, new_y);
  endShape();
}
