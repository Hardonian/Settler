/**
 * Type-safe image configuration for Settler
 * 
 * Centralizes all image paths and metadata for:
 * - Favicons
 * - Social media (OG, Twitter)
 * - Logos
 * - Thumbnails
 */

export type ImageCategory = 'favicon' | 'social' | 'logo' | 'thumbnail';

export interface ImageConfig {
  path: string;
  width: number;
  height: number;
  alt: string;
  category: ImageCategory;
  mimeType: string;
}

/**
 * Settler brand images configuration
 * All images are located in /public/assets/images/
 */
export const SETTLER_IMAGES: Record<string, ImageConfig> = {
  // Favicons
  favicon: {
    path: '/assets/images/favicons/settler-favicon-512.jpg',
    width: 512,
    height: 279,
    alt: 'Settler Favicon',
    category: 'favicon',
    mimeType: 'image/jpeg',
  },
  favicon192: {
    path: '/icon-192x192.svg',
    width: 192,
    height: 192,
    alt: 'Settler Icon 192x192',
    category: 'favicon',
    mimeType: 'image/svg+xml',
  },
  favicon512: {
    path: '/icon-512x512.svg',
    width: 512,
    height: 512,
    alt: 'Settler Icon 512x512',
    category: 'favicon',
    mimeType: 'image/svg+xml',
  },

  // Social Media Images
  ogImage: {
    path: '/assets/images/social/settler-og-image.jpg',
    width: 2816,
    height: 1536,
    alt: 'Settler - Financial Infrastructure for Developers',
    category: 'social',
    mimeType: 'image/jpeg',
  },
  twitterCard: {
    path: '/assets/images/social/settler-twitter-card.png',
    width: 1408,
    height: 768,
    alt: 'Settler - Financial Infrastructure for Developers',
    category: 'social',
    mimeType: 'image/png',
  },

  // Logos
  logoMain: {
    path: '/assets/images/logos/settler-logo-main.jpg',
    width: 1408,
    height: 768,
    alt: 'Settler Logo',
    category: 'logo',
    mimeType: 'image/jpeg',
  },

  // Thumbnails
  thumbnail: {
    path: '/assets/images/thumbnails/settler-thumbnail.jpg',
    width: 1408,
    height: 768,
    alt: 'Settler Thumbnail',
    category: 'thumbnail',
    mimeType: 'image/jpeg',
  },
} as const;

/**
 * Get image configuration by key
 */
export function getImageConfig(key: keyof typeof SETTLER_IMAGES): ImageConfig {
  return SETTLER_IMAGES[key];
}

/**
 * Get full URL for an image
 */
export function getImageUrl(key: keyof typeof SETTLER_IMAGES, baseUrl?: string): string {
  const config = getImageConfig(key);
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev';
  return `${base}${config.path}`;
}

/**
 * Get images by category
 */
export function getImagesByCategory(category: ImageCategory): ImageConfig[] {
  return Object.values(SETTLER_IMAGES).filter(img => img.category === category);
}

/**
 * Type-safe image keys
 */
export type SettlerImageKey = keyof typeof SETTLER_IMAGES;
