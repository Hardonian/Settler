# Settler Brand Assets (Canonical)

## Canonical active path

All active product branding assets must be sourced from:

- `packages/web/public/brand/settler/`

## Active asset map

- Header/footer logo (light): `/brand/settler/logo-horizontal.svg`
- Header/footer logo (dark): `/brand/settler/logo-horizontal-dark.svg`
- Icon/logo mark: `/brand/settler/logo-icon.svg`
- PWA icon 192: `/brand/settler/favicon-192x192.svg`
- PWA icon 512: `/brand/settler/favicon-512x512.svg`
- OpenGraph default image: `/opengraph-image`
- Twitter card default image: `/opengraph-image`

## Component governance

- Use `packages/web/src/components/brand/SettlerLogo.tsx` for rendered product logos.
- Do not directly reference `/logo.svg` or `/logo-dark.svg` in UI components.
- Metadata/icon tags must resolve through `packages/web/src/lib/images/image-config.ts`.

## Legacy asset status

Legacy logo and favicon files in root `public/` and `public/assets/images/` are superseded for active runtime usage.
They are retained only for historical/reference compatibility and must not be used for new UI or metadata wiring.

## Future updates

When updating branding:

1. Replace files in `public/brand/settler/`.
2. Keep `SettlerLogo` variants aligned with updated files.
3. Update `image-config.ts` only if dimensions/format change.
4. Verify: header, footer, app metadata, manifest, service worker cache list, and social preview metadata.
