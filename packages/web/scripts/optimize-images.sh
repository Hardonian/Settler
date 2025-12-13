#!/bin/bash
# Image optimization script for Vercel builds
# Converts images to WebP format for better performance

set -e

echo "🖼️  Optimizing brand images..."

cd "$(dirname "$0")/.."
BRAND_DIR="public/brand"

# Check if sharp is available (Next.js dependency)
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js not found. Skipping image optimization."
  exit 0
fi

# Try to run the conversion script
if [ -f "scripts/convert-images-to-webp.mjs" ]; then
  node scripts/convert-images-to-webp.mjs || {
    echo "⚠️  Image conversion failed. Next.js will optimize images at build time."
    exit 0
  }
else
  echo "⚠️  Conversion script not found. Next.js will optimize images at build time."
fi

echo "✅ Image optimization complete"
