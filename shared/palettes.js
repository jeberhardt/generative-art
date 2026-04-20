const PALETTES = {
  'classic': [
    '#E63946', '#F4A261', '#E9C46A', '#2A9D8F',
    '#457B9D', '#6A4C93', '#C77DFF', '#F72585',
    '#06D6A0', '#118AB2', '#222222', '#FF6B6B',
    '#FFB703', '#3A86FF',
  ],
  'high-energy': [
    '#FF0000', '#FF4500', '#FFE600', '#39FF14',
    '#00FFFF', '#0066FF', '#BF00FF', '#FF0090',
    '#CCFF00', '#FF3366',
  ],
  'picasso-blue': [
    '#003366', '#1C4E80', '#2E86AB', '#4A7FB5',
    '#6B9DC2', '#8EB8D4', '#5B7FA6', '#2B5F8E',
    '#7BAFD4', '#A3C4DC',
  ],
};

function getPalette(name) {
  return PALETTES[name] || PALETTES['classic'];
}
