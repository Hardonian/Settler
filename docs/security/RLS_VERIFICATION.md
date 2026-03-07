# RLS Verification

## Runtime harness

`verify-rls-status.ts` now executes:

- policy presence checks on critical tables
- isolated runtime fixture in `settler_security.rls_runtime_probe`
- allow/deny matrix:
  - same tenant allow
  - cross tenant deny
  - anonymous deny

## Modes

- `static-only`: records static boundary only
- `runtime-rls`: executes runtime probe when DB env exists
- `runtime-rls-required`: fails when runtime proof missing/failing

## Required env

- `DATABASE_URL` or `DIRECT_URL` or `SUPABASE_DB_URL`

## Commands

- `SECURITY_RLS_EVIDENCE_MODE=runtime-rls pnpm run verify:rls:live`
- `SECURITY_RLS_EVIDENCE_MODE=runtime-rls node scripts/security/verify-rls-boundary.mjs`
