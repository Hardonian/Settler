# Settler.dev — canonical brand asset map

Source inputs under `packages/web/public/brand/settler/` are authoritative rasters. Derived icons, App Router metadata images, and the composed horizontal lockup are produced by:

```bash
cd packages/web && pnpm run generate:brand-assets
```

Do not commit placeholder or third-party stock lockups. The previous `Settler-logo.png` horizontal file (wrong wordmark) was removed; the horizontal lockup is now composed from the official wordmark + circular mark.

## Inventory

| File | Logo type | Usage | Theme | Raster / vector | References |
|------|-----------|-------|-------|-----------------|------------|
| `wordmark.png` | Wordmark only, light | `BrandWordmark`, script input for lockup | Light (use `dark:invert` in UI where needed) | Raster | `src/lib/brand/assets.ts`, `BrandWordmark.tsx`, `generate-brand-assets.mjs` |
| `favicon-192x192.png` | Icon / circular mark (navy disc) | Master for favicon pipeline, `BrandMark`, compact mark | Light | Raster | `brand-assets.ts`, `image-config` (icon keys), `manifest.json`, `generate-brand-assets.mjs` input |
| `settler-lockup-horizontal-light.png` | Horizontal lockup (mark + wordmark) | Nav, footer, SEO `logoMain`, structured data | Light (`dark:invert` on `BrandLockup`) | Raster | `brand-assets.ts`, `BrandLockup` horizontal, `image-config` logo keys |
| `settler-lockup-horizontal-light.webp` | Same as PNG | Next/Image preferred src for horizontal lockup | Same | Raster | `brand-assets.ts`, `image-config` `webpPath` |
| `favicon-512x512.png` | 1:1 icon @512 | Manifest, PWA | Light | Raster | `manifest.json`, `image-config` |
| `favicon.png` | 1:1 icon @512 (alias) | Legacy / `faviconPng` key | Light | Raster | `image-config` |
| `app-icon.png` | Maskable 512 | `purpose: maskable` in manifest | Light | Raster | `manifest.json` |
| `packages/web/src/app/icon.png` | Favicon route | Browser tab, `/favicon.ico` redirect | Light | Raster | `next.config.js` redirects, metadata |
| `packages/web/src/app/apple-icon.png` | Apple touch | iOS home screen, metadata `apple` | Light | Raster | `layout.tsx`, `image-config.appleTouchIcon` |
| `packages/web/src/app/opengraph-image.png` | OG default | Open Graph | Light canvas | Raster | `layout.tsx` openGraph, `getImageUrl('ogImage')` |
| `packages/web/src/app/twitter-image.png` | Twitter card | Twitter previews | Same as OG | Raster | `layout.tsx` twitter |

## Dark surfaces

There is no separate reversed (negative) logo file in-repo. Components apply `dark:invert` on raster marks/wordmarks/horizontal lockup for contrast on dark backgrounds. If a dedicated negative asset is added later, extend `SETTLER_BRAND` and switch dark-theme branches in brand components.

## Code entry points

- Dimensions and paths: `packages/web/src/lib/brand/assets.ts`
- Next/Image wrappers: `packages/web/src/components/brand/*`
- Metadata and absolute URLs: `packages/web/src/lib/images/image-config.ts`
