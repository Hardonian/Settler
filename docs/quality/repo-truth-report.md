# Repo Truth Report

Generated: 2026-03-09

## Broken Claims / Surfaces Found

- Ops dashboard route typecheck failed, making claimed route health data endpoint non-buildable.
- API runtime isolation tests failed in monorepo test run due to unresolved `@jest/globals` type import in test file.

## Implemented Corrections

- Fixed ops dashboard route typing for tenant usage aggregation and null-safe tenant id handling.
- Fixed runtime isolation test to use project-standard Jest globals setup.
- Added explicit route inventory entry for `/api/ops/dashboard` in architecture route map with runtime and error behavior notes.

## Removed/Downgraded Claims

- No route claims removed in this pass.
- Coverage claim remains downgraded to "not yet proven" pending transform/instrumentation fix for coverage mode.

## Final Verification Snapshot

- Typecheck: pass (`pnpm -s typecheck`).
- Route inventory generation: pass (`pnpm -s qa:routes`).
- API tests: pass (`pnpm --filter @settler/api test`).
- Coverage mode: fail (`pnpm --filter @settler/api exec jest --runInBand --forceExit --coverage`) due to current instrumentation stack error.
