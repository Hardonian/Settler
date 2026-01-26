# Settler Engine QUICKSTART (≤10 minutes)

Settler Engine is an OSS-first, deterministic reconciliation tool that **surfaces discrepancies** from local files. It does not provide compliance or correctness guarantees.

## 1) Build the binary

```bash
cd tools/settler-engine
go build -o bin/settler-engine
```

## 2) Prepare a run pack

Create a run pack zip in the web UI:

- Navigate to `/engine/create-run-pack`
- Upload synthetic input files (CSV or JSON)
- Download the run pack

The zip contains:

- `inputs/` (your files)
- `ruleset.json`
- `mapping.json` (optional)
- `engine_input.json`
- `README.txt`

## 3) Run the engine locally

```bash
./tools/settler-engine/bin/settler-engine --input /path/to/engine_input.json
```

Outputs are written to the `output_dir` configured in `engine_input.json`:

- `output/engine_output.json`
- `output/evidence/manifest.json`
- `output/evidence/normalized.jsonl`
- `output/evidence/variances.jsonl`
- `output/evidence/logs/`

## 4) Import results into the UI

- Navigate to `/engine/import-results`
- Upload `engine_output.json`
- (Optional) upload the evidence bundle zip
- Review variance summaries and hashes

## Local-only notes

- No telemetry.
- No network calls.
- Deterministic sorting, rounding, and timezone handling.

