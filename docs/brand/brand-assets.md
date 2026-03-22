# Settler Brand Assets (Canonical)

## Source of truth

The horizontal lockup PNG is the master asset:

- `packages/web/public/assets/images/Settler-logo.png`

Regenerate all derived rasters from it:

```bash
cd packages/web && pnpm run generate:brand-assets
```

This writes circular mark PNGs, wordmark crop, `opengraph-image.png`, `twitter-image.png`, `icon.png`, and `apple-icon.png`.

## Active asset map

- **Horizontal lockup (nav, footer, marketing):** `/assets/images/Settler-logo.png` (optional WebP: `Settler-logo.webp`)
- **Wordmark-only (derived):** `/brand/settler/wordmark.png`
- **Mark / favicon / PWA icons (derived, circular navy backdrop):** `/brand/settler/favicon-192x192.png`, `favicon-512x512.png`, `favicon.png`, `app-icon.png`
- **App Router metadata files:** `/icon.png`, `/apple-icon.png`, `/opengraph-image.png`, `/twitter-image.png` (served from `src/app/`)
- **Social preview default:** `/opengraph-image.png` and `/twitter-image.png`

## Component governance

- Prefer `BrandLogo`, `BrandLockup`, `BrandMark`, and `BrandWordmark` from `packages/web/src/components/brand/`.
- `SettlerLogo` remains as a thin compatibility wrapper over those components.
- Metadata and manifest paths must stay aligned with `packages/web/src/lib/images/image-config.ts`.

## Legacy

Root-level `public/logo.svg`, `public/favicon.svg`, and old indigo checkmark SVGs under `public/brand/settler/` were removed. Requests to `/favicon.ico` and `/favicon.svg` redirect to `/icon.png` via Next.js redirects.
