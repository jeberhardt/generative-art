ArrayList <Splat> splats = new ArrayList <Splat> ();
 
void setup() {
  size(400, 400);
}
 
void draw() {
  background(255);
  for (Splat s : splats) {
    s.display();
  }
}
 
void mousePressed() {
  splats.add(new Splat(mouseX,mouseY));
}
 
void mouseDragged() {
  splats.add(new Splat(mouseX,mouseY));
}
 
class Splat {
  float x,y;
  float rad;
  PGraphics splat;
 
  Splat(float x, float y) {
    this.x = x;
    this.y = y;
    rad = 17;
    splat = createGraphics(200,200,JAVA2D);
    create();
  }
 
  void create() {
    splat.beginDraw();
    splat.smooth();
    splat.colorMode(HSB,360,100,100);
    splat.fill(random(360),100,100);
    splat.noStroke();
    for (float i=3; i<29; i+=.35) {
      float angle = random(0, TWO_PI);
      float splatX = (splat.width-50)/2 + 25 + cos(angle)*2*i;
      float splatY = (splat.height-50)/2 + 25 + sin(angle)*3*i;
      splat.ellipse(splatX, splatY, rad-i, rad-i+1.8);
    }
    splat.endDraw();
  }
 
  void display() {
    imageMode(CENTER);
    image(splat,x,y);
  }
}
