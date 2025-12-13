/**
 * Image utilities for optimized WebP handling
 * Provides type-safe image paths with WebP fallback support
 * 
 * Note: Next.js automatically optimizes images at build time.
 * WebP files are preferred but fallback formats work seamlessly.
 */

import type { BrandImageKey } from '@/types/images';

/**
 * Brand image paths with WebP optimization
 * Next.js will automatically serve WebP when available
 */
export const brandImages = {
  logo: {
    webp: '/brand/logo.webp',
    fallback: '/brand/logo.png',
    alt: 'Settler logo',
  },
  hero: {
    webp: '/brand/hero.webp',
    fallback: '/brand/hero.jpg',
    alt: 'Settler API infrastructure visualization showing reconciliation, receipts parsing, and feature flags',
  },
  architecture: {
    webp: '/brand/architecture.webp',
    fallback: '/brand/architecture.png',
    alt: 'Settler architecture diagram showing API gateway, services layer (Reconciliation, Receipts, Feature Flags), and distributed data store',
  },
  workflow: {
    webp: '/brand/workflow.webp',
    fallback: '/brand/workflow.jpg',
    alt: 'Settler workflow diagram showing the 4-step reconciliation process',
  },
  beforeAfter: {
    webp: '/brand/before-after.webp',
    fallback: '/brand/before-after.png',
    alt: 'Comparison of manual reconciliation vs automated Settler reconciliation',
  },
} as const;

/**
 * Get optimized image path (WebP preferred, fallback to original)
 * Next.js Image component will handle format conversion automatically
 * 
 * @param key - Brand image key (type-safe)
 * @param preferWebP - Whether to prefer WebP format (default: true)
 * @returns Image path string
 */
export function getBrandImage(
  key: BrandImageKey,
  preferWebP: boolean = true
): string {
  const image = brandImages[key];
  // In production, Next.js will serve WebP automatically if available
  // We return the WebP path if preferWebP is true, otherwise fallback
  return preferWebP && image.webp ? image.webp : image.fallback;
}

/**
 * Get image alt text
 * 
 * @param key - Brand image key (type-safe)
 * @returns Alt text string
 */
export function getBrandImageAlt(key: BrandImageKey): string {
  return brandImages[key].alt;
}

/**
 * Image dimensions for common brand images
 * Helps prevent layout shift (CLS)
 */
export const brandImageDimensions: Record<BrandImageKey, { width: number; height: number }> = {
  logo: { width: 512, height: 512 },
  hero: { width: 2816, height: 1536 },
  architecture: { width: 1408, height: 768 },
  workflow: { width: 1408, height: 768 },
  beforeAfter: { width: 1408, height: 768 },
} as const;

/**
 * Get image dimensions for a brand image
 * 
 * @param key - Brand image key (type-safe)
 * @returns Image dimensions object
 */
export function getBrandImageDimensions(
  key: BrandImageKey
): { width: number; height: number } {
  return brandImageDimensions[key];
}
