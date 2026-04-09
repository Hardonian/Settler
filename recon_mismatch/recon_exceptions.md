# Reconciliation Exceptions Report

**Run ID:** recon_20260201_005426_a89ece6e
**Completed:** 2026-02-01T00:54:26.857956
**Match Rate:** 50.00%

## Summary

- Total Source Records: 2
- Total Target Records: 2
- Matched: 1
- Mismatched: 0
- Source Orphans: 1
- Target Orphans: 1

## Invariant Violations

### 🟡 no_orphaned_transactions (high)

**Message:** Found 1 source orphans and 1 target orphans

**Details:**

```json
{
  "orphaned_sources": ["stripe_m1"],
  "orphaned_targets": ["shopify_m1"]
}
```

**Remediation:** Review unmatched transactions for data quality issues

## Detailed Exceptions

### Source Orphans

These source records had no matching target:

- `stripe_m1`: No target records found with key: pi_mismatch_demo|100.0

### Target Orphans

These target records had no matching source:

- `shopify_m1`: No source records found with key: pi_mismatch_demo|99.99
