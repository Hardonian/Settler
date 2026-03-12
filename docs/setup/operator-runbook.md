# Operator Runbook (Canonical)

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

## 1) Initial setup

- API health/readiness endpoints return success.
- Database connectivity succeeds using `DATABASE_URL`.
- Redis path (if configured) accepts read/write.
- Stripe webhook signature verification succeeds in staging before production rollout.

## 2) Deployment steps

1. Confirm deployment preconditions in [`docs/setup/deployment-readiness.md`](./deployment-readiness.md).
2. Verify CI/deployment secrets are present and scoped correctly.
3. Execute release quality gates:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm test`
4. Deploy to staging first; validate health + readiness endpoints.
5. Promote to production only after staging verification and rollback controls are validated.

## 3) Kernel verification

### Kernel binary unavailable / handshake failure / protocol mismatch

- Symptom: kernel diagnostics show `binary_unavailable`, `handshake_failed`, or `protocol_mismatch` style reasons.
- Action order:
  1. `SETTLER_DISABLE_KERNEL=1` for immediate stabilization.
  2. Optionally restore compare mode: `SETTLER_KERNEL_EXECUTION_MODE=shadow`.
  3. Reconcile binary path/version (`SETTLER_KERNEL_BIN`) and protocol compatibility.

### Scoped operation instability

- Symptom: one kernel operation fails while others are healthy.
- Action: disable only the failing operation via `SETTLER_DISABLE_OPERATION=<operation>`.

Reference: [`docs/architecture/rust-kernel-boundary.md`](../architecture/rust-kernel-boundary.md).

## 4) Fallback modes

Use explicit runtime controls (machine-visible) during degraded conditions:

- Symptom: webhook endpoint rejects valid Stripe events.
- Action: re-sync `STRIPE_WEBHOOK_SECRET` from Stripe dashboard and replay test events.

Reference: [`docs/setup/feature-flag-matrix.md`](./feature-flag-matrix.md).

- Disable kernel globally: `SETTLER_DISABLE_KERNEL=1`
- Shadow-only kernel execution: `SETTLER_KERNEL_EXECUTION_MODE=shadow`
- Disable one kernel operation: `SETTLER_DISABLE_OPERATION=proof_bundle_hash`
- Keep app operational without optional subsystems: leave optional keys unset (Sentry, PostHog, GA4, alert webhooks)

## Post-incident exit criteria

- Kernel diagnostics show healthy startup and expected operation readiness.
- Rollback flags are removed in a controlled deploy.
- `pnpm run check:production` and targeted runtime smoke checks pass.
