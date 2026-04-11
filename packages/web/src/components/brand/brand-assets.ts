/**
 * Intrinsic dimensions for canonical brand rasters under /public/brand/settler.
 * Regenerate with: `pnpm run generate:brand-assets` (from packages/web).
 */
import { SETTLER_BRAND } from "@/lib/brand/assets";

export const BRAND_MARK_PNG = {
  src: SETTLER_BRAND.markCircularLight.src,
  width: SETTLER_BRAND.markCircularLight.width,
  height: SETTLER_BRAND.markCircularLight.height,
} as const;
