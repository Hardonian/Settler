# Technical Reality Hardening (Infrastructure + Guarantee Alignment)

This document maps the current system architecture to public claims and explicitly marks each claim as **implemented**, **scoped**, or **roadmap**.

## 1) Architecture map

### Control plane

- `runner/executeWithPolicy.ts` is the control-plane entrypoint for policy-scoped execution.
- It validates requests, compiles policy, enforces budgeted execution, and writes audit evidence.

### Deterministic execution engine

- `scripts/moat/engine.ts` runs deterministic reconciliation logic for demo/replay harnesses.
- `scripts/reconciliation-control-plane.mjs` defines canonical serialization (`stableStringify`) and SHA-256 hashing used for spec/artifact/output fingerprints.

### Replay and proof verification path

- `scripts/moat/replay.ts` re-executes from evidence artifacts.
- `scripts/verify-proof.ts` verifies artifact presence, hash integrity, fingerprint consistency, provenance hash chain, and replay match.

### Worker and orchestration path

- `packages/workhorse/src/settler_workhorse/worker.py` provides lease-style claim/process/fail loops.
- `packages/workhorse/src/settler_workhorse/db/__init__.py` provides claim, retry with exponential backoff, attempt tracking, dead-letter persistence, and stale lock release.

### Storage + state boundaries

- Evidence artifacts are persisted as `run.json`, `results.json`, `evidence.json`, and `report.html`.
- Job execution state is persisted in queue tables with explicit status transitions (`queued` → `running` → `succeeded|dead`).

### Tenant isolation boundaries

- Worker repository enforces tenant context via `set_config('app.current_tenant_id', ...)` for RLS-aware operations.
- Queue enqueue/get/cancel operations are tenant-scoped.

## 2) Execution flow + state transitions

Execution lifecycle:

1. Trigger execution with policy context (`executeWithPolicy`).
2. Canonical hash input/config/result.
3. Compute deterministic run fingerprint.
4. Emit evidence bundle + provenance hash chain.
5. Replay path re-runs from evidence and checks fingerprint match.
6. `verify-proof` validates reproducibility and tamper evidence.

Worker lifecycle:

1. Worker claims queued job (`claim_next_job`).
2. Job attempt is recorded with correlation id.
3. Handler executes.
4. Success persists result and completes attempt.
5. Failure schedules retry (exponential backoff) or dead-letters permanently.

## 3) Public-claim alignment matrix

### Implemented now

- Deterministic hashing pipeline uses one algorithm (SHA-256) with canonical serialization.
- Replay is verifiable (`verify:replay`) and now proof-verifiable (`verify:proof`).
- Execution evidence includes fingerprints + provenance chain.
- Worker reliability includes retries, DLQ, and stale-lock recovery.
- Tenant boundaries are enforced in worker DB operations.

### Scoped (claim narrowed to current boundary)

- "Deterministic system state" is accurate **within the execution/evidence boundary** (same inputs/config/engine version), not for arbitrary external connector side effects.
- "Cryptographic proof chains" are currently SHA-256 tamper-evidence chains, not blockchain/notarized proofs.

### Roadmap (not claimed as fully delivered)

- Global append-only cross-service event backbone with fan-out subscriptions.
- Full connector sandbox runtime with capability manifests and deterministic side-effect fencing.
- Automated CAS repair/GC tooling with reference graph compaction.
- Large-scale stress harness targets (10k distributed executions with fault injection).

## 4) Failure boundaries and guarantees

- **At-least-once job execution**: guaranteed by queued/running retries and stale-lock recovery.
- **Idempotency**: supported via idempotency keys at enqueue level.
- **Crash recovery**: locked jobs can be re-queued after timeout.
- **Proof reproducibility**: verify-proof recomputes hashes/fingerprint and enforces replay parity.

## 5) Operational checks

Recommended minimum CI gate:

- `pnpm verify:determinism`
- `pnpm verify:replay`
- `pnpm verify:proof`
- `pnpm run workhorse:test`

This keeps public claims tied to executable verification.
