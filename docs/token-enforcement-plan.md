# Token Enforcement Plan

_Last updated: 2026-03-12_

## Goal

Make token usage deterministic and enforceable so all UI surfaces render from one visual language.

## Non-goals

- No large, high-risk visual rewrites in one batch.
- No deletion of feature behavior to force visual consistency.

---

## Enforcement architecture

## 1) Canonical source contract

- Keep `design-system/css-tokens.css` as the runtime source of truth.
- Generate typed token bindings for TS/TSX consumers from that source (build-time artifact).
- Treat `design-system/tokens.json`, `design/tokens.json`, and `packages/web/src/design-system/tokens.ts` as derived artifacts or deprecate duplicates.

## 2) CI static policy

Introduce repo checks that fail on non-token style literals in UI paths:

- Block raw hex colors in UI TSX/CSS except approved token definition files.
- Block inline style color/border/shadow literals outside explicit allowlist files.
- Block arbitrary Tailwind color/shadow values (`bg-[#...]`, `shadow-[...]`) unless tokenized indirection is used.

## 3) Shared primitive policy

New page/component work must use shared primitives for:

- button
- card
- table
- badge
- alert
- empty/error/loading states
- page container/section wrappers

Any exception must include rationale and expiry date in code comments.

---

## Migration plan (phased)

## Phase A (P0, immediate)

1. Consolidate ErrorBoundary and EmptyState families.
2. Normalize console branding defaults to semantic token aliases rather than route-local hex literals.
3. Add CI audit script + baseline file for controlled rollout.

## Phase B (P1)

1. Migrate stitch-import components to tokenized primitives (`SurfaceCard`, semantic badges/alerts, standardized tables).
2. Replace custom shadow/border literals with token aliases.
3. Standardize page layout wrappers across console/docs/marketing/dashboard.

## Phase C (P1/P2)

1. Migrate `react-settler` inline-style components to token variables or shared primitives.
2. Migrate `ui/explainers` to token-aware styles.
3. Remove duplicate token maps and enforce generated bindings.

## Phase D (P2 hardening)

1. Add visual regression coverage for representative routes by surface.
2. Add “token drift” report in CI artifact output.
3. Require design-system approval for new primitive variants.

---

## Verification matrix

Each migration batch should prove:

- **Lint/type/build pass** for touched packages.
- **UI token policy checks pass** (no new hardcoded literals).
- **Route smoke pass** for affected surfaces.
- **Visual snapshot diff reviewed** for meaningful UI pages.
- **Graceful degradation preserved** (no route hard-500 behavior introduced).

---

## Residual risk

- Legacy surfaces with inline styles may pass functional tests but still violate visual consistency.
- Tenant/theme customization paths can reintroduce literal values unless constrained by typed token APIs.
- Stitch-import refreshes may reintroduce export literals without adapter-level guards.

Mitigation: enforce policy at CI + adapter boundaries, not only at manual review.
