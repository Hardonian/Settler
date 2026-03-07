# We open sourced Settler: deterministic reconciliation with proof + replay

Hi r/programming,

We open sourced Settler, a workflow system focused on one thing: deterministic reconciliation runs that can be replayed and verified later.

## Why this exists

In many systems, reconciliation logic evolves through cron jobs and one-off SQL. When output changes unexpectedly, root-cause analysis is expensive because run context is incomplete.

Settler's core model is:

1. deterministic execution
2. policy checks in the run path
3. proof artifact generation
4. replay verification

## What you can run today

```bash
pnpm install
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

The demo generates:

- `examples/demo-output/run.json`
- `examples/demo-output/results.json`
- `examples/demo-output/evidence.json`
- `examples/demo-output/report.html`

## Useful entry points

- `ARCHITECTURE.md`
- `docs/launch/QUICK_START.md`
- `docs/launch/EXAMPLE_WORKFLOWS.md`
- `CONTRIBUTING.md`

If you build data/recon pipelines, we'd appreciate feedback on the determinism + replay model and where it breaks down.
