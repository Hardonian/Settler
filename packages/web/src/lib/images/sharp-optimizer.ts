/**
 * Image Optimization with Sharp
 * Provides actual image optimization functionality
 */

import sharp from "sharp";

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

/**
 * Optimize image buffer with Sharp
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizeOptions = {}
): Promise<Buffer> {
  const { width, height, quality = 85, format = "webp", fit = "cover" } = options;

  let pipeline = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      withoutEnlargement: true,
    });
  }

  // Convert format and optimize
  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality });
      break;
    case "png":
      pipeline = pipeline.png({ quality: Math.floor(quality / 10) }); // PNG quality is 0-9
      break;
  }

  return await pipeline.toBuffer();
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    size: buffer.length,
  };
}

/**
 * Generate responsive image sizes
 */
export async function generateResponsiveImages(
  buffer: Buffer,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): Promise<Array<{ width: number; buffer: Buffer }>> {
  const results = await Promise.all(
    sizes.map(async (width) => {
      const optimized = await optimizeImage(buffer, {
        width,
        format: "webp",
        quality: 85,
      });

      return {
        width,
        buffer: optimized,
      };
    })
  );

  return results;
}
