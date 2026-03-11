# Settler Differentiators (Code-Referenced)

## Deterministic replay

- Replay pipeline tooling: `scripts/settler-replay.ts`.
- Replay verification helpers: `scripts/reconciliation-run-tools.mjs`.
- Determinism validation utility: `scripts/validate-determinism.js`.

## Truth exploration

- Trust and reconciliation contract routes: `packages/api/src/routes/v1/reconciliation-trust-contract.ts`.
- Evidence retrieval surfaces in demo artifacts: `examples/demo-output/evidence.json` produced by demo flows.

## Policy simulation

- Simulation endpoint surface: `packages/api/src/routes/v1/pricing/simulator.ts`.
- Policy-aware operator surfaces: `packages/api/src/routes/v1/operator-mode.ts`.

## Operator telemetry

- Alerts pipeline: `packages/api/src/routes/alerts.ts`.
- Metrics and observability endpoints: `packages/api/src/routes/metrics.ts`, `packages/api/src/routes/observability.ts`.

## Synthetic reconciliation foundry

- CLI foundry runtime: `packages/cli/src/index.ts` (`foundry reconciliation-generate`, `foundry reconciliation-verify`).
- Harness and benchmark tooling: `packages/cli/src/tools/reconciliation-harness.ts`, `packages/cli/src/tools/benchmark-reconciliation.ts`.

## Live reconciliation stream

- Realtime/event route surfaces: `packages/api/src/routes/realtime.ts`, `packages/api/src/routes/reconciliation-status.ts`.
- Runtime telemetry and status for operators is exposed through alerts/metrics and UI dashboard pages.
