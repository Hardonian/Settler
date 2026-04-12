/**
 * Canonical Settler brand strings.
 * Keep product naming centralized to prevent copy drift.
 */
export const BRAND_STRINGS = {
  productName: "Settler",
  productSiteName: "Settler.dev",
} as const;

export type BrandStringKey = keyof typeof BRAND_STRINGS;
