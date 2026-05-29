# Venture Invoice Nudger (Settler)

## Purpose

The Venture Invoice Nudger is a reconciliation-aware workflow that identifies overdue invoices, suppresses likely false nudges based on payment/reconciliation signals, and creates a durable decision trail for operator review.

## API Endpoints

### 1) Run nudger

`POST /api/v1/venture/invoice-nudger/run`

Request body:

```json
{
  "minDaysOverdue": 7,
  "maxInvoices": 200,
  "lookbackDays": 14,
  "execute": false
}
```

- `execute=false`: dry-run recommendation mode (`recommend_nudge`)
- `execute=true`: execution mode (`queue_nudge` decisions are persisted)

### 2) List runs

`GET /api/v1/venture/invoice-nudger/runs?limit=20`

### 3) Get run details

`GET /api/v1/venture/invoice-nudger/runs/:runId`

## Decision Logic

For each overdue invoice candidate:

1. Confirm invoice is still unpaid and overdue (`financial_invoices`)
2. Scan recent transaction evidence (`financial_transactions`) for likely payment signals:
   - invoice external ID
   - invoice number
   - customer name hints
   - amount match (+/-)
3. Check reconciliation activity (`reconciliation_runs`) for context.
4. Produce action:
   - `suppress` if payment signal detected
   - `recommend_nudge` in dry-run mode
   - `queue_nudge` in execute mode

## Data Model

Migration: `supabase/migrations/20260410053000_venture_invoice_nudger.sql`

- `venture_invoice_nudge_runs`
- `venture_invoice_nudge_items`

Both tables are tenant-scoped and protected with RLS tenant isolation policies.

## Rollout Plan

1. Enable dry-run mode for pilot tenants
2. Compare recommendations against manual collections actions
3. Tune lookback and amount matching thresholds
4. Enable execute mode + delivery channel integration

## Safety Notes

- Tenant isolation is enforced via tenant-scoped queries and RLS
- No external messaging is sent by this module yet (decisioning + persistence only)
- This avoids accidental customer-facing communication before approval workflows
