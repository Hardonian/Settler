# Architecture Overview

## Capability

Settler provides deterministic execution with replayable verification and auditable run lineage.

## Intended use

- Reconciliation and operational workflows that require reproducibility.
- Multi-tenant environments with strict traceability and scoped access.

## Core components

- **Control plane (`packages/api`)**: API routes, auth, tenant middleware, idempotency, health/metrics, trace headers.
- **Execution services**: determinism, replay, policy evaluation, failure recording.
- **Web surfaces (`packages/web`)**: proof explorer, replay lab, status/support pages.
- **CLI (`packages/cli`)**: local diagnostics, demo generation, replay/verify workflows.

## Invariants

- Deterministic operations rely on canonical inputs and stable hashing.
- Tenant context must be preserved for protected reads/writes.
- Trace IDs (`X-Trace-Id`) and execution IDs are attached per request.
- Health and metrics endpoints remain available for operational checks.

## Caveats

- Not every route family is public product API; many are internal or operator-focused.
- v2 route family currently represents strategic/internal expansion areas.

## Example workflow

1. Run deterministic reconciliation.
2. Emit proof bundle/capsule.
3. Replay same inputs.
4. Compare hash/result equivalence.
5. Investigate divergence via failure records and audit trail.
