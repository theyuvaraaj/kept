// Google Play feature graphic (1024x500). Run: node scripts/gen-feature-graphic.mjs
// Draft — refine text/fonts in Canva if you want; the K mark is on-brand.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const GREEN = '#8fae5e';
const INK = '#1f2116';
const CREAM = '#f4f1e7';

// K mark (1024-box, centered via translate(-60,-46)).
const MARK = `
  <g transform="translate(-60,-46)">
    <rect x="330" y="250" width="98" height="560" rx="49" fill="${INK}"/>
    <path d="M470 590 L775 815" fill="none" stroke="${INK}" stroke-width="106" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M424 470 L560 612 L792 298" fill="none" stroke="${CREAM}" stroke-width="106" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="${GREEN}"/>
  <g transform="translate(30,80) scale(0.34)">${MARK}</g>
  <text x="410" y="235" font-family="Bricolage Grotesque, Arial, sans-serif" font-weight="800" font-size="150" fill="${INK}">Kept</text>
  <text x="414" y="300" font-family="Arial, sans-serif" font-weight="600" font-size="40" fill="#2c3a1c">Show up at your spots.</text>
  <text x="414" y="352" font-family="Arial, sans-serif" font-weight="600" font-size="40" fill="#2c3a1c">Keep the streak.</text>
</svg>`;

await sharp(Buffer.from(svg)).resize(1024, 500).png().toFile(join(OUT, 'feature-graphic.png'));
console.log('wrote assets/feature-graphic.png (1024x500)');
