# Operator Runbook

## Startup checks

1. Validate env file against `docs/setup/env-matrix.md`.
2. Verify API env parsing by running `pnpm typecheck` and API startup command.
3. Verify web can initialize Supabase client (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Health checklist

- API health endpoints return success (if enabled by `HEALTH_CHECK_ENABLED=true`).
- Database connectivity succeeds using `DATABASE_URL`.
- Redis path (if configured) accepts read/write.
- Stripe webhook signature verification succeeds in staging before production rollout.

## Failure modes and immediate actions

### Missing/invalid auth or encryption secrets

- Symptom: runtime boot failure in production.
- Action: rotate/fix `JWT_SECRET` and `ENCRYPTION_KEY`, redeploy.

### Kernel binary unavailable

- Symptom: kernel readiness reports `binary_unavailable` or fallback reason.
- Action:
  - set `SETTLER_DISABLE_KERNEL=1` for hard fallback, or
  - set `SETTLER_KERNEL_EXECUTION_MODE=shadow` while restoring binary.

### Supabase privileged operations failing

- Symptom: service-role operations fail with authorization errors.
- Action: validate `SUPABASE_SERVICE_ROLE_KEY` and project URL pairing.

### Billing webhook failures

- Symptom: webhook endpoint rejects valid Stripe events.
- Action: re-sync `STRIPE_WEBHOOK_SECRET` from Stripe dashboard.

## Rollback and safe-mode controls

- Disable kernel globally: `SETTLER_DISABLE_KERNEL=1`
- Shadow-only kernel execution: `SETTLER_KERNEL_EXECUTION_MODE=shadow`
- Disable one kernel operation: `SETTLER_DISABLE_OPERATION=proof_bundle_hash`
- Keep app operational without optional subsystems: leave optional keys unset (Sentry, PostHog, GA4, alert webhooks)
