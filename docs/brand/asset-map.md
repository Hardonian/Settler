# Settler.dev — canonical brand asset map

The **circular mark** (`favicon-192x192.png`) is the master raster input. The generation script rescales it for PWA icons and builds **SEO/OG lockup PNGs** with **vector “Settler.dev” text** (no bitmap wordmark — avoids stock/third-party wordmark drift).

```bash
cd packages/web && pnpm run generate:brand-assets
```

## Inventory

| File | Logo type | Usage | Theme | Raster / vector | References |
|------|-----------|-------|-------|-----------------|------------|
| *(in-app)* `BrandWordmark` | Text wordmark “Settler” / “Settler.dev” | Nav, footer, auth stacked lockup | Follows `text-foreground` | Vector (DOM) | `BrandWordmark.tsx`, `BrandLockup.tsx` |
| `favicon-192x192.png` | Icon / circular mark (navy disc) | Master input; `BrandMark`; favicon pipeline | Light | Raster | `brand-assets.ts`, `image-config`, `manifest.json`, `generate-brand-assets.mjs` |
| `settler-lockup-horizontal-light.png` | Horizontal lockup (mark + “Settler.dev” text rendered to PNG) | SEO `logoMain`, structured data, absolute logo URLs | Light canvas | Raster (generated) | `SETTLER_BRAND.lockupHorizontalLight`, `image-config` logo keys |
| `settler-lockup-horizontal-light.webp` | WebP variant of lockup | Same | Same | Raster | `webpPath` in `image-config` / `SETTLER_BRAND` |
| `favicon-512x512.png` | 1:1 icon @512 | Manifest, PWA | Light | Raster | `manifest.json`, `image-config` |
| `favicon.png` | 1:1 icon @512 (alias) | `faviconPng` key | Light | Raster | `image-config` |
| `app-icon.png` | Maskable 512 | `purpose: maskable` in manifest | Light | Raster | `manifest.json` |
| `packages/web/src/app/icon.png` | Favicon route | Browser tab, `/favicon.ico` redirect | Light | Raster | `next.config.js` redirects, metadata |
| `packages/web/src/app/apple-icon.png` | Apple touch | iOS home screen, metadata `apple` | Light | Raster | `layout.tsx`, `image-config.appleTouchIcon` |
| `packages/web/src/app/opengraph-image.png` | OG default | Open Graph | Light canvas | Raster | `layout.tsx` openGraph, `getImageUrl('ogImage')` |
| `packages/web/src/app/twitter-image.png` | Twitter card | Twitter previews | Same as OG | Raster | `layout.tsx` twitter |

## Removed / do not reintroduce

- `wordmark.png` (third-party / wrong text) — **removed**; use text `BrandWordmark` or generated lockup only.
- `public/assets/images/Settler-logo.png` — **removed** (wrong horizontal lockup).

## Dark surfaces

In-app: `BrandWordmark` uses theme text color. `BrandMark` may use `dark:invert` for the raster mark on dark backgrounds. SEO/OG rasters are light-background; social crawlers do not use dark mode.

## Code entry points

- Dimensions and paths: `packages/web/src/lib/brand/assets.ts`
- Components: `packages/web/src/components/brand/*`
- Metadata and absolute URLs: `packages/web/src/lib/images/image-config.ts`
