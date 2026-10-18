# ADR 0012: TigerBeetle Dual-Ledger and Cursor Streaming Topology

## Status

Accepted

## Context

PostgreSQL remains the query and audit system of record, while high-contention balance transitions benefit from TigerBeetle's double-entry state machine. The integration must preserve tenant ownership, exact minor units, retry idempotency, and observable projection lag. Throughput targets are capacity goals, not guarantees without benchmark evidence.

## Decision

- TigerBeetle records transfer state; PostgreSQL stores tenant-scoped business entities, evidence, and cursor/projection state. Projection parity is monitored and must not be presented as current when the cursor is stale.
- Authorization creates a transfer with `pending`. Capture creates a distinct transfer with `post_pending_transfer` and the original `pending_id`. Expiry/cancellation creates a distinct transfer with `void_pending_transfer`, the original `pending_id`, and zero amount.
- TigerBeetle account and transfer IDs are non-zero 128-bit unsigned `bigint` values derived with SHA-256 domain separation. Tenant ownership is independently committed in `user_data_128` and checked on every lookup and transition.
- Public decimal amounts are accepted only when exactly representable in the currency's configured minor units. Conversion to and from TigerBeetle uses `bigint`; unsafe `number` ranges fail closed.
- Transfer idempotency IDs are deterministic per tenant. TigerBeetle `exists` is treated as a successful concurrent retry only for the identical transfer.
- Relational projections use bounded cursor batches and tenant-specific cursors. No API may imply that an empty unsupported TigerBeetle listing means the tenant has no accounts.
- Webhook receipt first acquires an atomic tenant/key database claim. Processing workers use owner-token Redis leases (`SET NX EX`) where needed; release is compare-and-delete. Transaction and settlement writes retain tenant-qualified unique keys/upserts.

## Consequences

- The deployment operates two data systems and must monitor cursor lag and parity.
- Unsupported TigerBeetle query shapes require a relational index rather than full scans.
- A stated 100,000+ TPS goal requires reproducible workload, durability, and failure-injection benchmarks before it is a release claim.

## Verification

- `packages/api/src/infrastructure/repositories/__tests__/tigerbeetle-state-machine.test.ts`
- webhook concurrency tests with simultaneous duplicate delivery
- TigerBeetle integration tests when the local container is available
