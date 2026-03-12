# Component Inventory (Design-System Dedup Focus)

_Last updated: 2026-03-12_

## Objective

Inventory UI components that should converge into shared primitives for consistent behavior across console, docs, marketing, admin, and enterprise surfaces.

## Canonical library target

Target convergence path: `packages/web/src/components/ui/*` and `packages/web/src/components/shared/*` as the primary source of reusable primitives, with `packages/react-settler/src/components/*` consuming shared tokens/variants rather than local inline style maps.

---

## Duplicate families and merge targets

| Family               | Current duplicates                                                                                                                                                                                                                                                | Merge target                                                                                      | Priority |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| Error Boundary       | `components/error-boundary.tsx`, `components/ui/error-boundary.tsx`, `components/shared/error-boundary.tsx`, `components/admin/error-boundary.tsx`, `components/console/ErrorBoundary.tsx`, `components/ops/ErrorBoundary.tsx`, `react-settler/ErrorBoundary.tsx` | One shared `ui/error-boundary.tsx` + thin wrappers only if context-specific messaging is required | P0       |
| Empty State          | `components/EmptyState.tsx`, `components/shared/empty-state.tsx`, `components/ui/empty-state.tsx`, `components/console/EmptyState.tsx`                                                                                                                            | One canonical `ui/empty-state.tsx` with variant props                                             | P0       |
| Loading              | `components/LoadingSpinner.tsx`, `components/ux/LoadingSpinner.tsx`, `components/ui/LoadingState.tsx`, `components/console/LoadingState.tsx`, `components/Skeleton.tsx`, `components/ui/skeleton.tsx`                                                             | One loading primitive family in `ui/`                                                             | P1       |
| Progress             | `components/ProgressIndicator.tsx`, `components/feedback/ProgressIndicator.tsx`                                                                                                                                                                                   | One `ui/progress-indicator.tsx`                                                                   | P1       |
| Comparison Table     | `components/landing/ComparisonTable.tsx`, `components/marketing/ComparisonTable.tsx`                                                                                                                                                                              | One `shared/comparison-table.tsx` + content props                                                 | P1       |
| Rules Editor         | `components/RulesEditor.tsx`, `components/stitch-import/RulesEditor.tsx`                                                                                                                                                                                          | One tokenized editor shell + stitch adapter                                                       | P1       |
| Social Proof Counter | `components/SocialProofCounter.tsx`, `components/marketing/SocialProofCounter.tsx`                                                                                                                                                                                | One animated/stat counter primitive                                                               | P2       |

---

## Shared primitives status

## Buttons

- Current state: multiple button-like implementations still use custom wrappers/inline styles outside `ui/button` patterns.
- Required: enforce a single button variant matrix (size, tone, intent, loading state).

## Cards

- Current state: repeated `rounded + border + shadow` combinations with different values per feature.
- Required: one `SurfaceCard` primitive with semantic variants (`default`, `interactive`, `critical`, `elevated`).

## Tables

- Current state: mixed table structures (Tailwind tables, inline-styled tables, stitch-derived shells, virtualized table variants).
- Required: one `DataTableShell` + optional virtualization adapter.

## Badges / Alerts

- Current state: consistent enough in tokenized pages, but variants drift in stitch-import and explainers.
- Required: strict semantic variants only (`info`, `success`, `warning`, `error`, `neutral`).

## Navigation

- Current state: tenant-aware and console-specific navigation patterns exist, but color/theme handling still uses hardcoded fallback literals in places.
- Required: central nav theming contract bound to semantic token aliases.

---

## Known high-risk divergence zones

1. `packages/react-settler/src/components/*` (inline-style heavy, token bypass risk).
2. `packages/web/src/components/stitch-import/*` (export-faithful visuals with literal values).
3. `ui/explainers/*` (hardcoded colors/borders not tied to token semantics).

---

## Merge sequencing

1. **P0:** ErrorBoundary + EmptyState family consolidation.
2. **P1:** Loading/Progress/Table/Card primitive normalization.
3. **P1:** Stitch-import adapter layer conversion to canonical primitives.
4. **P2:** Marketing duplicate consolidation (comparison/stat counters).
5. **P2:** `react-settler` adoption of shared token contract and optional CSS-variable bridge.
