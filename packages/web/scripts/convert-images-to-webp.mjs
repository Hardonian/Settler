#!/usr/bin/env node
/**
 * Convert brand images to WebP format for better performance
 * Uses sharp (Next.js's image optimization library)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to use sharp if available, otherwise provide instructions
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('⚠️  sharp not installed. Installing...');
  console.error('   Run: cd packages/web && pnpm add -D sharp');
  console.error('   Or: Next.js will optimize images automatically at build time');
  process.exit(1);
}

const brandDir = join(__dirname, '../public/brand');
const images = [
  { input: 'logo.png', output: 'logo.webp', quality: 90 },
  { input: 'hero.jpg', output: 'hero.webp', quality: 85 },
  { input: 'architecture.png', output: 'architecture.webp', quality: 90 },
  { input: 'workflow.jpg', output: 'workflow.webp', quality: 85 },
  { input: 'before-after.png', output: 'before-after.webp', quality: 90 },
];

async function convertImage(inputPath, outputPath, quality) {
  try {
    const inputFullPath = join(brandDir, inputPath);
    const outputFullPath = join(brandDir, outputPath);

    if (!existsSync(inputFullPath)) {
      console.warn(`⚠️  Skipping ${inputPath} - file not found`);
      return false;
    }

    if (existsSync(outputFullPath)) {
      console.log(`✓ ${outputPath} already exists, skipping`);
      return true;
    }

    console.log(`Converting ${inputPath} → ${outputPath}...`);
    
    await sharp(inputFullPath)
      .webp({ quality, effort: 6 })
      .toFile(outputFullPath);

    const inputStats = readFileSync(inputFullPath);
    const outputStats = readFileSync(outputFullPath);
    const savings = ((1 - outputStats.length / inputStats.length) * 100).toFixed(1);
    
    console.log(`  ✓ Saved ${savings}% (${(inputStats.length / 1024 / 1024).toFixed(2)}MB → ${(outputStats.length / 1024 / 1024).toFixed(2)}MB)`);
    return true;
  } catch (error) {
    console.error(`  ✗ Error converting ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🖼️  Converting brand images to WebP...\n');
  
  let successCount = 0;
  for (const image of images) {
    const success = await convertImage(image.input, image.output, image.quality);
    if (success) successCount++;
  }

  console.log(`\n✅ Converted ${successCount}/${images.length} images`);
  console.log('\n💡 Next.js will automatically serve WebP when available.');
  console.log('   Update image src paths to use .webp extensions for immediate benefits.');
}

main().catch(console.error);
