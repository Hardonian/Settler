import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const publicRoot = path.join(__dirname, "../packages/web/public");
const imagesToConvert = [
  {
    input: "brand/settler/settler-lockup-horizontal-light.png",
    output: "brand/settler/settler-lockup-horizontal-light.webp",
  },
  {
    input: "assets/images/Settler_seo.png",
    output: "assets/images/Settler_seo.webp",
  },
  {
    input: "assets/images/settler-favicon.png",
    output: "assets/images/settler-favicon.webp",
  },
];

async function convertToWebP() {
  console.log("Converting PNG images to WebP...\n");

  for (const { input, output } of imagesToConvert) {
    const inputPath = path.join(publicRoot, input);
    const outputPath = path.join(publicRoot, output);

    try {
      await fs.access(inputPath);

      const metadata = await sharp(inputPath).metadata();
      console.log(`Converting ${input} (${metadata.width}x${metadata.height})...`);

      await sharp(inputPath).webp({ quality: 90, effort: 6 }).toFile(outputPath);

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
