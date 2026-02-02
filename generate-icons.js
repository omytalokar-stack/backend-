import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert SVG to PNG with different sizes
async function generateIcons() {
  try {
    const svgPath = path.join(__dirname, 'public', 'icons', 'logo-base.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 192x192 PNG
    await sharp(svgBuffer)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(path.join(__dirname, 'public', 'icons', 'icon-192.png'));

    console.log('✓ Generated icon-192.png');

    // Generate 512x512 PNG
    await sharp(svgBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(path.join(__dirname, 'public', 'icons', 'icon-512.png'));

    console.log('✓ Generated icon-512.png');

    // Also keep SVG versions for better quality
    fs.copyFileSync(
      path.join(__dirname, 'public', 'icons', 'logo-base.svg'),
      path.join(__dirname, 'public', 'icons', 'icon-192.svg')
    );
    fs.copyFileSync(
      path.join(__dirname, 'public', 'icons', 'logo-base.svg'),
      path.join(__dirname, 'public', 'icons', 'icon-512.svg')
    );

    console.log('✓ Generated icon-192.svg');
    console.log('✓ Generated icon-512.svg');
    console.log('\n✓ All icons generated successfully!');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
