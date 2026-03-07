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
- `runner/eventBackbone.ts` provides durable append-only event logging with idempotent append, consumer leases, acknowledgements, and per-run replay.

### Worker and orchestration path

- `packages/workhorse/src/settler_workhorse/worker.py` provides lease-style claim/process/fail loops.
- `packages/workhorse/src/settler_workhorse/db/__init__.py` provides claim, retry with exponential backoff, attempt tracking, dead-letter persistence, and stale lock release.
- `packages/adapters/src/connector-sandbox.ts` enforces connector timeout fencing, input cloning, normalized option handling, and normalized error wrapping.

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
- Replay is verifiable (`verify:replay`) and proof-verifiable (`verify:proof`).
- Execution evidence includes fingerprints + provenance chain.
- Worker reliability includes retries, DLQ, and stale-lock recovery.
- Tenant boundaries are enforced in worker DB operations.
- Durable append-only event backbone is active via `runner/eventBackbone.ts` with idempotency keys, consumer leases, ack offsets, and replay APIs.
- Connector sandbox/fencing is active through `executeConnectorSandboxed` in connector runtime with timeout enforcement and normalized error wrapping.
- CAS integrity/repair/GC tooling is implemented via `scripts/cas-tool.ts` (`verify`, `repair`, `gc`).
- 10k execution stress/failure validation exists via `scripts/stress-reliability.ts` and is CI-runnable (`verify:event-backbone`).

### Scoped (claim narrowed to current boundary)

- "Deterministic system state" is accurate **within the execution/evidence boundary** (same inputs/config/engine version), not for arbitrary external connector side effects.
- "Cryptographic proof chains" are SHA-256 tamper-evidence chains, not blockchain/notarized proofs.

### Roadmap

- Cross-process fan-out to external brokers (Kafka/NATS) is optional scale-out, not required for current durability guarantees.

## 4) Failure boundaries and guarantees

- **At-least-once job execution**: guaranteed by queued/running retries and stale-lock recovery.
- **Idempotency**: supported via idempotency keys at enqueue level.
- **Crash recovery**: locked jobs can be re-queued after timeout.
- **Proof reproducibility**: verify-proof recomputes hashes/fingerprint and enforces replay parity.
- **Event durability + recoverability**: append-only log tolerates partial tail writes and preserves idempotent replay/lease semantics.
- **Connector containment**: runtime fences connector execution by timeout and normalized error handling.
- **CAS hygiene**: verify/repair/gc utilities keep content-addressed store reference-safe and auditable.

## 5) Operational checks

Recommended minimum CI gate:

- `pnpm verify:determinism`
- `pnpm verify:replay`
- `pnpm verify:proof`
- `pnpm verify:event-backbone`
- `pnpm verify:cas`
- `pnpm run workhorse:test`

This keeps public claims tied to executable verification.
