# Launch Quick Start (Developer First)

This quick start is optimized for first-run verification in under 10 minutes.

## What you will do

1. Run a deterministic reconciliation workflow.
2. Inspect generated outputs and proof artifacts.
3. Replay the run and verify the fingerprint.

## Prerequisites

- Node.js `>=22` (Node 24 recommended)
- pnpm `>=10.13.1`

## 1) Install dependencies

```bash
pnpm install
```

## 2) Execute the example workflow

```bash
pnpm demo
```

The command runs `scripts/settler-demo.ts` and writes artifacts to `examples/demo-output`.

## 3) Inspect generated outputs

```bash
cat examples/demo-output/run.json
cat examples/demo-output/results.json
cat examples/demo-output/evidence.json
```

You should see:

- workflow input payload (`run.json`)
- deterministic reconciliation outcome (`results.json`)
- proof artifact with fingerprints and policy context (`evidence.json`)

## 4) Replay verification

```bash
pnpm settler:replay examples/demo-output/evidence.json
```

Expected terminal signal includes:

- fingerprint comparison
- `matches: true`

## 5) Optional: open HTML report

```bash
python3 -m http.server 4173 --directory examples/demo-output
```

Then visit `http://localhost:4173/report.html`.

## Example connector + workflow references

- Example workflow source: `scripts/settler-demo.ts`
- Connector implementation surface: `packages/adapters/src/drivers/stripe-connect.ts`
- Replay implementation: `scripts/settler-replay.ts`

## Troubleshooting

- If `pnpm demo` fails, run:
  ```bash
  pnpm install --frozen-lockfile
  ```
- If replay fails with fingerprint mismatch, regenerate demo artifacts and replay again:
  ```bash
  pnpm demo && pnpm settler:replay examples/demo-output/evidence.json
  ```
