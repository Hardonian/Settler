# Determinism & Replay Contract

Settler preserves existing run-fingerprint semantics by composing existing stable hashing utilities from `scripts/reconciliation-control-plane.mjs`.

`run_fingerprint` is computed from:

1. `input_hash`
2. `config_hash`
3. `engine_version`

Replay contract:

- load `evidence.json`
- load `run.json` inputs/config
- execute via `executeWithPolicy`
- assert replay `run_fingerprint` equals original

CI hooks:

- `pnpm verify:policy`
- `pnpm settler:replay examples/demo-output-fixtures/demo-run-1/evidence.json`
