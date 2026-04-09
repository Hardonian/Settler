/**
 * Image Optimization Utilities
 * Provides optimized image loading and caching strategies
 */

export interface OptimizedImageOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  loading?: "lazy" | "eager";
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

/**
 * Generate optimized image URL with Next.js Image optimization
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): string {
  const { width = 1200, height, quality = 85 } = options;

  // If it's already a full URL, return as-is (Next.js will handle optimization)
  if (src.startsWith("http")) {
    return src;
  }

  // Use Next.js Image optimization
  const params = new URLSearchParams({
    url: src.startsWith("/") ? src : `/${src}`,
    w: width.toString(),
    ...(height && { h: height.toString() }),
    q: quality.toString(),
  });

  return `/api/image-optimize?${params.toString()}`;
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  src: string,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): string {
  return sizes.map((size) => `${getOptimizedImageUrl(src, { width: size })} ${size}w`).join(", ");
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints: Record<string, string>): string {
  return (
    Object.entries(breakpoints)
      .map(([breakpoint, size]) => `(max-width: ${breakpoint}px) ${size}`)
      .join(", ") + ", 100vw"
  );
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: "image" = "image"): void {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = src;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}
