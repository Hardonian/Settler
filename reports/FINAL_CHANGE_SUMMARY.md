# Final Change Summary

## Files changed and impact

- `packages/web/src/components/shared/route-state.tsx`
  - Added canonical route-state primitive for not-found/error/degraded screens to reduce styling drift and action inconsistency.
- `packages/web/src/app/console/not-found.tsx`
  - Migrated to shared route-state primitive for unified console 404 UX.
- `packages/web/src/app/console/error.tsx`
  - Migrated to shared route-state primitive with auth-aware recovery actions.
- `packages/web/src/app/console/layout.tsx`
  - Added private-route `noindex` metadata and canonical fatal fallback UI.
- `packages/web/src/app/dashboard/not-found.tsx`
  - Migrated to shared route-state primitive for consistent private-route 404 treatment.
- `packages/web/src/app/dashboard/layout.tsx`
  - Added private-route `noindex` metadata and explicit main landmark id.
- `packages/web/src/app/layout.tsx`
  - Fixed skip-link destination to a guaranteed root landmark.
- `packages/web/src/app/dashboard/page.tsx`
  - Removed duplicate in-page shell rendering (navigation/footer) so layout remains authoritative.

## Verification performed

- Lint, typecheck, and build run for `@settler/web` scope.

## Remaining risks / constraints / follow-ups

- Full repo-wide style normalization remains large; this pass focused on high-leverage shell/state consistency and private-surface SEO hygiene.
- Consider consolidating duplicate empty-state implementations in a dedicated follow-up.
