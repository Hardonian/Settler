# Settler Reconciliation Test Data Foundry

Deterministic synthetic reconciliation data suite for validating real matching mechanics across messy multi-source finance workflows.

## Source systems modeled

- BANK_STATEMENT
- PAYMENT_PROCESSOR
- INTERNAL_LEDGER
- BILLING_SYSTEM
- INVOICE_SYSTEM
- PAYOUT_REPORT
- REFUND_DISPUTE_EVENTS
- FX_RATE_TABLE

## Scenario packs

1. HAPPY_PATH
2. TIMING_MISMATCHES
3. FEES_NET_VS_GROSS
4. REFUNDS_REVERSALS
5. DISPUTES_CHARGEBACKS
6. DUPLICATES_NEAR_DUPLICATES
7. SPLIT_MERGED_MATCHING
8. FX_CURRENCY
9. MISSING_BROKEN_REFERENCES
10. STATUS_MISMATCHES
11. EDGE_CASE_SWAMP

Each generated run exports:

- source raw datasets (`*.json`, `*.csv`)
- scenario manifest (`scenarios.json`)
- reconciliation golden truth (`golden.json`)
- expected result matrix (`expected_results.json`)
- generation manifest (`manifest.json`)
- deterministic integrity hash (`integrity.sha256`)

## Commands

- `pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --seed 42 --profile smoke --output test-data/exports/smoke-seed42`
- `pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-generate --seed 42 --profile chaos --output test-data/exports/chaos-seed42`
- `pnpm --filter @settler/cli exec tsx src/index.ts foundry reconciliation-verify --seed 42 --profile smoke`

## Profiles

- `smoke`: ~100 records per core stream
- `integration`: ~5,000 records per core stream
- `load`: ~50,000 records per core stream
- `chaos`: ~10,000 records per core stream with heavy adverse cases

## Expected outcomes / match classes

- exact_match
- fuzzy_match
- grouped_match
- duplicate_detected
- timing_variance
- fx_variance
- fee_variance
- status_conflict
- manual_review
- unmatched_source_only (reserved for future unresolved orphan generation)
- unmatched_target_only (reserved for future unresolved orphan generation)

## Extending the suite

1. Add/modify scenario logic in `packages/cli/src/lib/reconciliation-foundry.ts`.
2. Add assertions in `packages/cli/src/__tests__/reconciliation-foundry.test.ts`.
3. Re-generate exports with a fixed seed and store representative fixtures under `test-data/fixtures/`.
4. Update `test-data/docs/reconciliation-scenario-matrix.md`.

## Current modeling gaps

- No real parser round-trip for external third-party raw files beyond generated CSV/JSON.
- Dispute lifecycle is represented, but representment timeline states are simplified.
- Grouped matching expectations are generated as labels, not yet asserted against API engine grouped-match endpoint behavior.
