# Evidence Bundles

Settler Engine writes an evidence bundle to `output/evidence/` for audit-safe, deterministic record keeping. The bundle is OSS-first and locally generated.

## Contents

- `manifest.json` — hashes of inputs and outputs
- `normalized.jsonl` — normalized records
- `variances.jsonl` — discrepancy items
- `logs/run.log` — deterministic run summary

## Manifest fields

The manifest captures:

- `schema_version`
- `tool_version`
- `generated_at` (deterministic timestamp)
- Input file hashes
- Output file hashes

## Handling guidance

- Store evidence bundles alongside the exact input files and ruleset.
- Use the manifest to validate hash integrity when sharing bundles.
- Evidence bundles surface discrepancies; they do not guarantee correctness or compliance.

