# Demo Setup Guide

**Last Updated:** 2026-03-18  
**Purpose:** Complete reference for Settler's demo and seed data infrastructure.

---

## Overview

Settler provides multiple data sources for demo, testing, and development purposes:

1. **Demo Data** - Interactive playground data (Stripe ↔ Bank reconciliation)
2. **Pilot Data** - CSV files for first-tenant validation
3. **Test Data** - Pre-generated golden datasets for verification

---

## Demo Data (Interactive Playground)

### What It Is

Demo data generates realistic Stripe ↔ Bank reconciliation scenarios for the interactive playground. This is used when you access `/console/playground` or call playground API endpoints.

### Generation Commands

```bash
# Quick seed (generates JSON files)
pnpm demo:seed

# Full demo setup
pnpm demo:setup

# Reset and regenerate
pnpm demo:seed:reset
```

### Output Location

Generated files are placed in `demo/data/`:

| File                            | Description                | Records                |
| ------------------------------- | -------------------------- | ---------------------- |
| `demo_stripe_transactions.json` | Stripe charges and payouts | ~20 charges + payouts  |
| `demo_bank_transactions.json`   | Bank deposits and fees     | Transfers + fees       |
| `demo_expected_matches.json`    | Expected match mappings    | Per payout             |
| `stripe_normalized.json`        | Normalized Stripe records  | 50 charges + 5 payouts |
| `bank_normalized.json`          | Normalized Bank records    | 5 deposits + fees      |
| `expected_matches.json`         | Expected match mappings    | 5 payout matches       |

### Seed Customization

```bash
# Change seed for deterministic data
DEMO_SEED=123 pnpm demo:seed

# Edit transaction count in scripts/generate-demo-data.ts
const TRANSACTION_COUNT = 100; // Default: 50
```

---

## Pilot Data (CSV Files)

### What It Is

CSV files for testing data import workflows and first-tenant validation scenarios.

### Files

| File                                   | Purpose                       |
| -------------------------------------- | ----------------------------- |
| `pilot-data/payments.csv`              | Baseline payment events       |
| `pilot-data/refunds.csv`               | Refund flow scenarios         |
| `pilot-data/settlements.csv`           | Settlement events             |
| `pilot-data/discrepancy-scenarios.csv` | Controlled mismatch scenarios |

### Usage

```bash
# Import via CLI (when import command available)
pnpm settler import --source pilot-data/payments.csv --type payments
```

---

## Test Data (Verification)

### What It Is

Pre-generated datasets with known expected results ("golden datasets") for verifying reconciliation correctness.

### Location

`test-data/exports/smoke-seed42/`

### Files

| File                    | Description                     |
| ----------------------- | ------------------------------- |
| `payment_processor.csv` | Source: Payment processor data  |
| `bank_statement.csv`    | Target: Bank statement data     |
| `internal_ledger.csv`   | Additional source               |
| `invoice_system.csv`    | Additional target               |
| `golden.json`           | Expected reconciliation results |

### Usage

```bash
# Verify reconciliation with test data
pnpm verify:test-data

# Generate new test data
pnpm generate:test-data

# Run strict verification
pnpm verify:reconciliation:strict
```

---

## Playground (No Auth Required)

### Important: Auth-Free Operation

The Settler playground is **designed to work without authentication**:

- No login required
- Uses demo data exclusively
- Rate-limited per IP address
- No manual database setup needed

### Playground Endpoints

| Endpoint                          | Method | Description               |
| --------------------------------- | ------ | ------------------------- |
| `/api/v1/playground/demo-dataset` | GET    | Get demo dataset          |
| `/api/v1/playground/demo-run`     | POST   | Run demo reconciliation   |
| `/api/v1/playground/reconcile`    | POST   | Run custom reconciliation |
| `/api/v1/playground/examples`     | GET    | Get pre-filled examples   |

### Testing Playground

```bash
# After starting the API server (pnpm dev)
curl http://localhost:4000/api/v1/playground/demo-dataset

curl -X POST http://localhost:4000/api/v1/playground/demo-run \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Routes That Require Data

### Routes Returning 404 If Data Missing

| Route                                 | Behavior                         | Fix                  |
| ------------------------------------- | -------------------------------- | -------------------- |
| `GET /api/v1/playground/demo-dataset` | Returns 404 if demo data missing | Run `pnpm demo:seed` |
| `POST /api/v1/playground/demo-run`    | Returns 404 if demo data missing | Run `pnpm demo:seed` |

### Graceful Degradation Routes

These routes work without demo data (return demo responses):

- All `/api/v1/recon/*` endpoints - Return mock responses for unauthenticated users
- All `/api/v1/feature-flags/*` endpoints - Return empty/error responses for playground
- All `/api/v1/receipts/*` endpoints - Return demo receipt for playground

---

## Verification Checklist

| Step               | Command                                                  | Expected                       |
| ------------------ | -------------------------------------------------------- | ------------------------------ |
| Generate demo data | `pnpm demo:seed`                                         | Exit 0, files in demo/data/    |
| Verify files       | `ls demo/data/`                                          | JSON files present             |
| Test playground    | `curl localhost:4000/api/v1/playground/demo-dataset`     | Returns JSON data              |
| Run demo           | `curl -X POST localhost:4000/api/v1/playground/demo-run` | Returns reconciliation results |
| Test pilot         | `ls pilot-data/`                                         | CSV files present              |
| Verify test data   | `pnpm verify:test-data`                                  | Exit 0                         |

---

## Troubleshooting

### "Demo data not generated yet"

```bash
pnpm demo:seed
```

### "Database not configured for playground"

The playground works without DB. This error only occurs during full demo-run. Ignore if playground UI works.

### "Demo data returns empty"

Check demo files exist:

```bash
ls -la demo/data/
```

Regenerate if needed:

```bash
pnpm demo:seed:reset
```

---

## Related Documentation

- [SETUP.md](../SETUP.md) - Initial setup guide
- [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) - Step-by-step demo walkthrough
- [TEST_DATA_FOUNDRY.md](../test-data/TEST_DATA_FOUNDRY.md) - Test data generation
