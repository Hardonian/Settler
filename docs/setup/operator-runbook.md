# Operator Runbook (Canonical)

> Back to platform truth index: [`docs/platform-index.md`](../platform-index.md)

1. Validate env file against `docs/setup/env-matrix.md`.
2. Run `pnpm run verify:setup` and clear all ❌ findings before deploy.
3. Verify API env parsing by running `pnpm typecheck` and API startup command.
4. Verify web can initialize Supabase client (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
This runbook defines the minimum deterministic procedure for operating Settler safely.

## 1) Initial setup

1. Copy and populate environment file(s) from repository templates.
2. Validate required variables against [`docs/setup/env-matrix.md`](./env-matrix.md).
3. Install dependencies and run baseline quality gates:
   - `pnpm install --frozen-lockfile`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
4. Start local stack for smoke checks:
   - `pnpm dev:stack`

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

Before enabling kernel primary mode:

1. Ensure kernel binary resolves and protocol handshake succeeds.
2. Run in `shadow` or `compare_only` mode first.
3. Confirm no unacceptable divergence/fallback patterns.
4. Promote operation-by-operation through `SETTLER_KERNEL_PRIMARY_ALLOWLIST`.

Reference: [`docs/architecture/rust-kernel-boundary.md`](../architecture/rust-kernel-boundary.md).

## 4) Fallback modes

Use explicit runtime controls (machine-visible) during degraded conditions:

- Disable kernel globally: `SETTLER_DISABLE_KERNEL=1`
- Force TS-only execution: `SETTLER_KERNEL_EXECUTION_MODE=disabled`
- Shadow compare during recovery: `SETTLER_KERNEL_EXECUTION_MODE=shadow`
- Disable specific operation: `SETTLER_DISABLE_OPERATION=<op_name>`
- Dry-run alert channels: `ALERT_NOTIFIER_DRY_RUN=1`

Reference: [`docs/setup/feature-flag-matrix.md`](./feature-flag-matrix.md).

## 5) Health checks

Operational checks to run during rollout and incident triage:

- `GET /health`
- `GET /health/live`
- `GET /health/ready`
- `GET /metrics`
- `pnpm doctor`
- `pnpm suite-doctor`
- `pnpm validate:tenant-isolation`

## 6) Rollback procedures

### A. Runtime rollback (fastest)

1. Disable or shadow kernel via environment controls.
2. Revert risky feature flags to known-safe values.
3. Keep core API/web surfaces live with degraded but explicit behavior.

### B. Release rollback

1. Redeploy last known good artifact.
2. Re-validate health/readiness endpoints.
3. Re-run smoke and tenant-isolation checks.
4. Log incident + remediation notes.

### C. Data-risk rollback guardrails

- Never bypass tenant policy checks during rollback.
- Preserve auditability (trace IDs, incident timeline, explicit degraded state).
- Require confirmation that cross-tenant boundaries remain enforced.

## 7) Incident response path

- Follow [`docs/INCIDENT_RESPONSE_PLAYBOOK.md`](../INCIDENT_RESPONSE_PLAYBOOK.md) for severity handling and communications.
- Use [`docs/operations/remediation-playbook.md`](../operations/remediation-playbook.md) for tactical remediation procedures.
