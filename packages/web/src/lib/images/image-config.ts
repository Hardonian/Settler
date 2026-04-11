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
  webpPath?: string;
}

/**
 * Settler brand images configuration
 *
 * Canonical rasters live under /public/brand/settler/; regenerate with
 * `pnpm run generate:brand-assets` (packages/web). See docs/brand/asset-map.md.
 */
const SETTLER_IMAGES_CONFIG = {
  favicon: {
    path: "/brand/settler/favicon-192x192.png",
    width: 192,
    height: 192,
    alt: "Settler.dev",
    category: "favicon" as const,
    mimeType: "image/png",
  },
  favicon192: {
    path: "/brand/settler/favicon-192x192.png",
    width: 192,
    height: 192,
    alt: "Settler.dev icon 192",
    category: "favicon" as const,
    mimeType: "image/png",
  },
  favicon512: {
    path: "/brand/settler/favicon-512x512.png",
    width: 512,
    height: 512,
    alt: "Settler.dev icon 512",
    category: "favicon" as const,
    mimeType: "image/png",
  },
  faviconPng: {
    path: "/brand/settler/favicon.png",
    width: 512,
    height: 512,
    alt: "Settler.dev",
    category: "favicon" as const,
    mimeType: "image/png",
  },
  appIcon: {
    path: "/brand/settler/app-icon.png",
    width: 512,
    height: 512,
    alt: "Settler.dev",
    category: "favicon" as const,
    mimeType: "image/png",
  },
  appleTouchIcon: {
    path: "/apple-icon.png",
    width: 180,
    height: 180,
    alt: "Settler.dev",
    category: "favicon" as const,
    mimeType: "image/png",
  },

  // Social Media Images (static files in app/)
  ogImage: {
    path: "/opengraph-image.png",
    width: 1200,
    height: 630,
    alt: "Settler.dev — Deterministic Reconciliation",
    category: "social" as const,
    mimeType: "image/png",
  },
  twitterCard: {
    path: "/twitter-image.png",
    width: 1200,
    height: 630,
    alt: "Settler.dev — Deterministic Reconciliation",
    category: "social" as const,
    mimeType: "image/png",
  },

  logoMain: {
    path: "/brand/settler/settler-lockup-horizontal-light.png",
    width: 1282,
    height: 339,
    alt: "Settler.dev",
    category: "logo" as const,
    mimeType: "image/png",
    webpPath: "/brand/settler/settler-lockup-horizontal-light.webp",
  },
  logoHorizontalLight: {
    path: "/brand/settler/settler-lockup-horizontal-light.png",
    width: 1282,
    height: 339,
    alt: "Settler.dev",
    category: "logo" as const,
    mimeType: "image/png",
    webpPath: "/brand/settler/settler-lockup-horizontal-light.webp",
  },
  logoHorizontalDark: {
    path: "/brand/settler/settler-lockup-horizontal-light.png",
    width: 1282,
    height: 339,
    alt: "Settler.dev",
    category: "logo" as const,
    mimeType: "image/png",
    webpPath: "/brand/settler/settler-lockup-horizontal-light.webp",
  },
  logoStackedLight: {
    path: "/brand/settler/settler-lockup-horizontal-light.png",
    width: 1282,
    height: 339,
    alt: "Settler.dev",
    category: "logo" as const,
    mimeType: "image/png",
    webpPath: "/brand/settler/settler-lockup-horizontal-light.webp",
  },
  logoSquareLight: {
    path: "/brand/settler/favicon-192x192.png",
    width: 192,
    height: 192,
    alt: "Settler.dev mark",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoIconLight: {
    path: "/brand/settler/favicon-192x192.png",
    width: 192,
    height: 192,
    alt: "Settler.dev mark",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoWordmarkLight: {
    path: "/brand/settler/wordmark.png",
    width: 903,
    height: 339,
    alt: "Settler.dev",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoSEO: {
    path: "/opengraph-image.png",
    width: 1200,
    height: 630,
    alt: "Settler.dev",
    category: "logo" as const,
    mimeType: "image/png",
  },

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
