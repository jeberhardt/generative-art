new p5(function(p) {

  // Cream paper background palette
  const PAPER = [238, 232, 218];

  // Single pen — one base hue, only saturation/darkness varies
  const PEN = [62, 118, 158];

  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noLoop();
  };

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.redraw();
  };

  p.draw = function() {
    p.background(PAPER[0], PAPER[1], PAPER[2]);

    p.noStroke();
    for (let i = 0; i < 18000; i++) {
      const tx = p.random(p.width);
      const ty = p.random(p.height);
      const tb = p.random(-10, 10);
      p.fill(PAPER[0] + tb, PAPER[1] + tb, PAPER[2] + tb, p.random(40, 110));
      p.ellipse(tx, ty, p.random(0.4, 1.2));
    }

    const lineSpacing = 5.5;
    const numLines = Math.floor(p.width / lineSpacing) + 1;

    p.strokeCap(p.PROJECT);

    const driftSeed  = p.random(1000);
    const weightSeed = p.random(1000);
    const twitchSeed = p.random(1000);

    for (let i = 0; i < numLines; i++) {
      const xBase = i * lineSpacing;

      const isAccent = p.random() < 0.06;
      const baseAlpha = isAccent ? p.random(170, 220) : p.random(95, 160);

      const steps = 120;
      const yStep = p.height / steps;
      const inkLoadSeed = p.random(1000);
      const inkLoadBase = p.random(0.6, 1.0);

      // Wobble = slow drift + high-freq nib twitch
      const pts = [];
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const drift  = (p.noise(i * 0.15 + driftSeed,   t * 5.5)  - 0.5) * 14;
        const twitch = (p.noise(i * 1.2  + twitchSeed,  t * 38.0) - 0.5) * 2.2
                     + (p.noise(i * 2.1  + twitchSeed,  t * 70.0) - 0.5) * 0.8;
        pts.push({ x: xBase + drift + twitch, y: s * yStep });
      }

      p.noStroke();

      // Pre-compute hesitation values so we can look ahead/behind for taper
      const hesVals = [];
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        hesVals.push(p.noise(i * 0.7 + driftSeed + 200, t * 25));
      }

      // Nib catch bias — which side of the line the nib favours this stroke
      const nibSide = p.random() < 0.5 ? 1 : -1;
      const nibCatchSeed = p.random(1000);

      for (let s = 0; s < steps; s++) {
        const t = s / steps;

        if (hesVals[s] < 0.09) continue;

        // Taper: look at nearby hesitation values to fade width+alpha near lift/resume
        const lookBack = Math.max(0, s - 4);
        const lookFwd  = Math.min(steps - 1, s + 4);
        let nearGap = 0;
        for (let k = lookBack; k <= lookFwd; k++) {
          if (hesVals[k] < 0.09) nearGap = Math.max(nearGap, 1 - Math.abs(k - s) / 5);
        }
        const taperFactor = 1 - nearGap * 0.75; // thinner and lighter near gap edges

        // inkLoad drifts slowly along the line — same variation as line-to-line, now within a line
        const inkLoad = inkLoadBase * (0.6 + p.noise(i * 0.25 + inkLoadSeed, t * 3.0) * 0.8);

        const pressureSlow = p.noise(i * 0.2 + weightSeed, t * 2.5);
        const pressureFast = p.noise(i * 0.8 + weightSeed + 99, t * 18);
        const pressure = pressureSlow * 0.7 + pressureFast * 0.3;

        // Nib catch: occasional asymmetric feather on one side
        const nibCatch = p.noise(i * 1.5 + nibCatchSeed, t * 45);
        const nibBulge = nibCatch > 0.72 ? (nibCatch - 0.72) * nibSide * 2.5 : 0;

        const hwBase = p.map(pressure, 0, 1, 0.1, 1.1) * inkLoad * taperFactor;
        // Asymmetric: one side gets the bulge, the other stays clean
        const hwLeft  = hwBase + Math.max(0,  nibBulge);
        const hwRight = hwBase + Math.max(0, -nibBulge);

        const sat = p.map(pressure, 0, 1, 0.55, 1.15) * inkLoad;
        const r = p.constrain(PEN[0] * sat, 10, 180);
        const g = p.constrain(PEN[1] * sat, 40, 210);
        const b = p.constrain(PEN[2] * sat, 80, 230);

        const alphaFlicker = p.noise(i * 0.4 + 33, t * 9) * 0.5 + 0.5;
        const alpha = baseAlpha * inkLoad * alphaFlicker
                    * p.map(pressure, 0, 1, 0.5, 1.15)
                    * taperFactor;

        p.fill(r, g, b, p.constrain(alpha, 0, 255));

        const x0 = pts[s].x,   y0 = pts[s].y;
        const x1 = pts[s+1].x, y1 = pts[s+1].y;
        const dx = x1 - x0, dy = y1 - y0;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nxU = -dy / len;  // unit normal
        const nyU =  dx / len;

        // Asymmetric quad: left and right sides have independent half-widths
        p.quad(
          x0 - nxU * hwLeft,  y0 - nyU * hwLeft,
          x0 + nxU * hwRight, y0 + nyU * hwRight,
          x1 + nxU * hwRight, y1 + nyU * hwRight,
          x1 - nxU * hwLeft,  y1 - nyU * hwLeft
        );
      }

      // Ghost pass
      if (isAccent || p.random() < 0.08) {
        const offsetX = p.random(-1.5, 1.5);
        const ghostPts = [];
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const drift  = (p.noise(i * 0.15 + driftSeed  + 50, t * 5.5)  - 0.5) * 11;
          const twitch = (p.noise(i * 1.2  + twitchSeed + 50, t * 38.0) - 0.5) * 1.5;
          ghostPts.push({ x: xBase + offsetX + drift + twitch, y: s * yStep });
        }
        for (let s = 0; s < steps; s++) {
          if (p.random() < 0.03) continue;
          const t = s / steps;
          const alpha = baseAlpha * 0.3 * (0.5 + p.noise(i * 0.3 + 7, t * 6) * 0.6);
          p.noStroke();
          p.fill(PEN[0], PEN[1], PEN[2], alpha);
          const x0 = ghostPts[s].x,   y0 = ghostPts[s].y;
          const x1 = ghostPts[s+1].x, y1 = ghostPts[s+1].y;
          const dx = x1 - x0, dy = y1 - y0;
          const len = Math.sqrt(dx*dx + dy*dy) || 1;
          const hw = p.random(0.1, 0.3);
          const nx = -dy / len * hw;
          const ny =  dx / len * hw;
          p.quad(x0-nx, y0-ny, x0+nx, y0+ny, x1+nx, y1+ny, x1-nx, y1-ny);
        }
      }
    }

  };

  // Click to regenerate
  p.mousePressed = function() {
    p.redraw();
  };

});
