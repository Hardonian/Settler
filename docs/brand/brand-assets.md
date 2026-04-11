# Settler Brand Assets (Canonical)

## Source of truth

- **In-app wordmark:** `BrandWordmark` renders **“Settler”** / **“Settler.dev”** as text (no bitmap wordmark file).
- **Mark:** `packages/web/public/brand/settler/favicon-192x192.png` — circular mark on brand navy; this file is the **input** to `generate-brand-assets.mjs`.

The script generates: favicon sizes, maskable `app-icon.png`, `settler-lockup-horizontal-light.png` (+ `.webp`) for **SEO/structured data** (mark + vector text rasterized), `opengraph-image.png`, `twitter-image.png`, `icon.png`, `apple-icon.png`.

```bash
cd packages/web && pnpm run generate:brand-assets
```

## Active asset map

See **`docs/brand/asset-map.md`**.

## Component governance

- Prefer `BrandLogo`, `BrandLockup`, `BrandMark`, and `BrandWordmark` from `packages/web/src/components/brand/`.
- `SettlerLogo` remains a thin compatibility wrapper over those components.
- Metadata and manifest paths must stay aligned with `packages/web/src/lib/images/image-config.ts`.

## Legacy

Wrong files `Settler-logo.png` and `wordmark.png` (stock wordmark) must not return. `/favicon.ico` and `/favicon.svg` redirect to `/icon.png` via Next.js redirects.
