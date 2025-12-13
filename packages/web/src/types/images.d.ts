/**
 * Type definitions for brand images
 * Ensures type safety when referencing image keys
 */

export type BrandImageKey = 'logo' | 'hero' | 'architecture' | 'workflow' | 'beforeAfter';

export interface BrandImageConfig {
  webp: string;
  fallback: string;
  alt: string;
}

export interface BrandImageDimensions {
  width: number;
  height: number;
}
