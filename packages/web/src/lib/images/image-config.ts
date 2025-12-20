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
const SETTLER_IMAGES_CONFIG = {
  // Favicons
  favicon: {
    path: '/assets/images/favicons/favicon.svg',
    width: 64,
    height: 64,
    alt: 'Settler Favicon',
    category: 'favicon' as const,
    mimeType: 'image/svg+xml',
  },
  favicon192: {
    path: '/assets/images/favicons/favicon.svg',
    width: 192,
    height: 192,
    alt: 'Settler Icon 192x192',
    category: 'favicon' as const,
    mimeType: 'image/svg+xml',
  },
  favicon512: {
    path: '/assets/images/favicons/favicon.svg',
    width: 512,
    height: 512,
    alt: 'Settler Icon 512x512',
    category: 'favicon' as const,
    mimeType: 'image/svg+xml',
  },

  // Social Media Images
  ogImage: {
    path: '/assets/images/social/og-image.svg',
    width: 1200,
    height: 630,
    alt: 'Settler - Financial Infrastructure for Developers',
    category: 'social' as const,
    mimeType: 'image/svg+xml',
  },
  twitterCard: {
    path: '/assets/images/social/og-image.svg',
    width: 1200,
    height: 630,
    alt: 'Settler - Financial Infrastructure for Developers',
    category: 'social' as const,
    mimeType: 'image/svg+xml',
  },

  // Logos
  logoMain: {
    path: '/assets/images/logos/settler-logo.svg',
    width: 200,
    height: 50,
    alt: 'Settler Logo',
    category: 'logo' as const,
    mimeType: 'image/svg+xml',
  },

  // Thumbnails
  thumbnail: {
    path: '/assets/images/social/og-image.svg',
    width: 1200,
    height: 630,
    alt: 'Settler Thumbnail',
    category: 'thumbnail' as const,
    mimeType: 'image/svg+xml',
  },
} as const;

export const SETTLER_IMAGES: Record<keyof typeof SETTLER_IMAGES_CONFIG, ImageConfig> = SETTLER_IMAGES_CONFIG;

/**
 * Get image configuration by key
 */
export function getImageConfig(key: keyof typeof SETTLER_IMAGES): ImageConfig {
  const config = SETTLER_IMAGES[key];
  if (!config) {
    throw new Error(`Image config not found for key: ${String(key)}`);
  }
  return config;
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
  return Object.values(SETTLER_IMAGES).filter((img): img is ImageConfig => img !== undefined && img.category === category);
}

/**
 * Type-safe image keys
 */
export type SettlerImageKey = keyof typeof SETTLER_IMAGES;
