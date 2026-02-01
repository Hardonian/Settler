# Reconciliation Truth & Proof Engine

A deterministic, auditable reconciliation system for Settler that produces explainable matches and complete audit trails.

## Core Principles

1. **No Silent Matches** - Every match must be explicitly explainable
2. **Every Reconciliation Must Be Explainable** - Complete traceability from inputs to outputs
3. **Preserve Existing Data Semantics** - Don't change meaning of source data
4. **All Outputs Must Be Reproducible** - Same inputs always produce same outputs

## Artifacts Produced

- `recon_run.json` - Complete inputs, outputs, and metadata
- `recon_truth_table.csv` - Row-by-row truth table of all comparisons
- `recon_exceptions.md` - Human-readable exception report
- `policy_violations.json` - Invariant violations with severity

## Usage

```python
from reconciliation_engine import ReconciliationEngine

engine = ReconciliationEngine(
    source_records=stripe_data,
    target_records=shopify_data,
    match_keys=["external_id", "amount", "date"],
    options={
        "amount_tolerance": 0.01,
        "fuzzy_rules": ["date_within_1_day"],
    }
)

result = engine.reconcile()
engine.emit_audit_bundle("./audit_output/")
```

## Invariants

- **totals_must_balance**: Sum of source amounts must equal sum of target amounts (within tolerance)
- **currency_consistency**: All records in a reconciliation must use the same currency
- **no_orphaned_transactions**: Every transaction must have at least one match candidate
- **no_duplicate_settlement**: No transaction may be matched more than once

## Exit Codes

- `0`: Success, no invariant violations
- `1`: Success with warnings (HIGH severity violations)
- `2`: BLOCKER violations - CI should fail
