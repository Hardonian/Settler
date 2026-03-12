import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const imagesDir = path.join(__dirname, "../packages/web/public/assets/images");
const imagesToConvert = [
  { input: "Settler-logo.png", output: "Settler-logo.webp" },
  { input: "Settler_seo.png", output: "Settler_seo.webp" },
  { input: "settler-favicon.png", output: "settler-favicon.webp" },
];

async function convertToWebP() {
  console.log("Converting PNG images to WebP...\n");

  for (const { input, output } of imagesToConvert) {
    const inputPath = path.join(imagesDir, input);
    const outputPath = path.join(imagesDir, output);

    try {
      // Check if input file exists
      await fs.access(inputPath);

      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      console.log(`Converting ${input} (${metadata.width}x${metadata.height})...`);

      // Convert to WebP with high quality
      await sharp(inputPath).webp({ quality: 90, effort: 6 }).toFile(outputPath);

      // Get output file size
      const stats = await fs.stat(outputPath);
      const inputStats = await fs.stat(inputPath);
      const savings = ((1 - stats.size / inputStats.size) * 100).toFixed(1);

      console.log(
        `  ✓ Created ${output} (${(stats.size / 1024).toFixed(1)}KB, ${savings}% smaller)\n`
      );
    } catch (error) {
      console.error(
        `  ✗ Error converting ${input}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("Conversion complete!");
}

convertToWebP().catch(console.error);
