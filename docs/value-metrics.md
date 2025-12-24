# Value Metrics

**Last Updated:** 2025-12-24  
**Purpose:** Document what is measured, why it matters, and how it's computed

## Measured Outcomes

### 1. Reconciliations Completed
- **What**: Count of successful reconciliation runs
- **Why**: Core product value - each reconciliation saves manual work
- **How**: Recorded when `ReconciliationRun` completes with status 'completed'
- **Estimate**: ~5 minutes saved per reconciliation (conservative)

### 2. Receipts Processed
- **What**: Count of receipts successfully parsed
- **Why**: Demonstrates API usage and automation value
- **How**: Recorded when `Receipt` is created from `ReceiptUpload`
- **Estimate**: ~2 minutes saved per receipt

### 3. Exports Generated
- **What**: Count of exports created (CSV, JSON, Excel)
- **Why**: Shows users are getting value from reconciled data
- **How**: Recorded when `Export` status changes to 'completed'

### 4. Exceptions Resolved
- **What**: Count of unmatched transactions that were reviewed/resolved
- **Why**: Shows Settler is catching real issues
- **How**: Recorded when `ReconciliationMatch` is marked as reviewed

### 5. Time Saved (Hours)
- **What**: Estimated hours saved through automation
- **Why**: Tangible ROI metric for users and investors
- **How**: Computed from reconciliations (5 min each) + receipts (2 min each)
- **Formula**: `(reconciliations × 5 + receipts × 2) / 60`

### 6. Dollars Reconciled
- **What**: Total dollar amount processed through reconciliations
- **Why**: Shows scale and financial impact
- **How**: Sum of `totalAmountMatched` from `ReconResult` records

### 7. Errors Prevented
- **What**: Count of mismatches caught (potential accounting errors)
- **Why**: Demonstrates Settler prevents costly mistakes
- **How**: Count of `ReconciliationMatch` with `matchType = 'unmatched'` and high confidence

## Implementation

### Database Tables
- `value_ledger`: Raw events (one row per event)
- `value_ledger_daily`: Daily aggregates for fast queries

### Recording Events
Events are recorded server-side from:
- `packages/web/src/lib/value-ledger/index.ts` - Core recording functions
- Reconciliation completion hooks
- Receipt processing hooks
- Export generation hooks

### Querying Metrics
Use `getValueMetrics(billingAccountId, period)` to get:
- Last 7 days
- Last 30 days
- Lifetime totals

## Zero-State Handling

New users see:
- All metrics at 0
- Friendly message: "Start using Settler to see your value metrics"
- No errors or broken UI

## Investor Narrative

Value metrics answer:
1. **"Do users get value?"** → Time saved, dollars reconciled
2. **"Is it sticky?"** → Reconciliations completed over time
3. **"What's the ROI?"** → Time saved × hourly rate vs. subscription cost
4. **"Does it scale?"** → Dollars reconciled growth

## Retention Driver

Users see their value metrics in console:
- "You've saved 24 hours this month"
- "You've reconciled $1.2M this quarter"
- "You've processed 500 receipts"

This creates:
- **Proof of value**: Tangible numbers, not promises
- **Switching cost**: "We've reconciled $X with Settler"
- **Upgrade pressure**: "You're hitting limits, upgrade to process more"
