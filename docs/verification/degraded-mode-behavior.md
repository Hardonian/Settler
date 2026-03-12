# Degraded Mode Behavior Verification

Date: 2026-03-12

## Kernel and Fallback Paths

### Kernel metadata enforcement

- Fixed kernel fallback metadata to always include `health` during operation-disabled fallback paths in CLI kernel client.
- This keeps degraded states machine-visible and type-safe across canonicalize/proof/artifact hash fallback responses.

### UI degraded behavior

- Console overview includes:
  - env validation panel when required env vars are missing
  - authentication-required fallback
  - safe-mode non-destructive fallback content

### API degraded behavior evidence

- Web/API tests include explicit degraded/problem contract checks (`status-degraded-contract`, middleware enforcement, tenant boundaries).
- Error paths are observable via structured logging in tests rather than silent success.

## Verified No-Hard-500 Direction

- Build route manifest completes for all major routes (including enterprise, docs, console, trust surfaces).
- Dedicated browser E2E route gate could not be trusted due missing startup env requirements in this environment; this is documented as an execution limitation, not marked green.

## Follow-up Recommendation

1. Provide minimal CI-safe env fixture for Playwright reality gates (stub `DATABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`) so degraded-mode browser assertions can run deterministically.
2. Add explicit `--forceExit` (or open-handle cleanup) in web test runner path used by root `pnpm test` to avoid post-pass hangs.
