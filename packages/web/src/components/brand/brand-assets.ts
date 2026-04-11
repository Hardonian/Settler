/**
 * Intrinsic dimensions for canonical brand rasters under /public/brand/settler.
 * Regenerate with: `pnpm run generate:brand-assets` (from packages/web).
 */
import { SETTLER_BRAND } from "@/lib/brand/assets";

export const BRAND_LOCKUP_PNG = {
  src: SETTLER_BRAND.lockupHorizontalLight.src,
  width: SETTLER_BRAND.lockupHorizontalLight.width,
  height: SETTLER_BRAND.lockupHorizontalLight.height,
  webpSrc: SETTLER_BRAND.lockupHorizontalLight.webpSrc,
} as const;

export const BRAND_WORDMARK_PNG = {
  src: SETTLER_BRAND.wordmarkLight.src,
  width: SETTLER_BRAND.wordmarkLight.width,
  height: SETTLER_BRAND.wordmarkLight.height,
} as const;

export const BRAND_MARK_PNG = {
  src: SETTLER_BRAND.markCircularLight.src,
  width: SETTLER_BRAND.markCircularLight.width,
  height: SETTLER_BRAND.markCircularLight.height,
} as const;
