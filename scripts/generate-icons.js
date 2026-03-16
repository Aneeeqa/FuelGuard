// Script to generate PWA icons from logo.png
import sharp from 'sharp';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const logoPath = resolve(publicDir, 'logo.png');

if (!existsSync(logoPath)) {
  console.error('ERROR: public/logo.png not found');
  process.exit(1);
}

const sizes = [192, 512];

for (const size of sizes) {
  const outPath = resolve(publicDir, `icon-${size}.png`);
  await sharp(logoPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 59, g: 130, b: 246, alpha: 1 }, // #3b82f6
    })
    .png()
    .toFile(outPath);
  console.log(`Generated icon-${size}.png`);
}

console.log('All icons generated successfully.');
