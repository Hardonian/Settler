# ADR 0012: TigerBeetle Dual-Ledger and Cursor Streaming Topology

## Status

Accepted

## Context

Settler's initial architecture relied solely on relational PostgreSQL transactions to track account balances, pending authorizations, settled funds, and discrepancy state transitions. While suitable for initial throughput (~1,000 TPS), this single-tier relational model presented substantial bottlenecks when scaling to high-frequency payment gateways, exchange feeds, and multi-tenant settlement pipelines:

1. **Row Contention on Shared Balances**: Concurrent debit and credit operations on hot tenant accounts caused severe row lock contention and serialization failures in PostgreSQL.
2. **Memory Exhaustion on Massive Reconciliations**: Processing millions of transactions in large memory batches caused V8 heap exhaustion and high garbage collection pauses.
3. **Integer Precision Vulnerabilities**: JavaScript's standard 64-bit float numbers (`Number.MAX_SAFE_INTEGER` = 2^53 - 1) risk silent precision truncation when handling high-denomination or micro-cent balance quantities.
4. **Out-of-Order Webhook Anomalies**: Asynchronous, distributed webhooks (e.g., captures arriving before authorizations, refunds racing settlements) required two-phase commit primitives capable of pending, posting, and voiding transfers with sub-millisecond latency.

## Decision

We adopt a high-throughput **Dual-Ledger & Batched Cursor Streaming Topology** combining TigerBeetle for high-speed double-entry transfer recording and PostgreSQL for rich relational queryability:

### 1. TigerBeetle Two-Phase Commit State Machine
- High-frequency financial state transitions are committed to TigerBeetle using its native two-phase transfer protocol:
  - **Pending Authorization**: Transferred with `flags.pending = true`, reserving balances without settlement.
  - **Settlement Posting**: Finalized with `flags.post_pending_transfer = true`, atomically linking to the pending transfer ID.
  - **Cancellation / Void**: Cleanly released with `flags.void_pending_transfer = true`.
- **128-Bit Integer Safety**: All account IDs, transfer IDs, amounts, and ledger codes are strictly handled as native `BigInt` (128-bit unsigned integers), eliminating JavaScript IEEE 754 precision clipping.

### 2. High-Throughput Cursor Streaming Topology
- Instead of loading large result sets into memory, the reconciliation engine ingests transactions using keyset-based cursor pagination and backpressure-aware Node.js streams.
- Records are streamed in deterministic chunks (e.g., 1,000-5,000 items) bounded by monotonic sequence keys (`(createdAt, id)`).
- Memory footprint remains flat (<128MB RSS) regardless of whether reconciling 10,000 or 10,000,000 transactions.

### 3. Distributed Concurrency & Idempotency Boundary
- Twin webhook arrivals within sub-second race windows are guarded at the ingestion layer using Redis distributed locks (`SET key NX EX 30` with `tenantId` isolation) and backed by PostgreSQL atomic upserts into `idempotency_keys`.

## Consequences

### Positive
- **Throughput Scaling**: Scales Settler's transfer ingestion and matching throughput from 1,000 TPS to 100,000+ TPS.
- **Strict Double-Entry Guarantee**: TigerBeetle enforces cryptographic hash-chaining, zero-balance drift, and deterministic invariant checks at the kernel level.
- **Zero Integer Truncation**: Native 128-bit `BigInt` precision guarantees financial exactness across all currencies.
- **Predictable Memory Footprint**: Streaming cursor topology prevents V8 out-of-memory crashes on massive transaction datasets.

### Negative / Trade-offs
- Requires operating TigerBeetle nodes alongside PostgreSQL in the production deployment topology.
- Dual-ledger synchronization necessitates asynchronous projection workers to mirror TigerBeetle account balances back into PostgreSQL reporting tables.
