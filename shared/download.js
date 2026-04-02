// downloadCanvas(filename)
// Triggers a PNG download of the first <canvas> element on the page.
function downloadCanvas(filename) {
  const canvas = document.querySelector('canvas');
  const link = document.createElement('a');
  const base = (filename || 'doodle').replace(/\.png$/i, '');
  link.download = `${base}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
