# Demo Walkthrough

**Last Updated:** 2026-03-18  
**Purpose:** Step-by-step guide to running the demo and verifying seeded data.

---

## Overview

Settler includes demo data generation that simulates realistic Stripe ↔ Bank reconciliation scenarios. This walkthrough shows how to:

1. Seed the database with demo data
2. Verify the seeded state
3. Run reconciliation
4. Explore the results

---

## Prerequisites

Before starting, ensure:

- Node.js 24.x installed
- pnpm installed
- Docker running (for TigerBeetle/Postgres)
- Completed `pnpm run bootstrap`

---

## Step 1: Bootstrap the Project

```bash
cd settler
pnpm run bootstrap
```

This creates `.env.local` and installs dependencies.

---

## Step 2: Start Local Infrastructure

```bash
pnpm tb:start
```

Starts:

- PostgreSQL on port 5432
- TigerBeetle on port 4300

Verify services:

```bash
pnpm tb:status
```

---

## Step 3: Seed Demo Data

### Option A: Quick Seed

```bash
pnpm demo:seed
```

Creates demo transactions:

- 50 Stripe charges
- 5 payouts
- Corresponding bank deposits
- Bank fees

### Option B: Full Demo Setup

```bash
pnpm demo:setup
```

### Option C: Reset and Seed

```bash
pnpm demo:seed:reset
```

Clears existing data and regenerates.

---

## Step 4: Verify Seeded State

### Check via Doctor

```bash
pnpm run doctor
```

Look for:

```
✓ database: Seed Data - Data present
```

### Check via API

```bash
# After starting dev server
curl http://localhost:4000/api/health
```

### View in Console

```bash
pnpm dev
# Navigate to http://localhost:3000
```

Check:

- `/console/transactions` — View seeded transactions
- `/console/reconciliation` — View reconciliation runs
- `/console/review` — View manual review queue

---

## Step 5: Run Reconciliation

### Via Console

1. Navigate to `/console/reconciliation`
2. Click "New Run"
3. Select sources: Stripe, Bank
4. Configure tolerance: 1%
5. Click "Run"

### Via API

```bash
curl -X POST http://localhost:4000/api/reconciliation/run \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["stripe", "bank"],
    "tolerance": 0.01
  }'
```

---

## Step 6: Review Results

### Expected Outcomes

The demo data produces:

- **Matched transactions:** ~40 (exact matches within tolerance)
- **Mismatched transactions:** ~5 (amount differences >1%)
- **Unmatched:** ~5 (no corresponding record)

### Check Results

1. Navigate to `/console/reconciliation/results`
2. Review match distribution
3. Click individual transactions for evidence

---

## Demo Data Structure

The seed script generates:

### Stripe Charges

```json
{
  "id": "ch_...",
  "externalId": "ch_abc123",
  "amount": 99.0,
  "fee": 3.2,
  "currency": "USD",
  "status": "succeeded",
  "created": "2026-03-15T10:30:00Z"
}
```

### Bank Deposits

```json
{
  "id": "txn_...",
  "externalId": "txn_xyz789",
  "amount": 95.8,
  "type": "credit",
  "date": "2026-03-16T09:00:00Z"
}
```

### Expected Matches

- Stripe charge → Bank deposit (amount - fee within tolerance)
- Payout → Bank deposit (total payout amount)

---

## Customizing Demo Data

### Change Seed Value

```bash
DEMO_SEED=123 pnpm demo:seed
```

### Change Transaction Count

Edit `scripts/generate-demo-data.ts`:

```typescript
const TRANSACTION_COUNT = 100; // Default: 50
```

---

## Verification Checklist

| Step        | Command              | Success Indicator       |
| ----------- | -------------------- | ----------------------- |
| Bootstrap   | `pnpm run bootstrap` | Exit 0, no errors       |
| Start infra | `pnpm tb:status`     | "OK" status             |
| Seed data   | `pnpm demo:seed`     | "Seeding complete"      |
| Check seed  | `pnpm run doctor`    | "Seed Data: OK"         |
| Start app   | `pnpm dev`           | :3000, :4000 accessible |
| Run recon   | Console or API       | Results generated       |

---

## Troubleshooting

### "No seed data found"

```bash
pnpm demo:seed
```

### "Database connection failed"

```bash
pnpm tb:start
```

### "Transactions not appearing"

Check database:

```bash
pnpm db:check
```

---

## Related Documentation

- [What Works Today](./WHAT_WORKS.md)
- [Verification Commands](../VERIFICATION_COMMANDS.md)
- [Troubleshooting](../troubleshooting/)
