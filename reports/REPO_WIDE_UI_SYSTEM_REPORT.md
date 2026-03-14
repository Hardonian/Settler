# Repo-Wide UI System Report

## Visual system issues found

- Route-level not-found/error experiences used different card anatomy, copy tone, spacing rhythm, and action hierarchy.
- Console and dashboard private surfaces were still indexable by crawlers due to missing route-group metadata overrides.
- Skip-link target did not exist consistently across route trees, reducing keyboard reliability.
- Dashboard route rendered duplicate shell elements (`Navigation`/`Footer`) inside page content despite layout ownership.

## Duplication/drift findings

- State screens for `/console` and `/dashboard` had parallel one-off implementations.
- Error/404 action stacks were inconsistent (`Go Home`, `Back`, `Try Again`) with mixed visual emphasis.

## Dashboard/app-shell improvements made

- Canonical state primitive introduced: `RouteStateCard` with consistent icon, heading, detail, and action slots.
- `/console` error + not-found screens migrated to canonical state primitive.
- `/dashboard` not-found migrated to canonical state primitive.
- Console layout fatal fallback migrated to canonical state primitive.
- Dashboard page now relies on dashboard layout for nav/footer (no duplicate shell rendering).

## Public/marketing/product page improvements made

- No direct marketing page changes in this pass.

## Accessibility fixes

- Root skip link now points to a guaranteed page wrapper target (`#site-main`).
- Dashboard layout now exposes a stable `main` landmark id for assistive navigation.
- State screens now share consistent semantic card hierarchy and predictable action order.

## Metadata/SEO fixes

- Added `robots: { index: false, follow: false }` metadata on `/console` and `/dashboard` layouts.
- Added explicit nested titles for private surfaces (`Developer Console`, `Dashboard`).

## Responsive/mobile fixes

- Canonical state card action rows now use wrapped actions by default, improving narrow viewport behavior.

## UX hardening fixes

- Console fallback states now include direct recovery actions and deterministic guidance copy.
- Dashboard shell conflict resolved to reduce layout jitter and duplicate navigation focus stops.

## Remaining UX debt

- Many route-level loading states still use custom skeleton proportions and should be progressively normalized.
- Shared empty state components remain duplicated (`ui/empty-state` and `shared/empty-state`) and should be reconciled in a follow-up.
