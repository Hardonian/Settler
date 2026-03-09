# Test Coverage Report

_Last updated: 2026-03-09_

## Executed suites

- `pnpm run test` (monorepo turbo test run).
- `pnpm --filter @settler/web test` (focused rerun after middleware assertion fix).
- `pnpm run test:ci:verify` (API CI verification path via `pnpm run verify`).

## Observed coverage breadth

- **API endpoints / contracts**: integration and route validation tests in `packages/api/src/__tests__/integration/*`.
- **Tenant guardrails**: dedicated multi-tenant tests in `packages/api/src/__tests__/multi-tenancy/*` and web cross-tenant tests.
- **Proof / replay behavior**: replay verification exercised in `verify:policy` (`scripts/settler-replay.ts`) and web replay tests.
- **CLI command paths**: Jest suites in `packages/cli/src/__tests__/*`.
- **Repo integrity behavior**: `pnpm run repo-integrity` enforced in this pass.

## Current test results snapshot

- `@settler/api`: 35 passed suites (11 skipped), 193 passed tests.
- `@settler/web`: 35 passed suites (2 skipped), 124 passed tests.
- `@settler/cli`: 5 passed suites, 13 passed tests.
- Supporting SDK/packages passed in turbo run.

## Notes

- Some suites intentionally skip based on runtime/environment requirements.
- Jest open-handle warnings are still present in some packages; runs complete successfully but should be reduced over time.
