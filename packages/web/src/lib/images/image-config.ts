/**
 * Type-safe image configuration for Settler
 *
 * Centralizes all image paths and metadata for:
 * - Favicons
 * - Social media (OG, Twitter)
 * - Logos
 * - Thumbnails
 */

export type ImageCategory = "favicon" | "social" | "logo" | "thumbnail";

export interface ImageConfig {
  path: string;
  width: number;
  height: number;
  alt: string;
  category: ImageCategory;
  mimeType: string;
  webpPath?: string; // Optional WebP version for better performance
}

/**
 * Settler brand images configuration
 * All active brand images are located in /public/brand/settler/
 */
const SETTLER_IMAGES_CONFIG = {
  // Favicons
  favicon: {
    path: "/brand/settler/favicon-192x192.svg",
    width: 192,
    height: 192,
    alt: "Settler Favicon",
    category: "favicon" as const,
    mimeType: "image/svg+xml",
  },
  favicon192: {
    path: "/brand/settler/favicon-192x192.svg",
    width: 192,
    height: 192,
    alt: "Settler Icon 192x192",
    category: "favicon" as const,
    mimeType: "image/svg+xml",
  },
  favicon512: {
    path: "/brand/settler/favicon-512x512.svg",
    width: 512,
    height: 512,
    alt: "Settler Icon 512x512",
    category: "favicon" as const,
    mimeType: "image/svg+xml",
  },

  // Social Media Images
  ogImage: {
    path: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "Settler - Financial Infrastructure for Developers",
    category: "social" as const,
    mimeType: "image/png",
  },
  twitterCard: {
    path: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "Settler - Financial Infrastructure for Developers",
    category: "social" as const,
    mimeType: "image/png",
  },

  // Logos
  logoMain: {
    path: "/brand/settler/logo-horizontal.svg",
    width: 160,
    height: 40,
    alt: "Settler Logo",
    category: "logo" as const,
    mimeType: "image/svg+xml",
  },
  logoSEO: {
    path: "/opengraph-image",
    width: 1073,
    height: 357,
    alt: "Settler SEO Logo",
    category: "logo" as const,
    mimeType: "image/png",
  },

  // Thumbnails
  thumbnail: {
    path: "/assets/images/thumbnails/settler-thumbnail.jpg",
    width: 1200,
    height: 630,
    alt: "Settler Thumbnail",
    category: "thumbnail" as const,
    mimeType: "image/jpeg",
  },
} as const;

export const SETTLER_IMAGES: Record<keyof typeof SETTLER_IMAGES_CONFIG, ImageConfig> =
  SETTLER_IMAGES_CONFIG;

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
export function getImageUrl(
  key: keyof typeof SETTLER_IMAGES,
  baseUrl?: string,
  preferWebP: boolean = false
): string {
  const config = getImageConfig(key);
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev";
  // Use WebP if available and preferred (for better performance)
  const imagePath = preferWebP && config.webpPath ? config.webpPath : config.path;
  return `${base}${imagePath}`;
}

/**
 * Get images by category
 */
export function getImagesByCategory(category: ImageCategory): ImageConfig[] {
  return Object.values(SETTLER_IMAGES).filter(
    (img): img is ImageConfig => img !== undefined && img.category === category
  );
}

/**
 * Type-safe image keys
 */
export type SettlerImageKey = keyof typeof SETTLER_IMAGES;
