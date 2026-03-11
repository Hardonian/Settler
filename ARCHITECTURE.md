# Settler Architecture

This document summarizes the top-level architecture and links to focused diagrams in `docs/architecture`.

## System architecture

Settler is composed of three primary layers:

1. **Ingestion + API layer** (`packages/api`): receives imports, operator actions, and policy requests.
2. **Deterministic execution layer** (`packages/cli`, runtime scripts): executes reconciliation and produces replayable evidence.
3. **Operator control layer** (`packages/web` + telemetry routes): surfaces runs, alerts, proofs, and health data.

## Invariants

- Reconciliation runs must be replayable with deterministic outputs.
- Operator-visible state must degrade gracefully (no hard 500 paths in normal user flows).
- Tenant context is explicit across route handling and execution boundaries.
- Evidence artifacts are addressable by run metadata.

## Diagram index

- `docs/architecture/system-architecture.md`
- `docs/architecture/data-flow.md`
- `docs/architecture/reconciliation-pipeline.md`
- `docs/architecture/event-telemetry-pipeline.md`
- `docs/architecture/operator-control-plane.md`

## Runtime surfaces

- Reconciliation and replay tooling: `scripts/settler-demo-pipeline.mjs`, `scripts/settler-replay.ts`.
- API v1 surface and modules: `packages/api/src/routes/v1`.
- Operator telemetry routes: `packages/api/src/routes/alerts.ts`, `packages/api/src/routes/metrics.ts`, `packages/api/src/routes/observability.ts`.
