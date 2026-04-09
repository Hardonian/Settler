/**
 * Generate PWA Icons
 * Creates 192x192 and 512x512 PNG icons for the PWA
 */

const fs = require("fs");
const path = require("path");

// Simple SVG icon template (Settler logo placeholder)
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">S</text>
  <circle cx="256" cy="256" r="200" fill="none" stroke="white" stroke-width="8" opacity="0.3"/>
</svg>`;

// For now, we'll create a simple script that outputs instructions
// In production, you'd use a library like sharp or canvas to generate actual PNGs
console.log("Icon generation script");
console.log("Note: This script requires a proper image processing library.");
console.log("For now, please use an online tool or ImageMagick to generate icons.");
console.log("");
console.log("Recommended approach:");
console.log(
  "1. Use https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator"
);
console.log("2. Or install sharp: npm install sharp");
console.log("3. Or use ImageMagick: convert source.png -resize 192x192 icon-192x192.png");
console.log("");
console.log("Icons needed:");
console.log("- packages/web/public/icon-192x192.png (192x192 pixels)");
console.log("- packages/web/public/icon-512x512.png (512x512 pixels)");

// Create placeholder SVG for reference
const publicDir = path.join(__dirname, "../packages/web/public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "icon-source.svg"), iconSvg);

console.log("");
console.log("✅ Created icon-source.svg as a reference");
console.log("   You can convert this SVG to PNG using an online tool or ImageMagick");
