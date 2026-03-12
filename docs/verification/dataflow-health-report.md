# Dataflow Health Report

Date: 2026-03-12

## Dataflow Verification Sources

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- existing targeted tests in `packages/api` and `packages/web`

## Dynamic Surface Dataflow Status

| Surface                                | Data source                                          | Contract alignment                    | Empty/error behavior                                     | Status                              |
| -------------------------------------- | ---------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `/console` overview                    | Supabase auth + usage/api keys/receipts domain calls | Typecheck + build pass                | Explicit auth panel, env error panel, safe mode fallback | Healthy with graceful degrade       |
| `/api/console/*` family                | Console API handlers                                 | Built routes + web API contract tests | Tested degraded/problem contracts                        | Healthy (contract-level)            |
| Tenant isolation paths (`api` + `web`) | Tenant-scoped repositories/services                  | Multi-tenancy tests pass              | Isolation failures surfaced as explicit errors           | Healthy                             |
| Billing/entitlements enforcement       | Usage middleware + billing helpers                   | Middleware tests pass                 | Explicit error logs and fallback paths                   | Healthy with explicit degraded mode |
| Replay/proof paths                     | Replay + reconciliation modules                      | Replay/proof tests pass               | Fallback behavior covered in tests                       | Healthy                             |

## Known Environment-Limited Gaps

- Playwright route-reality run starts with startup validation warning for missing required env (`DATABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`), so end-to-end browser data verification is not considered reliable in this container.
- `pnpm test` suite completes tests but can hang after completion due open handles in web Jest process; functional pass is visible in output, but process cleanup remains imperfect.
