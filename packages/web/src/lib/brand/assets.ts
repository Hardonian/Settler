import { BRAND_STRINGS } from "./strings";

/**
 * Canonical Settler.dev brand rasters — single import surface for dimensions + paths.
 * Regenerate derived files: `pnpm run generate:brand-assets` (from packages/web).
 *
 * Full inventory: docs/brand/asset-map.md
 */
export const SETTLER_BRAND = {
  /** Horizontal lockup (mark + wordmark), light surfaces — nav, footer, marketing */
  lockupHorizontalLight: {
    src: "/brand/settler/settler-lockup-horizontal-light.png",
    webpSrc: "/brand/settler/settler-lockup-horizontal-light.webp",
    width: 1099,
    height: 339,
    alt: BRAND_STRINGS.productSiteName,
  },
  /** Wordmark only — narrow placements, stacked lockup text row */
  wordmarkLight: {
    src: "/brand/settler/wordmark.png",
    width: 903,
    height: 339,
    alt: BRAND_STRINGS.productSiteName,
  },
  /** Circular mark on brand navy — compact nav, stacked mark, favicon pipeline source */
  markCircularLight: {
    src: "/brand/settler/favicon-192x192.png",
    width: 192,
    height: 192,
    alt: "",
  },
  /** 1:1 square — same circular mark at 512 (maskable / launcher) */
  squareStackedLight: {
    src: "/brand/settler/favicon-512x512.png",
    width: 512,
    height: 512,
    alt: BRAND_STRINGS.productSiteName,
  },
} as const;
