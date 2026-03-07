# Launch Example Workflows

This document includes reproducible examples with source workflow, expected output, proof artifact, and replay instructions.

## Example 1 — Financial reconciliation (Stripe ↔ QuickBooks)

### Source workflow

- Entrypoint: `scripts/settler-demo.ts`
- Inputs: `stripe` and `quickbooks` arrays seeded by the demo script
- Matching rule: composite match on `invoice_number` + `amount` with 1% tolerance

### Run command

```bash
pnpm demo
```

### Expected output

File: `examples/demo-output/results.json`

Expected summary:

- `output.matches = 2`
- `output.mismatches = 0`
- `output.reviewQueue = 0`

### Generated proof artifact

File: `examples/demo-output/evidence.json`

Fields to validate:

- `run_id = "demo-run-1"`
- `policy_id = "demo.strict"`
- `run_fingerprint` is present
- `provenance.hash_chain` is non-empty

### Replay instructions

```bash
pnpm settler:replay examples/demo-output/evidence.json
```

Expected terminal result: `Replay Verified: OK`.

---

## Example 2 — Replay verification from frozen fixture

### Source workflow

- Fixture: `examples/demo-output-fixtures/demo-run-1/evidence.json`
- Purpose: deterministic replay smoke independent of newly generated output

### Run command

```bash
pnpm settler:replay examples/demo-output-fixtures/demo-run-1/evidence.json
```

### Expected output

- Replay command exits successfully.
- Fingerprint match is true.

### Generated proof artifact

- Existing fixture already includes `run.json`, `results.json`, and `evidence.json`.
- Useful for CI and regression checks when validating replay behavior.

### Replay instructions

The run command above is the replay instruction. Use this in CI or pre-release checks.

---

## Example connector reference

If you want to extend data ingestion from this demo path, start with:

- `packages/adapters/src/drivers/stripe-connect.ts`
- `packages/adapters/src/drivers/netsuite.ts`

Connector contributions should preserve deterministic normalization and include tests.
