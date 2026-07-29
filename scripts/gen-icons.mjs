// Generates app icon / adaptive icon / splash from inline SVG.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const GREEN = '#8fae5e';
const INK = '#1f2116';
const CREAM = '#f4f1e7';

// "K" mark (1024 box, visually centered): black stem, cream check upper arm,
// black lower leg. Bold rounded strokes — matches the brand logo.
const MARK = `
  <g transform="translate(-60,-46)">
    <rect x="330" y="250" width="98" height="560" rx="49" fill="${INK}"/>
    <path d="M470 590 L775 815" fill="none" stroke="${INK}" stroke-width="106" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M424 470 L560 612 L792 298" fill="none" stroke="${CREAM}" stroke-width="106" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

// full-bleed icon: green field + centered mark
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${GREEN}"/>
  ${MARK}
</svg>`;

// android adaptive foreground: transparent, mark inside the safe zone
const adaptive = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(512,512) scale(0.72) translate(-512,-512)">${MARK}</g>
</svg>`;

// splash: rounded green tile + mark (like the login logo), transparent bg.
// Authored at 1024 so it stays crisp when scaled up on high-DPI screens.
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect x="112" y="112" width="800" height="800" rx="188" fill="${GREEN}" stroke="${INK}" stroke-width="20"/>
  <g transform="translate(512,512) scale(0.84) translate(-512,-512)">${MARK}</g>
</svg>`;

async function write(svg, name, size) {
  // High render density so the rasteriser supersamples the vector → no blur.
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(OUT, name));
  console.log('wrote', name, size);
}

await write(icon, 'icon.png', 1024);
await write(adaptive, 'adaptive-icon.png', 1024);
await write(splash, 'splash-icon.png', 1024);
await write(icon, 'favicon.png', 48);
console.log('done');
