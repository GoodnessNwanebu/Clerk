const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICONS_DIR = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Create a square background
async function generateBaseIcon(size) {
  return await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 20, g: 184, b: 166, alpha: 1 } // #14b8a6 (teal-500)
    }
  })
  .png()
  .toBuffer();
}

// Generate icons for all sizes
async function generateIcons() {
  try {
    for (const size of SIZES) {
      const icon = await generateBaseIcon(size);
      const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      
      // Add a white circle in the middle
      await sharp(icon)
        .composite([{
          input: Buffer.from(`
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
              <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
              <circle cx="${size/2}" cy="${size/2}" r="${size/4}" fill="none" stroke="white" stroke-width="${size/16}"/>
              <circle cx="${size/2}" cy="${size/2}" r="${size/6}" fill="none" stroke="white" stroke-width="${size/16}"/>
            </svg>`
          ),
          top: 0,
          left: 0,
        }])
        .toFile(outputPath);
      
      console.log(`Generated ${outputPath}`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 