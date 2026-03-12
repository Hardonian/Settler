# Final Blocker Matrix

Date: 2026-03-12

## RESOLVED

| Item                                                            | Evidence                                                                                                     | Owner         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| Missing `verify:setup` script wiring                            | Added `verify:setup` script entry to root `package.json` and command now executes `scripts/verify-setup.ts`. | Platform / DX |
| Missing `settler:doctor` command used by readiness prompts/docs | Added `settler:doctor` script alias to run `doctor -- --first-run`.                                          | Platform / DX |

## EXPECTED_MISSING_ENV

| Command                     | Subsystem            | Exact cause                                                                                         | Blocks go-live? | Blocks enterprise eval? | Blocks operator confidence? | Deferrable?                          |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------------------------- | --------------- | ----------------------- | --------------------------- | ------------------------------------ |
| `pnpm run verify:setup`     | Setup validation     | Missing Supabase public/auth vars and DB DSN in this environment                                    | No (with env)   | No (with env)           | Yes until populated         | Yes, until deployment env population |
| `pnpm run settler:doctor`   | Operator diagnostics | Missing `.env.local` and required runtime keys (`DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_API_URL`) | No (with env)   | No                      | Yes until populated         | Yes                                  |
| `pnpm run check:production` | Production gate      | Fails required `verify:setup` step due missing env/secrets                                          | No (with env)   | No                      | Yes until env is complete   | Yes                                  |

## REMAINING_BLOCKER

None after script reconciliation in this pass.

## NON_BLOCKING_FRICTION

| Command                                         | Subsystem              | Exact cause                                                                          | Impact                                                            |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `pnpm test` / `pnpm --filter @settler/web test` | Web test harness       | Jest reports open handles and does not exit promptly after suites pass               | Slower/confusing CI signal; not a functional correctness failure  |
| `pnpm lint`                                     | TS monorepo quality    | Existing warning baseline (unused vars/no-console cases)                             | Signal noise; does not block build/typecheck                      |
| `pnpm run kernel:health`                        | Kernel rollout posture | Kernel disabled in current env; startup health timeout and per-op readiness disabled | Honest degraded signal, acceptable outside kernel-enabled rollout |

## PRE_EXISTING_UNRELATED

| Item                                                                  | Notes                                |
| --------------------------------------------------------------------- | ------------------------------------ |
| `packages/sdk-go/go.sum` untracked in working tree prior to this pass | Not modified by this readiness work. |
