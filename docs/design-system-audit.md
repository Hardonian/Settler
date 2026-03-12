# Design System Integrity Audit

_Last updated: 2026-03-12_

## Scope

Audit performed across the web UI surfaces in this repository:

- **Console / in-product app routes** (`packages/web/src/app/console/**`, `packages/web/src/app/app/**`)
- **Docs routes** (`packages/web/src/app/docs/**`)
- **Marketing routes/components** (`packages/web/src/app/(marketing)/**`, `packages/web/src/components/marketing/**`)
- **Admin/operations components** (`packages/web/src/components/admin/**`, `packages/web/src/components/ops/**`)
- **Enterprise/dashboard surfaces** (`packages/web/src/app/dashboard/**`, `packages/web/src/app/investor/**`)
- **Shared UI and SDK-facing React UI** (`packages/web/src/components/**`, `packages/react-settler/src/components/**`, `ui/explainers/**`)

---

## Phase 1 — Token Discovery (Current State)

## Canonical token sources found

1. `design-system/css-tokens.css` defines the canonical CSS-variable token system and explicitly declares itself as the single source of truth.
2. `packages/web/src/app/globals.css` imports canonical tokens and layers Tailwind/component utilities.
3. `packages/web/tailwind.config.js` maps utilities to CSS-variable tokens.
4. `design-system/tokens.json` and `design/tokens.json` both exist as JSON token definitions.

## Token drift found

Multiple parallel token systems are active:

- `design-system/tokens.json` (blue-first palette)
- `design-system/css-tokens.css` (teal/dark-first canonical CSS vars)
- `packages/web/src/design-system/tokens.ts` (electric token set with additional values)
- `packages/web/src/lib/readylayer/themes.ts` (provider/theme constants with hardcoded hex)
- `packages/web/src/lib/tenant/colorTokens.ts` (hardcoded defaults + dynamic RGB generation)

**Conclusion:** token intent is centralized, but implementation is fragmented across CSS vars, JSON tokens, and TypeScript token maps.

---

## Phase 2 — Token Usage Audit (Violations)

Automated static scan of UI code found significant non-token usage in key surfaces.

## Violation summary (counts)

| Surface              | Hex literals | rgba/hsl literals | Custom shadow expressions | Inline style blocks |
| -------------------- | -----------: | ----------------: | ------------------------: | ------------------: |
| Console              |           15 |                 0 |                         1 |                  15 |
| Docs                 |            0 |                 0 |                         0 |                   1 |
| Marketing            |            0 |                 1 |                         0 |                  10 |
| Admin                |            0 |                 0 |                         0 |                   2 |
| Enterprise/dashboard |            0 |                 0 |                         0 |                   2 |
| Shared/platform-wide |          238 |                41 |                         9 |                 210 |

## High-signal violation locations

- `packages/web/src/app/console/site/branding/page.tsx` (hardcoded brand defaults and inline style-heavy form)
- `packages/web/src/components/stitch-import/*` (hardcoded colors and ad-hoc visual styles in imported panels)
- `packages/web/src/components/ui/SpotlightCard.tsx` and `RippleButton.tsx` (hardcoded rgba defaults)
- `packages/react-settler/src/components/*` (extensive inline styles with hardcoded spacing/border/color)
- `ui/explainers/*` (literal color palette and border tokens in inline style)

---

## Phase 3 — Component Deduplication Findings

Duplicate components exist with divergent implementations and naming conventions.

### Duplicate component families detected

- **Error boundaries:** `error-boundary.tsx`, `ErrorBoundary.tsx` variants across `ui`, `shared`, `admin`, `console`, `ops`, and `react-settler`
- **Empty states:** `EmptyState.tsx`, `empty-state.tsx` in multiple domains
- **Loading patterns:** `LoadingSpinner.tsx`, `LoadingState.tsx`, `Skeleton.tsx`
- **Progress indicators:** top-level and feature-local variants
- **Rules/Comparison tables:** duplicated in landing/marketing and stitch-import/top-level implementations

**Conclusion:** design primitives are not yet universally consumed; local copies proliferate across product domains.

---

## Phase 4 — Layout Normalization Findings

Layout conventions are inconsistent:

- Mixed container widths and ad-hoc paddings in page-level route files
- Repeated custom card wrappers with different radius/shadow/border semantics
- Typography hierarchy partly normalized via base styles, but frequently overridden via route-local classes and inline styles

### Needed normalized primitives

- `PageContainer` (`max-w`, responsive horizontal padding)
- `PageSection` (standardized section spacing)
- `SurfaceCard` (single border/radius/shadow profile)
- `DataTableShell` (shared table container/header/body spacing)

---

## Phase 5 — Stitch Screen Validation

Stitch export assets were found under `_import/stitch_panels/**` and consumed through `packages/web/src/components/stitch-import/**`.

Validation result:

- Stitch-derived surfaces are present.
- They currently preserve many literal visual values from export code.
- They are **not yet fully normalized** onto the canonical token set used by `globals.css` + Tailwind mapping.

---

## Phase 6 — Token Migration Status

Migration is **partial**:

- Base web shell and many Tailwind paths use tokenized values.
- Significant portions of console branding, stitch-import components, reusable SDK UI (`react-settler`), and explainers still use hardcoded values.

No broad-risk mass refactor was applied in this audit pass; instead this report defines precise enforcement and migration sequencing in `docs/token-enforcement-plan.md`.

---

## Phase 7 — End-State Definition (Acceptance)

Design system integrity is considered complete when:

1. All app surfaces consume one canonical token source (CSS vars + generated typed bindings).
2. New raw color/shadow/spacing literals are blocked in CI for UI code.
3. Shared primitives own button/card/table/badge/alert/navigation behaviors.
4. Stitch-import screens are mapped to semantic tokens, not preserved literals.
5. Visual QA passes for representative routes in console, docs, marketing, admin, and enterprise dashboards.
