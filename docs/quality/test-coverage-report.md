# Test Coverage Report

Generated: 2026-03-09

## Baseline and Verification Commands

- `pnpm --filter @settler/api test` passes after the test typing fix.
- `pnpm --filter @settler/api exec jest --runInBand --forceExit --coverage` currently fails due to Jest/Istanbul instrumentation runtime error (`TypeError: The "original" argument must be of type function`) in this repository's current test transform stack.

## Gaps Closed in This Pass

- Fixed API test suite compile blocker by removing direct `@jest/globals` import from runtime tenant isolation test and relying on existing Jest globals typing.

## Remaining Coverage Truth

- This pass removed a hard test failure and restored full API test execution (`pnpm --filter @settler/api test`).
- Honest 100% repo-wide coverage is not yet proven because coverage instrumentation currently fails before collection.
