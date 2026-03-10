# Settler Engine Policy / Tolerance Lab

## Explicit policy surface (v2)

Each reconciliation run now persists `policy_context` with a deterministic policy hash and snapshot that includes:

- match precedence and conflict resolution (`first-match` / `best-score`)
- amount/date/fee tolerances
- FX variance tolerance (bps)
- status compatibility matrix
- duplicate detection thresholds (window, amount, reference similarity)
- grouped split/merge controls
- manual review thresholds
- enabled rule ids

Run outputs also include `rule_metrics` so operators can inspect per-rule evaluations, matches, misses, and selection counts.

## Simulation lab

Use read-only simulation to replay historical input with candidate policy overrides:

```bash
go run . --input fixtures/input/engine_input.json --simulate \
  --override-amount-tolerance-cents 0 \
  --override-fee-tolerance-cents 2 \
  --override-fx-tolerance-bps 10 \
  --override-conflict-resolution best-score
```

Simulation returns baseline/candidate results and diff metrics:

- match count delta
- variance total delta
- manual review delta
- grouped-match delta
- newly introduced variance ids
- resolved variance ids
- changed variance type ids

Simulation artifacts are persisted to `output_dir/evidence/simulation-<baseline>-<candidate>.json` for auditability.

## Explainability

Variances include structured `policy_trace` statements sourced from runtime logic (for example tolerance exceedance, status compatibility matrix rejection, duplicate threshold trigger, grouped mismatch trigger).

## Backward compatibility

`LoadEngineOutputWithMigration(...)` backfills policy/rule-metric defaults for legacy `engine_output.json` files that predate `policy_context`.

## Current boundaries

- Grouped logic is key-based (`group_key`) and deterministic, but not yet graph-optimized for very large multi-leg cascades.
- Duplicate detection is deterministic thresholding, not probabilistic scoring.
- FX variance checks rely on optional `fx_rate` inputs; no external rate source is consulted in OSS mode.
