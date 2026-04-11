# Settler Brand Assets (Canonical)

## Source of truth

Authoritative rasters live in `packages/web/public/brand/settler/`:

- `wordmark.png` — wordmark-only (Settler)
- `favicon-192x192.png` — circular mark on brand navy (also feeds the generation pipeline)

The **horizontal lockup** is **generated** as `settler-lockup-horizontal-light.png` (+ `.webp`) by composing the wordmark and scaled mark — it is not hand-maintained as a separate upload.

Regenerate all derived rasters and App Router metadata images:

```bash
cd packages/web && pnpm run generate:brand-assets
```

This writes circular favicon sizes, maskable `app-icon.png`, `opengraph-image.png`, `twitter-image.png`, `icon.png`, `apple-icon.png`, and the horizontal lockup files.

## Active asset map

See **`docs/brand/asset-map.md`** for filenames, usage, and reference locations.

## Component governance

- Prefer `BrandLogo`, `BrandLockup`, `BrandMark`, and `BrandWordmark` from `packages/web/src/components/brand/`.
- `SettlerLogo` remains a thin compatibility wrapper over those components.
- Metadata and manifest paths must stay aligned with `packages/web/src/lib/images/image-config.ts`.

## Legacy

Root-level `public/logo.svg`, `public/favicon.svg`, and the removed wrong horizontal file `public/assets/images/Settler-logo.png` must not return. Requests to `/favicon.ico` and `/favicon.svg` redirect to `/icon.png` via Next.js redirects.
