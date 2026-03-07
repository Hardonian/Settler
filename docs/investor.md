# Investor Truth Anchors

## What Settler is

Settler is a deterministic reconciliation engine that emits replay-verifiable evidence on every run.

## Provably true today

- Policy-as-code compiler and runtime enforcement path exists in-repo.
- Economic units (compute, memory, CAS IO, replay calls) are metered on each run.
- Demo emits evidence bundle and static report.
- Replay re-executes from artifacts and verifies identical fingerprint.

## Proof links

- Demo command: `pnpm demo`
- Evidence output: `examples/demo-output/evidence.json`
- Replay fixture: `examples/demo-output-fixtures/demo-run-1/evidence.json`
- Policy guard verification: `pnpm verify:policy`

## Roadmap

- Cloud billing integration is roadmap-only; current repo exposes metering primitives and hard budget enforcement.
