# First-run Verification Report

## Commands executed

- `pnpm run repo-integrity` ✅ passes after contract fixes.
- `pnpm run demo` ✅ deterministic demo verifies replay.
- `pnpm run bootstrap` ⚠️ failed before doctor first-run tuning; then remediated by adding `--first-run` mode.
- `pnpm run doctor -- --skip-pipeline` ⚠️ strict mode reports real local issues (Node 22 + env + hard-500 scan).

## Verified improvements

- Repo contract failures (workspace manifests, stale script references, missing package contracts) were root-caused and fixed.
- One-command bootstrap exists and now uses first-run-safe diagnostics.
- One-command demo and one-command dev stack are explicitly documented.
- Top-level onboarding flow is now bootstrap → doctor → demo → dev.

## Residual risk

- Strict doctor still fails under Node 22 and on known hard-500 route patterns; this is intentional truth-telling behavior, not bypassed.
