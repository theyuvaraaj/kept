// Generates app icon / adaptive icon / splash from inline SVG.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const GREEN = '#8fae5e';
const INK = '#111111';
const CREAM = '#f4f1e7';

// Location pin (24x24 viewBox), stroked — matches the in-app logo.
const pin = (cx, cy, scale, stroke = INK, w = 2.2) => `
  <g transform="translate(${cx},${cy}) scale(${scale})" fill="none"
     stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="2.8"/>
  </g>`;

// Full-bleed icon: green field, centered pin.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${GREEN}"/>
  ${pin(272, 232, 20)}
</svg>`;

// Android adaptive foreground: transparent, pin inside the safe zone.
const adaptive = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${pin(320, 300, 16)}
</svg>`;

// Splash icon: rounded green tile + pin (like the login logo), transparent bg.
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="96" y="96" width="320" height="320" rx="76" fill="${GREEN}" stroke="${INK}" stroke-width="10"/>
  ${pin(196, 176, 6)}
</svg>`;

async function write(svg, name, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT, name));
  console.log('wrote', name);
}

await write(icon, 'icon.png', 1024);
await write(adaptive, 'adaptive-icon.png', 1024);
await write(splash, 'splash-icon.png', 512);
// simple web favicon
await write(icon, 'favicon.png', 48);
console.log('done');
