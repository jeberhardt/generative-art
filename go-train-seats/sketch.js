new p5(function(p) {

  const COLORS = [
    [ 82, 108, 100],   // dark teal-grey
    [148, 162, 158],   // light silvery-grey
  ];

  const COLS    = 6;
  const SPEED   = 1.2;   // px per frame
  const DIRS    = [[0,1],[1,0],[1,1],[1,-1]];

  let W, H, cellW, cellH, baseR;
  let ROWS;
  let cells = [];         // ring buffer — fixed array, index wraps
  let cache = [];         // 4 pre-rendered p5.Graphics (colorIdx 0/1 × hatch v/h)
  let bgGraphic = null;   // static background stripes
  let offsetY = 0;        // sub-cell scroll offset in px

  // ── Helpers ─────────────────────────────────────────────────────────

  function cacheKey(colorIdx, hatch) {
    return colorIdx * 2 + (hatch === 'vertical' ? 0 : 1);
  }

  function buildBg() {
    if (bgGraphic) bgGraphic.remove();
    bgGraphic = p.createGraphics(W, H);
    // Linen background
    bgGraphic.background(224, 218, 208);  // warm grey-cream, slightly darker than before
    let gap = 3;
    let col = [82, 108, 100];
    bgGraphic.strokeWeight(1.2);
    bgGraphic.stroke(col[0], col[1], col[2], 90);  // more visible teal-grey lines
    for (let y = 0; y < H; y += gap) {
      bgGraphic.line(0, y, W, y);
    }
  }

  function buildCache() {
    // Discard old graphics
    cache.forEach(g => g && g.remove());
    cache = [];

    let sz = Math.ceil(cellW);
    let R  = baseR;
    let gap = 6;

    for (let ci = 0; ci < 2; ci++) {
      for (let hi = 0; hi < 2; hi++) {
        let g = p.createGraphics(sz, sz);
        g.clear();
        let col = COLORS[ci];
        g.strokeWeight(2.4);
        g.stroke(col[0], col[1], col[2], 210);
        let cx = sz / 2, cy = sz / 2;

        // Snap start to first full gap-step inside the circle,
        // end to last full gap-step — eliminates single-pixel edge dots.
        let start = Math.ceil((-R) / gap) * gap;
        let end   = Math.floor(( R) / gap) * gap;

        if (hi === 0) {
          // vertical hatch
          for (let x = start; x <= end; x += gap) {
            let t = x / R;
            let hw = R * Math.sqrt(Math.max(0, 1 - t * t));
            g.line(cx + x, cy - hw, cx + x, cy + hw);
          }
        } else {
          // horizontal hatch
          for (let y = start; y <= end; y += gap) {
            let t = y / R;
            let hw = R * Math.sqrt(Math.max(0, 1 - t * t));
            g.line(cx - hw, cy + y, cx + hw, cy + y);
          }
        }

        cache[ci * 2 + hi] = g;
      }
    }
  }

  function makeRow() {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        skip:     Math.random() < 0.25,
        colorIdx: Math.random() < 0.5 ? 0 : 1,
        hatch:    Math.random() > 0.5 ? 'vertical' : 'horizontal',
      });
    }
    return row;
  }

  // Count consecutive cells matching `skipVal` centred on [r,c] in direction [dr,dc]
  function runLength(r, c, dr, dc, skipVal, maxR) {
    let count = 1;
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < maxR && nc >= 0 && nc < COLS && cells[nr][nc].skip === skipVal) { count++; nr += dr; nc += dc; }
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < maxR && nc >= 0 && nc < COLS && cells[nr][nc].skip === skipVal) { count++; nr -= dr; nc -= dc; }
    return count;
  }

  // Count consecutive filled cells with same colorIdx
  function colorRunLength(r, c, dr, dc, maxR) {
    if (cells[r][c].skip) return 0;
    let v = cells[r][c].colorIdx;
    let count = 1;
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < maxR && nc >= 0 && nc < COLS && !cells[nr][nc].skip && cells[nr][nc].colorIdx === v) { count++; nr += dr; nc += dc; }
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < maxR && nc >= 0 && nc < COLS && !cells[nr][nc].skip && cells[nr][nc].colorIdx === v) { count++; nr -= dr; nc -= dc; }
    return count;
  }

  // Count consecutive filled cells with same hatch direction
  function hatchRunLength(r, c, dr, dc, maxR) {
    if (cells[r][c].skip) return 0;
    let v = cells[r][c].hatch;
    let count = 1;
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < maxR && nc >= 0 && nc < COLS && !cells[nr][nc].skip && cells[nr][nc].hatch === v) { count++; nr += dr; nc += dc; }
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < maxR && nc >= 0 && nc < COLS && !cells[nr][nc].skip && cells[nr][nc].hatch === v) { count++; nr -= dr; nc -= dc; }
    return count;
  }

  // Try all 4 variants to find one satisfying color+hatch run constraints
  function fixCell(r, c, maxR) {
    let variants = [0,1,2,3].sort(() => Math.random() - 0.5);
    for (let v of variants) {
      cells[r][c].colorIdx = Math.floor(v / 2);
      cells[r][c].hatch = (v % 2 === 0) ? 'vertical' : 'horizontal';
      let ok = true;
      for (let [dr, dc] of DIRS) {
        if (colorRunLength(r, c, dr, dc, maxR) >= 3) { ok = false; break; }
        if (hatchRunLength(r, c, dr, dc, maxR) >= 3) { ok = false; break; }
      }
      if (ok) return;
    }
  }

  function applyRunConstraints(maxRows) {
    let changed = true;
    let iterations = 0;
    while (changed && iterations++ < 1000) {
      changed = false;
      for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < COLS; c++) {
          for (let [dr, dc] of DIRS) {
            if (cells[r][c].skip && runLength(r, c, dr, dc, true, maxRows) >= 3) {
              cells[r][c].skip = false; changed = true; break;
            }
            if (!cells[r][c].skip && runLength(r, c, dr, dc, false, maxRows) >= 5) {
              cells[r][c].skip = true; changed = true; break;
            }
            if (!cells[r][c].skip && (colorRunLength(r, c, dr, dc, maxRows) >= 3 || hatchRunLength(r, c, dr, dc, maxRows) >= 3)) {
              fixCell(r, c, maxRows); changed = true; break;
            }
          }
        }
      }
    }
  }

  function enforceConstraints() {
    // Pass 1: fix runs (both skip and filled)
    applyRunConstraints(ROWS);

    // Every row: at least ceil(COLS/5) skips
    let minR = Math.ceil(COLS / 5);
    for (let r = 0; r < ROWS; r++) {
      let s = cells[r].filter(c => c.skip).length, att = 0;
      while (s < minR && att++ < 100) {
        let c = p.floor(p.random(COLS));
        if (!cells[r][c].skip) { cells[r][c].skip = true; s++; }
      }
    }

    // Every column: at least ceil(ROWS/5) skips
    let minC = Math.ceil(ROWS / 5);
    for (let c = 0; c < COLS; c++) {
      let s = cells.filter(row => row[c].skip).length, att = 0;
      while (s < minC && att++ < 100) {
        let r = p.floor(p.random(ROWS));
        if (!cells[r][c].skip) { cells[r][c].skip = true; s++; }
      }
    }

    // Pass 2: re-fix runs after adding skips
    applyRunConstraints(ROWS);
  }

  function enforceNewRow() {
    let changed = true;
    let iter = 0;
    while (changed && iter++ < 200) {
      changed = false;
      for (let c = 0; c < COLS; c++) {
        for (let [dr, dc] of DIRS) {
          if (cells[0][c].skip && runLength(0, c, dr, dc, true, ROWS) >= 3) {
            cells[0][c].skip = false; changed = true; break;
          }
          if (!cells[0][c].skip && runLength(0, c, dr, dc, false, ROWS) >= 5) {
            cells[0][c].skip = true; changed = true; break;
          }
          if (!cells[0][c].skip && (colorRunLength(0, c, dr, dc, ROWS) >= 3 || hatchRunLength(0, c, dr, dc, ROWS) >= 3)) {
            fixCell(0, c, ROWS); changed = true; break;
          }
        }
      }
    }

    // Row 0 must have at least ceil(COLS/5) skips
    let minR = Math.ceil(COLS / 5);
    let s = cells[0].filter(c => c.skip).length, att = 0;
    while (s < minR && att++ < 100) {
      let c = Math.floor(Math.random() * COLS);
      if (!cells[0][c].skip) { cells[0][c].skip = true; s++; }
    }

    // Re-check after adding skips
    changed = true; iter = 0;
    while (changed && iter++ < 200) {
      changed = false;
      for (let c = 0; c < COLS; c++) {
        for (let [dr, dc] of DIRS) {
          if (cells[0][c].skip && runLength(0, c, dr, dc, true, ROWS) >= 3) {
            cells[0][c].skip = false; changed = true; break;
          }
          if (!cells[0][c].skip && runLength(0, c, dr, dc, false, ROWS) >= 5) {
            cells[0][c].skip = true; changed = true; break;
          }
          if (!cells[0][c].skip && (colorRunLength(0, c, dr, dc, ROWS) >= 3 || hatchRunLength(0, c, dr, dc, ROWS) >= 3)) {
            fixCell(0, c, ROWS); changed = true; break;
          }
        }
      }
    }
  }

  p.setup = function() {
    W = Math.min(p.windowWidth, 540);
    H = Math.min(p.windowHeight, 960);
    p.createCanvas(W, H);
    p.randomSeed(42);

    cellW  = W / COLS;
    cellH  = cellW;
    baseR  = cellW * 0.46;
    // Extra rows: visible + 2 buffer (one above, one below)
    ROWS   = Math.ceil(H / cellH) + 2;

    for (let r = 0; r < ROWS; r++) cells[r] = makeRow();
    enforceConstraints();
    buildBg();
    buildCache();

    p.frameRate(60);
  };

  p.draw = function() {
    p.image(bgGraphic, 0, 0);

    offsetY += SPEED;

    // When we've scrolled a full cell, the top buffer row has fully entered —
    // drop the bottom row, prepend a fresh one above, keep offsetY continuous.
    if (offsetY >= cellH) {
      offsetY -= cellH;
      cells.pop();
      cells.unshift(makeRow());
      enforceNewRow();  // only fix the new top row, never touch visible rows
    }

    // Row 0 lives at y = offsetY - cellH (one cell above the top edge when offsetY=0)
    // As offsetY grows from 0→cellH it slides from -cellH → 0, entering smoothly.
    for (let r = 0; r < ROWS; r++) {
      let cy = offsetY + (r - 1) * cellH;      // r=0 starts one row above canvas
      if (cy + cellH <= 0 || cy >= H) continue; // cull
      for (let c = 0; c < COLS; c++) {
        if (cells[r][c].skip) continue;
        let key = cacheKey(cells[r][c].colorIdx, cells[r][c].hatch);
        p.image(cache[key], c * cellW, cy);
      }
    }
  };

  p.windowResized = function() {
    W = Math.min(p.windowWidth, 540);
    H = Math.min(p.windowHeight, 960);
    p.resizeCanvas(W, H);
    cellW = W / COLS;
    cellH = cellW;
    baseR = cellW * 0.46;
    ROWS  = Math.ceil(H / cellH) + 2;
    while (cells.length < ROWS) cells.push(makeRow());
    cells.length = ROWS;
    buildBg();
    buildCache();
  };

});
