# API Reference (Code-Aligned)

This reference documents major API surfaces backed by route modules in `packages/api/src/routes`.

## Reconciliation endpoints

Primary modules:

- `packages/api/src/routes/v1/reconciliation.ts`
- `packages/api/src/routes/v1/recon/jobs.ts`
- `packages/api/src/routes/v1/recon/results.ts`
- `packages/api/src/routes/reconciliation-summary.ts`

Typical surfaces include reconciliation execution, job lifecycle, and result retrieval under `/api/v1/recon/*` and `/api/v1/reconciliation/*`.

Canonical read contract, merged pagination, and collision behavior are documented in:

- `docs/architecture/reconciliation-read-contract.md`
- `docs/ops/reconciliation-uuid-collision-runbook.md`

## Operator intelligence endpoints

Primary module:

- `packages/api/src/routes/v1/operator-intelligence.ts`

Related telemetry/ops routes:

- `packages/api/src/routes/alerts.ts`
- `packages/api/src/routes/metrics.ts`
- `packages/api/src/routes/observability.ts`

These power operator-facing insights, alerts, and runtime health/metrics views.

## Policy simulation endpoints

Primary module:

- `packages/api/src/routes/v1/pricing/simulator.ts`

Related control/policy-adjacent modules:

- `packages/api/src/routes/v1/operator-mode.ts`
- `packages/api/src/routes/v1/reconciliation-trust-contract.ts`

## Replay endpoints

Replay is exposed through run/reconciliation surfaces and replay tooling:

- `scripts/settler-replay.ts`
- `scripts/reconciliation-run-tools.mjs`
- web replay screen integration under `packages/web` routes.

## Import endpoints

Primary modules:

- `packages/api/src/routes/v1/ingestion.ts`
- `packages/api/src/routes/v1/ingestion-exports.ts`
- `packages/api/src/routes/v1/exports.ts`

These routes cover ingestion pipeline operations, import preview/export, and file-driven reconciliation data flows.

## Discoverability and verification

For broader route inventory and coverage mapping:

- `docs/api/route-inventory.md`
- `docs/api/route-registry.md`
- `docs/api/route-inventory.json`
