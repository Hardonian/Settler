# Reconciliation Synthetic Runtime Validation

## True Engine Entrypoint

Synthetic reconciliation validation now executes the production runtime matcher path:

- `ReconCoreEngine.performReconciliation(...)`
- Source: `packages/api/src/services/recon-core/recon-core-engine.ts`

The CLI synthetic harness invokes this entrypoint from `packages/cli/src/lib/reconciliation-foundry.ts` via `runSyntheticEngineValidationRuntime`.

## Commands

- `pnpm run test:reconciliation:e2e`
- `pnpm run test:reconciliation:goldens`
- `pnpm run verify:reconciliation-runtime`

## Runtime Assertions

The suite now verifies runtime outputs rather than the previous simplified txn-key+tolerance helper:

- runtime engine path identifier (`recon_core.performReconciliation`)
- match/unmatched counts based on runtime match output
- per-transaction classifications
- grouped, dispute, reversal, duplicate, variance, and manual-review class presence
- expected-vs-actual classification diff artifact (`engine_validation_diff.json`)

## Current Narrow Gaps

1. `ReconCoreEngine.performReconciliation` currently emits confidence + metadata but no first-class classification enum.
   - The harness maps runtime match/non-match plus canonical scenario metadata into class labels.
2. Group linkage IDs / explicit many-leg graph metadata are not yet emitted by `ReconMatch`.
3. Manual-review rationale is inferred from synthetic scenario metadata because runtime `ReconMatch` lacks dedicated manual-review fields.

These gaps are explicit and localized to runtime output shape and can be closed by extending `ReconMatch`/summary types.
