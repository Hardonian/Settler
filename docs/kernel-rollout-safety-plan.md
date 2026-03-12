# Kernel Rollout Safety Plan

## Objective

Promote kernel hashing from TS fallback to primary execution without compromising determinism, tenant safety, or route availability.

## Guardrails (must remain true)

1. TS fallback path remains available for every operation.
2. Primary enablement requires handshake + operation support.
3. Promotion is operation-scoped (`SETTLER_KERNEL_PRIMARY_ALLOWLIST`).
4. Rollback can be immediate (global and per-operation flags).

## Rollout sequence

### Stage 0 — Disabled baseline

- `SETTLER_DISABLE_KERNEL=1`
- Validate deterministic TS outputs and integration behavior.

Exit criteria:

- No regressions in reconciliation hash determinism.

### Stage 1 — Shadow-only safety run

- `SETTLER_KERNEL_ENABLED=1`
- `SETTLER_KERNEL_CANONICALIZE=1`
- `SETTLER_KERNEL_SHADOW_ONLY=1`
- Allowlist may be set for intended operations, but TS remains source of truth.

Exit criteria:

- `divergence == 0` for promotion candidate operation over representative workload.
- No sustained increases in timeout/malformed/version-mismatch counters.

### Stage 2 — Scoped primary canary

- `SETTLER_KERNEL_EXECUTION_MODE=primary`
- `SETTLER_KERNEL_PRIMARY_ALLOWLIST=<single operation>`

Exit criteria:

- Fallback rate below acceptable SLO threshold.
- No unexplained divergence.
- Handshake/readiness checks remain green.

### Stage 3 — Progressive operation expansion

- Add operations one at a time to allowlist.
- Keep shadow verification where possible for non-primary operations.

Exit criteria:

- Stable telemetry and no unresolved deterministic drift.

## Rollback controls

- Global rollback: `SETTLER_DISABLE_KERNEL=1`
- Safe compare rollback: `SETTLER_KERNEL_SHADOW_ONLY=1`
- Scoped rollback: `SETTLER_DISABLE_OPERATION=proof_bundle_hash` (example)
- Additional scope reduction: remove operation from `SETTLER_KERNEL_PRIMARY_ALLOWLIST`

## Readiness preflight

Use `checkKernelOperationReadiness(operation)` before promotion:

- binary availability
- handshake success
- operation readiness
- explicit reason when blocked

## Required observability review

Before each stage promotion, review:

- latency: `kernel_duration_ms` vs `ts_duration_ms`
- fallback rates and `fallbackByReason`
- divergence counters and operation breakdown
- timeout/malformed/version mismatch/binary unavailable counters
