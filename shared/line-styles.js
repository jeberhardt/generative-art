// drawLine(p, x1, y1, x2, y2, color, style)
// color: any CSS color string. style: 'clean' | 'marker' | 'sketchy' | 'wavy'
function drawLine(p, x1, y1, x2, y2, color, style) {
  const c = p.color(color);
  const r = p.red(c), g = p.green(c), b = p.blue(c);
  p.noFill();

  switch (style) {

    case 'marker': {
      // Felt-tip marker: round caps, wide semi-transparent base with opaque pass on top
      p.strokeCap(p.ROUND);
      p.stroke(r, g, b, 160);
      p.strokeWeight(8);
      p.line(x1, y1, x2, y2);
      p.stroke(r, g, b, 220);
      p.strokeWeight(4.5);
      p.line(x1, y1, x2, y2);
      break;
    }

    case 'sketchy': {
      // Hand-drawn: three thin passes offset perpendicular to the line
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len, ny = dx / len;
      p.strokeCap(p.ROUND);
      const offsets = [-1.2,  0.4,  1.6];
      const alphas  = [ 110, 190,   90];
      const weights = [ 1.5,   2,    1];
      for (let i = 0; i < 3; i++) {
        p.stroke(r, g, b, alphas[i]);
        p.strokeWeight(weights[i]);
        p.line(
          x1 + nx * offsets[i], y1 + ny * offsets[i],
          x2 + nx * offsets[i], y2 + ny * offsets[i]
        );
      }
      break;
    }

    case 'wavy': {
      // Thick Perlin-noise-deviated path, rendered as a filled polygon (à la Abutment).
      // Displacement tapers to zero at both endpoints so the path still hits (x1,y1)→(x2,y2).
      const STEPS   = 80;
      const THICK   = 10;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len, ny = dx / len;
      // Per-line noise offset — deterministic so redraw is stable
      const noiseOff = (x1 * 0.011 + y1 * 0.007 + x2 * 0.003) % 100;

      const pts = [];
      for (let i = 0; i <= STEPS; i++) {
        const t  = i / STEPS;
        const envelope = Math.sin(t * Math.PI); // taper at both ends
        const lx = x1 + dx * t;
        const ly = y1 + dy * t;
        const noise = p.noise(lx * 0.008 + noiseOff, ly * 0.008);
        const disp  = (noise - 0.5) * 14 * envelope;
        pts.push({ x: lx + nx * disp, y: ly + ny * disp });
      }

      p.noFill();
      p.stroke(r, g, b);
      p.strokeWeight(THICK);
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      p.beginShape();
      for (const pt of pts) p.vertex(pt.x, pt.y);
      p.endShape();
      break;
    }

    default: { // 'clean'
      p.strokeCap(p.SQUARE);
      p.stroke(r, g, b);
      p.strokeWeight(5);
      p.line(x1, y1, x2, y2);
    }
  }
}
