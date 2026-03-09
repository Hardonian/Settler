# TEST DATA FOUNDRY

Settler ships a deterministic synthetic reconciliation data harness that validates matcher behavior under realistic financial conditions.

## Profiles

- smoke: 100 processor + 100 bank records
- integration: 5,000 processor + 5,000 bank records
- load: 50,000 processor + 50,000 bank records
- chaos: 10,000 records with aggressive edge cases and orphans

## Commands

- `pnpm run generate:test-data:smoke`
- `pnpm run generate:test-data:chaos`
- `pnpm run verify:test-data`
- `pnpm run test:reconciliation`
- `pnpm run benchmark:reconciliation`

## Scenarios

The suite covers:

- happy-path exact settlement
- auth/capture/settlement timing offsets
- net-vs-gross/fee withholding
- refunds and reversals
- disputes and dispute fees
- duplicate webhook/export events
- split/merged payouts
- FX drift and rounding
- missing/broken references
- status conflicts
- malformed-row and edge-case swamp records

## Expected outcomes

Each dataset export contains:

- `golden.json` (summary + per transaction class)
- `expected_results.json` (machine-readable assertion matrix)
- source exports in CSV and JSON
- malformed CSV fixture (`malformed_processor_row.csv`) for parser resilience

## Engine gaps currently exposed

Current matcher is still mostly transaction-level and one-to-one. Grouped payouts, dispute lifecycle semantics, and some variance classes are represented in truth data but not fully surfaced by matcher output categories yet.
