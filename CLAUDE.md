# Generative Art — Claude Instructions

## Sketch structure

Each sketch lives in its own folder and consists of at minimum:

- `index.html` — markup, styles, and script tags only; no inline P5.js code
- `sketch.js` — all P5.js code

When initializing a new sketch, the folder will already exist and contain an `index.html` — this is the file downloaded from Claude on the user's phone. Use that file as the starting point; do not create a new one. Split its inline P5.js code out into `sketch.js`, load it from `index.html`, add a Control Panel (see below), and add the sketch to the list in the root `index.html`.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script src="sketch.js"></script>
```

## Control Panel

Every sketch gets a Control Panel. Use `abutment/` as the reference implementation.

### Structure

The Control Panel lives entirely in `index.html`. The sketch's `sketch.js` only calls `showLoading()` and `hideLoading()` — it does not create any UI elements.

**HTML elements required:**

```html
<!-- Toggle button — always visible, top-left -->
<button id="panel-toggle">☰</button>

<!-- Panel — starts hidden, slides in from the left -->
<div id="control-panel" class="hidden">
  <a href="../">← main menu</a>
  <!-- sketch-specific buttons go here -->
</div>

<!-- Loading overlay — shown during generation -->
<div id="loading-overlay">
  <div class="spinner"></div>
</div>

<!-- Original doodle popover (if the sketch has one) -->
<div id="popover-overlay">
  <img src="original.jpg" alt="Original doodle">
</div>
```

**Scripts — order matters:**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script src="../shared/download.js"></script>
<script>
  // Must be defined before sketch.js so generate() can call them
  const loadingOverlay = document.getElementById('loading-overlay');
  function showLoading() { loadingOverlay.classList.add('active'); }
  function hideLoading() { loadingOverlay.classList.remove('active'); }
</script>
<script src="sketch.js"></script>
<script>
  // Wire up panel toggle
  const panel = document.getElementById('control-panel');
  document.getElementById('panel-toggle').addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });

  // Wire up sketch-specific buttons (e.g. regen, save, original)
</script>
```

### CSS

Copy the full control panel CSS block from `abutment/index.html`. Key rules:

- `#panel-toggle` — solid `#111` background, `#f0f0f0` text, `z-index: 20`
- `#control-panel` — `width: 200px`, `height: 100vh`, `z-index: 10`, `background: rgba(15,15,15,0.93)`, slides via `transform: translateX(-100%)` when `.hidden`
- `#control-panel button, #control-panel a` — transparent background, `#f0f0f0` text, `1px solid #777` border; include `:hover` and `:focus-visible` states
- `#loading-overlay` — `z-index: 50`, `background: rgba(0,0,0,0.45)`; `.active` sets `display: flex`
- `.spinner` — 36px rotating border element, `animation: spin 0.75s linear infinite`

### Loading spinner in sketch.js

Generation must show the spinner before blocking the thread:

```js
function generate() {
  // ... reset state ...
  showLoading();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // synchronous work here
    p.redraw();
    hideLoading();
  }));
}
```

The double `requestAnimationFrame` ensures the browser paints the spinner before the synchronous generation blocks the thread.

### Shared utilities

- `shared/download.js` — exposes `downloadCanvas(filename)`, appends a millisecond timestamp to allow multiple saves: `downloadCanvas('sketch-name.png')` → `sketch-name-1743621847523.png`
