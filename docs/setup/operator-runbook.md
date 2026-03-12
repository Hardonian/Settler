# Operator Runbook

## First 5 minutes (degraded production)

1. Freeze blast radius: set `SETTLER_DISABLE_KERNEL=1` if hash/canonicalization path is suspect.
2. Validate process config and typed env: `pnpm run doctor -- --first-run`.
3. Inspect kernel status and operation readiness: `pnpm run kernel:health`.
4. Classify outage source: env/config failure vs kernel runner failure vs upstream integration failure.

## Startup checks

1. Validate env file against `docs/setup/env-matrix.md`.
2. Verify API/web baseline via `pnpm lint && pnpm typecheck && pnpm build`.
3. Run setup checks: `pnpm run doctor -- --first-run`.
4. Run kernel diagnostics: `pnpm run kernel:health`.

## Health checklist

- API health/readiness endpoints return success.
- Database connectivity succeeds using `DATABASE_URL`.
- Redis path (if configured) accepts read/write.
- Stripe webhook signature verification succeeds in staging before production rollout.

## Failure modes and immediate actions

### Missing/invalid auth or encryption secrets

- Symptom: runtime boot failure in production.
- Action: rotate/fix `JWT_SECRET` and `ENCRYPTION_KEY`, redeploy.

### Kernel binary unavailable / handshake failure / protocol mismatch

- Symptom: kernel diagnostics show `binary_unavailable`, `handshake_failed`, or `protocol_mismatch` style reasons.
- Action order:
  1. `SETTLER_DISABLE_KERNEL=1` for immediate stabilization.
  2. Optionally restore compare mode: `SETTLER_KERNEL_EXECUTION_MODE=shadow`.
  3. Reconcile binary path/version (`SETTLER_KERNEL_BIN`) and protocol compatibility.

### Scoped operation instability

- Symptom: one kernel operation fails while others are healthy.
- Action: disable only the failing operation via `SETTLER_DISABLE_OPERATION=<operation>`.

### Supabase privileged operations failing

- Symptom: service-role operations fail with authorization errors.
- Action: validate `SUPABASE_SERVICE_ROLE_KEY` and project URL pairing.

### Billing webhook failures

- Symptom: webhook endpoint rejects valid Stripe events.
- Action: re-sync `STRIPE_WEBHOOK_SECRET` from Stripe dashboard and replay test events.

## Rollback and safe-mode controls

- Disable kernel globally: `SETTLER_DISABLE_KERNEL=1`
- Shadow-only kernel execution: `SETTLER_KERNEL_EXECUTION_MODE=shadow`
- Disable one kernel operation: `SETTLER_DISABLE_OPERATION=proof_bundle_hash`
- Keep app operational without optional subsystems: leave optional keys unset (Sentry, PostHog, GA4, alert webhooks)

## Post-incident exit criteria

- Kernel diagnostics show healthy startup and expected operation readiness.
- Rollback flags are removed in a controlled deploy.
- `pnpm run check:production` and targeted runtime smoke checks pass.
