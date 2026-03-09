# Dependency Pruning Report

_Date: 2026-03-09_

## What changed

### Packages removed

- Removed dead workspace package: `packages/jobforge-config` (`@jobforge/config`).

### Packages merged

- None in this pass (explicitly avoided broad merges without stronger verification coverage).

### Packages reclassified

- `@jobforge/typescript-config` remains an internal tooling/config package.
- `@jobforge/errors` and `@jobforge/fetch` remain internal libraries; both no longer depend on removed `@jobforge/config`.

### Dependency pruning

- Removed `@jobforge/config` from:
  - `packages/jobforge-errors/package.json` devDependencies
  - `packages/jobforge-fetch/package.json` devDependencies
- Removed stale root TS path alias `@jobforge/config` from `tsconfig.json`.

## Canonicalization decisions

- No high-risk family migration (e.g., Jest→Vitest) performed in this pass.
- Kept existing toolchain choices but documented policy and category contracts to prevent unbounded drift.

## Core vs optional dependency boundaries

- Clarified in documentation (see dependency policy + core vs full setup guide).
- No runtime capability removed.

## Verification evidence

- `pnpm --filter @jobforge/errors lint` ✅
- `pnpm --filter @jobforge/fetch lint` ✅
- `pnpm --filter @jobforge/errors build` ✅
- `pnpm --filter @jobforge/fetch build` ✅
- `pnpm --filter @jobforge/adapter-settler typecheck` ✅
- `pnpm --filter @settler/web validate:boundary` ✅
- `pnpm run repo-integrity` ✅
- `pnpm install --frozen-lockfile` ✅
- `pnpm install --lockfile-only` ✅

## Drift-prevention improvements delivered

- Added explicit monorepo/package category/dependency/workspace contract docs under `docs/architecture`, `docs/reference`, and `docs/getting-started`.
- Removed a dead package and stale alias/dependencies that previously masked contract drift.

## Residual risk

- Full product-wide `pnpm run verify` was not executed in this pass due scope/latency; package-level and integrity-level verification for touched surfaces is green.
