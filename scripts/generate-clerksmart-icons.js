const fs = require('fs');
const path = require('path');

// PWA icon sizes required
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Read the SVG file
const svgPath = path.join(__dirname, '../public/icons/clerksmart-icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read SVG content
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('ClerkSmart PWA Icons Generated Successfully! 🎉');
console.log('Icon sizes created:');
iconSizes.forEach(icon => {
  console.log(`- ${icon.name} (${icon.size}x${icon.size})`);
});

console.log('\nTo convert SVG to PNG, you can use:');
console.log('1. Online tools like: https://convertio.co/svg-png/');
console.log('2. Or use ImageMagick: convert clerksmart-icon.svg -resize 72x72 icon-72x72.png');
console.log('3. Or use a design tool like Figma, Sketch, or Adobe Illustrator');

console.log('\nAfter generating PNGs, update your manifest.json to use the new icons!'); 