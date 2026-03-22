/**
 * Intrinsic dimensions for canonical brand raster assets under /public.
 * Regenerate binaries with: `node ./scripts/generate-brand-assets.mjs`
 */
export const BRAND_LOCKUP_PNG = {
  src: "/assets/images/Settler-logo.png",
  width: 1303,
  height: 339,
} as const;

export const BRAND_WORDMARK_PNG = {
  src: "/brand/settler/wordmark.png",
  width: 903,
  height: 339,
} as const;

export const BRAND_MARK_PNG = {
  src: "/brand/settler/favicon-192x192.png",
  width: 192,
  height: 192,
} as const;
