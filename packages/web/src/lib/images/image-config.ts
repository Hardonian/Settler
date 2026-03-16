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
 *
 * SVG variants are preferred for UI rendering (scalable, small file size).
 * PNG variants are canonical brand assets for favicon, app icons, OG images,
 * email templates, and external platforms that require raster images.
 */
const SETTLER_IMAGES_CONFIG = {
  // Favicons — SVG for modern browsers, PNG fallbacks for email/platform use
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
  // Canonical PNG favicon — for platforms that do not support SVG favicons
  faviconPng: {
    path: "/brand/settler/favicon.png",
    width: 512,
    height: 512,
    alt: "Settler App Icon",
    category: "favicon" as const,
    mimeType: "image/png",
  },
  // App icon — used for PWA install prompts and app store listings
  appIcon: {
    path: "/brand/settler/app-icon.png",
    width: 512,
    height: 512,
    alt: "Settler App Icon",
    category: "favicon" as const,
    mimeType: "image/png",
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

  // Logos — SVG preferred for UI; PNG available for external/raster contexts
  logoMain: {
    path: "/brand/settler/logo-horizontal.svg",
    width: 160,
    height: 40,
    alt: "Settler Logo",
    category: "logo" as const,
    mimeType: "image/svg+xml",
  },
  // Canonical PNG logos (for email templates, OG images, external platforms)
  logoHorizontalLight: {
    path: "/brand/settler/logo-horizontal-light.png",
    width: 1200,
    height: 314,
    alt: "Settler Logo — Horizontal Light",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoHorizontalDark: {
    path: "/brand/settler/logo-horizontal-dark.png",
    width: 1200,
    height: 314,
    alt: "Settler Logo — Horizontal Dark",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoStackedLight: {
    path: "/brand/settler/logo-stacked-light.png",
    width: 960,
    height: 540,
    alt: "Settler Logo — Stacked Light",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoSquareLight: {
    path: "/brand/settler/square-logo-light.png",
    width: 512,
    height: 512,
    alt: "Settler Square Logo",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoIconLight: {
    path: "/brand/settler/icon-light.png",
    width: 512,
    height: 512,
    alt: "Settler Icon Mark",
    category: "logo" as const,
    mimeType: "image/png",
  },
  logoWordmarkLight: {
    path: "/brand/settler/wordmark-light.png",
    width: 1200,
    height: 314,
    alt: "Settler Wordmark",
    category: "logo" as const,
    mimeType: "image/png",
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
