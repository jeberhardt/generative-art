# Abutment

The original doodle was made with a teal marker on paper. A loose grid of lines crossing the page at various angles — but not quite a grid. Some lines pass through others. Some stop exactly where they meet. The more I looked at it, the more I noticed a rule buried in the marks: a line can cross one other line freely, but when it hits a second crossing, it stops there. It *abuts* the intersection rather than continuing through.

That one observation became the whole algorithm.

---

## Starting from an edge

Every line begins off-canvas, on a randomly chosen edge. I wanted the lines to feel like they'd wandered in from somewhere — not born in the middle of the page.

```js
function randomEdgeStart() {
  const side = p.floor(p.random(4)); // 0=top, 1=right, 2=bottom, 3=left
  // ...
  if (side === 0) {
    x = p.random(W * 0.1, W * 0.9);
    y = -offscreen;
    angle = p.random(p.PI * 0.1, p.PI * 0.9); // must point downward
  }
  // ...
}
```

The angle constraints matter. A line entering from the top has to be pointing generally downward — otherwise it would immediately exit again. Each edge gets its own valid arc of directions.

---

## Marching

Rather than drawing lines as single calls to `p.line()`, each line is built by *marching* — taking small steps and recording each position as a point in an array. That array of points becomes the line.

```js
for (let step = 0; step < maxSteps; step++) {
  const nx = x + Math.cos(angle) * STEP;
  const ny = y + Math.sin(angle) * STEP;
  // ... check for crossings ...
  pts.push({ x: stopX, y: stopY });
}
```

Marching gives you fine-grained control. At each step you can inspect the position, check against other lines, and decide whether to continue or stop. It's more expensive than a straight line draw, but it's the only way to implement the abutment rule precisely.

---

## The slight curve

Real marker lines aren't perfectly straight — the hand moves, the pen catches. I added a very gentle Perlin noise drift to the angle at each step.

```js
const noiseVal = p.noise(x * NOISE_SCALE + noiseOff, y * NOISE_SCALE + noiseOff * 1.3);
angle += (noiseVal - 0.5) * NOISE_STRENGTH * 0.25;
```

`NOISE_SCALE = 0.008` is quite small — the noise field changes slowly relative to the canvas, which produces a long gradual curve rather than jitter. Each line also gets a unique `noiseOff` value so they don't all curve the same way.

I also locked the direction of drift. Once a line starts bending one way, it can only continue in that direction — no S-curves.

```js
if (driftSign === 0 && Math.abs(drift) > 0.02) {
  driftSign = Math.sign(drift);
}
if (driftSign !== 0 && Math.sign(drift) !== driftSign && Math.abs(drift) > 0.01) {
  angle = startAngle;
}
```

It's a small thing, but it made the lines feel more deliberate. S-curves read as wobbly; single-direction curves read as intentional.

---

## Detecting crossings

At each march step, I check whether the current micro-segment intersects any existing line. The intersection test is a standard segment–segment check that returns the parameter `t` — how far along the segment the crossing occurs.

```js
function segIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  // ...
  const t = ((bx1 - ax1) * dy2 - (by1 - ay1) * dx2) / denom;
  const u = ((bx1 - ax1) * dy1 - (by1 - ay1) * dx1) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return t;
  return null;
}
```

I track a `crossings` counter per line. The first crossing is passed through freely. The second crossing is where the line stops — exactly at the intersection point.

```js
if (crossings === 2) {
  stopX = hit.ix;
  stopY = hit.iy;
  stopHere = true;
  break;
}
```

Getting the stop position right required using `t` to compute the exact pixel where the paths cross, rather than stopping at the end of the step. A step is 2px — close enough for most purposes, but at the junctions it was visible.

---

## Preventing crowding

The doodle has a sense of spacing — lines don't run alongside each other for long stretches. Enforcing that turned out to be one of the trickier parts.

For each candidate line, I scan every point along it and measure its distance to every segment of every existing line. If too many consecutive points are within `MIN_GAP = 28px` of another line (without a crossing to explain the proximity), the candidate is rejected.

```js
if (minD < MIN_GAP && minD > STROKE_W * 0.6) {
  closeCount++;
  if (closeCount > 6) return true; // too close — reject
} else {
  closeCount = 0;
}
```

The `STROKE_W * 0.6` lower bound is intentional: points very close to another line (less than half a stroke width) are actually *crossing* it, not running parallel to it, so they don't count against the candidate.

I also prevented triple intersections — three lines meeting at the same point. That would collapse the clean junction geometry into a messy cluster.

```js
if (nearExistingIntersection(hit.ix, hit.iy, STROKE_W * 4)) continue;
```

---

## Drawing the lines

I wanted the lines to look opaque — like a real marker that covers what's beneath it. P5.js's default `stroke()` doesn't do that well; alpha blending at overlapping segments creates muddy areas.

Instead, each line is drawn as a filled shape using `TRIANGLE_STRIP`. At each point I compute the tangent direction, then offset perpendicular to it by half the stroke width on each side, producing two vertices per point.

```js
p.beginShape(p.TRIANGLE_STRIP);
for (let i = 0; i < pts.length; i++) {
  // tangent ...
  const nx = -ty / len * w * 0.5;
  const ny =  tx / len * w * 0.5;
  p.vertex(pts[i].x + nx, pts[i].y + ny);
  p.vertex(pts[i].x - nx, pts[i].y - ny);
}
p.endShape();
```

Before drawing each line in teal, I draw it first in the background paper colour at `STROKE_W + 2`. That "knockout" erases whatever's beneath, so the teal layer on top is fully opaque. It's a simple trick but it gives the intersections a clean, crisp look.

---

## The paper

The background isn't white — it's a warm off-white (`245, 243, 238`), and I added a paper grain by walking every pixel and nudging its RGB values by a small random amount.

```js
p.loadPixels();
for (let i = 0; i < p.pixels.length; i += 4) {
  const grain = p.random(-6, 6);
  p.pixels[i]   = p.constrain(p.pixels[i]   + grain, 0, 255);
  // ...
}
p.updatePixels();
```

It's subtle enough that you might not notice it, but if you swap it for a flat white the sketch immediately feels more digital and less physical. The grain does a lot of quiet work.

---

## What I'd do differently

The crowding check is O(n²) — every new line scans every segment of every existing line. With 22 lines and steps of 2px, it's fast enough, but it wouldn't scale. If I wanted significantly more lines I'd need a spatial index.

I'd also like to explore colour. The teal marker is faithful to the original doodle, but the algorithm would work with any palette — and I'm curious what the same structure looks like in warm earth tones, or with each line a different colour.
