/**
 * Create Placeholder Icons
 * Creates simple placeholder PNG icons using base64 encoded data
 */

const fs = require("fs");
const path = require("path");

// Simple 1x1 pixel PNG in base64 (transparent)
// We'll create a simple colored square as a placeholder
const createSimpleIcon = (size) => {
  // This is a minimal valid PNG (1x1 blue pixel)
  // In production, use a proper image library
  const pngHeader = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
  ]);

  // For now, we'll create a simple SVG and note that it needs conversion
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad${size})"/>
  <text x="${size / 2}" y="${size / 2 + size * 0.1}" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">S</text>
</svg>`;

  return svg;
};

const publicDir = path.join(__dirname, "../packages/web/public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create SVG placeholders
const icon192 = createSimpleIcon(192);
const icon512 = createSimpleIcon(512);

fs.writeFileSync(path.join(publicDir, "icon-192x192.svg"), icon192);
fs.writeFileSync(path.join(publicDir, "icon-512x512.svg"), icon512);

console.log("✅ Created SVG placeholder icons");
console.log("   - icon-192x192.svg");
console.log("   - icon-512x512.svg");
console.log("");
console.log("⚠️  Note: These are SVG files. For production, convert to PNG:");
console.log("   1. Use an online converter: https://cloudconvert.com/svg-to-png");
console.log("   2. Or use ImageMagick: convert icon-192x192.svg icon-192x192.png");
console.log("   3. Or use sharp in Node.js");
console.log("");
console.log("For now, the manifest.json references PNG files.");
console.log("Update manifest.json to use SVG or convert SVGs to PNGs.");
