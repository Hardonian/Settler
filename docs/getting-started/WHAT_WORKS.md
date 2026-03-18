# What Works Today

**Last Updated:** 2026-03-18  
**Purpose:** Clear reference for operators on which workflows are functional and ready for use.

---

## Overview

This document describes the core workflows that are functional in the current release. These represent the "real today" capabilities of Settler — not promised future features.

---

## Core Functional Workflows

### 1. Stripe ↔ Bank Reconciliation

**Status:** ✅ Functional

The primary reconciliation workflow matches Stripe transactions against bank deposits.

**What's supported:**
- Stripe charge events → normalized transaction records
- Bank deposit detection and matching
- Fee reconciliation (Stripe fees vs bank fees)
- Payout-to-deposit matching
- Tolerance-based matching (configurable thresholds)

**Verification:**
```bash
pnpm demo:seed          # Load demo data
# Navigate to console → Reconciliation → Run
```

**Expected outcome:** Demo data produces matches, mismatches, and unmatched transactions.

---

### 2. Manual Review Queue

**Status:** ✅ Functional

The review queue displays all transactions that require human resolution.

**What's supported:**
- View all mismatched transactions
- Manual override with justification
- Bulk resolution actions
- Audit trail for all manual decisions

**Verification:**
```bash
pnpm dev
# Navigate to http://localhost:3000/console/review
```

---

### 3. Evidence Generation

**Status:** ✅ Functional

Settler generates deterministic evidence for every reconciliation decision.

**What's supported:**
- Per-transaction evidence records
- Match confidence scores
- Rule execution traces
- Export evidence bundles (JSON/PDF)

**Evidence includes:**
- Input data snapshots
- Matching rules applied
- Decision rationale
- Timestamp and operator ID (for manual overrides)

---

### 4. Basic Ingestion Pipelines

**Status:** ✅ Functional

CSV and API-based data ingestion are supported.

**What's supported:**
- CSV upload via console
- Stripe API ingestion
- Bank CSV import
- Field mapping configuration

**Limitations:**
- Max file size: 10MB per upload
- Supported formats: CSV, JSON

---

### 5. Tenant Management (Multi-workspace)

**Status:** ✅ Functional

Basic multi-tenancy with workspace isolation.

**What's supported:**
- Create/manage workspaces
- RLS (Row Level Security) enforcement
- Tenant-scoped data access

---

## What is NOT Yet Production-Ready

See [INTENTIONAL_BOUNDARIES.md](./INTENTIONAL_BOUNDARIES.md) for details on features that are intentionally not complete.

---

## Quick Verification Commands

| Workflow | Verification Command | Expected Result |
|----------|---------------------|-----------------|
| Reconciliation | `pnpm demo:seed && pnpm dev` | Demo data loads, console accessible |
| Evidence | Check `/console/evidence` | Evidence records visible |
| Review Queue | `pnpm dev` → `/console/review` | Queue page loads |
| Ingestion | CSV upload via console | Data appears in transactions |

---

## Related Documentation

- [Quickstart](./quickstart.md)
- [Demo Walkthrough](./DEMO_WALKTHROUGH.md)
- [Verification Commands](../VERIFICATION_COMMANDS.md)
- [Troubleshooting](../troubleshooting/SETUP_TRAPS.md)
