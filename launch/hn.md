# Show HN: Settler — deterministic reconciliation workflows with replayable proof artifacts

Hi HN — we open-sourced Settler to make reconciliation workflows reproducible and auditable.

## What it does

- Runs deterministic reconciliation workflows.
- Emits proof artifacts (`run.json`, `results.json`, `evidence.json`, `report.html`) for each run.
- Replays from evidence and verifies fingerprint matches.

## Why we built it

Most teams end up with ad-hoc recon scripts that are hard to debug after the fact. When outcomes change between runs, it is difficult to prove whether data changed, policy changed, or execution changed.

Settler is opinionated around deterministic execution + replay so failure analysis is concrete instead of forensic guesswork.

## How to try it locally

```bash
pnpm install
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

## Repo references

- Architecture: `ARCHITECTURE.md`
- Quick start: `docs/launch/QUICK_START.md`
- Example workflows: `docs/launch/EXAMPLE_WORKFLOWS.md`

Feedback request: if your team has reconciliation pain points, where does deterministic replay help most (incident response, audits, or regression testing)?
