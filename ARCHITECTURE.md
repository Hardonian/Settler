# Settler Architecture Overview

Settler is an Open Source Reconciliation Engine with a simple surface and a deterministic core.

## System shape

- **Web surface (`packages/web`)**: Dashboard, docs, and demo UX.
- **API surface (`packages/api` + `packages/web/src/app/api`)**: Run creation, run listing, metrics, and evidence access.
- **Engine + runner (`runner`, `scripts/moat`)**: Deterministic run execution and replay verification.
- **Storage (Postgres/Supabase via Prisma)**: Tenant-scoped run state and metrics.

## Runtime flow

1. Operator or integration starts a run.
2. Engine processes normalized records deterministically.
3. Rule checks/policies shape routing and status.
4. Results + evidence are persisted.
5. Replay verifies fingerprints for provable outcomes.

## Deep dive

For detailed internals (deterministic replay, content-addressed evidence, policy engine, run storage, and execution model), read [`docs/ENGINE.md`](docs/ENGINE.md).
