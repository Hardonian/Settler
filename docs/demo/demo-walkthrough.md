# Demo Walkthrough (Deterministic Operator Flow)

## CLI + artifact validation

1. `pnpm run bootstrap`
2. `pnpm run demo`
3. Inspect `examples/demo-output/evidence.json` for proof envelope and evidence metadata.
4. Inspect `examples/demo-output/run.json` for execution metadata.
5. Replay evidence: `pnpm exec tsx scripts/settler-replay.ts examples/demo-output/evidence.json`

## In-product operator story

1. Open `/app` (**Control Plane**) for workflow entrypoints.
2. Open `/app/runs` and select a run from **Run Explorer**.
3. From run detail, inspect deterministic replay status and evidence summary.
4. Open `/app/proofs` (**Truth Explorer**) for proof-chain and lineage investigation.
5. Open `/app/evidence` (**Evidence Query Surface**) and verify retrieval modes (run id, fingerprint, policy hash).
6. Open `/app/alerts` (**Live Alerts**) for incident context.
7. Open `/app/replay` (**Replay Lab**) to re-run deterministic checks.
8. Open `/app/settings` (**Tenant Isolation Controls**) to inspect boundary and governance controls.
9. Open `/app/metrics` (**Runtime Event Signals**) for event-derived telemetry.

## Route integrity

- Optional UI verification: `pnpm run verify:routes`
