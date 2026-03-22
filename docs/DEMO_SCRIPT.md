# Settler Demo Script

## Purpose

This script guides a presenter through a 10-minute live demo of Settler.
All demo data is deterministic and pre-seeded — no database or live credentials required.

---

## Before the Demo

1. Ensure the app is running locally (`pnpm dev`) or use the preview deployment
2. Open `/demo/console` in your browser — this is the showcase console
3. Verify data loads (5 tenant scenarios should be available in the dropdown)
4. Have a second tab open to `/demo` for the overview landing

---

## Demo Flow (10 minutes)

### 1. What Settler Does (1 min)

> "Settler is a reconciliation platform for finance teams. It automatically matches records across payment processors, banks, ERPs, and commerce platforms — then surfaces mismatches, duplicates, and exceptions that need human review."

Show the `/demo` page briefly, then navigate to `/demo/console`.

### 2. Dashboard Overview (2 min)

On the Showcase Console (`/demo/console`):

- **Point to the KPI cards**: match rate, records processed, open exceptions, active integrations
- **Highlight the trend sparklines**: "You can see match rate improving over time as rules are tuned"
- **Show the tenant selector**: switch between scenarios to show different environments

> "Each tenant represents a different reconciliation scenario — from a clean e-commerce environment to a complex multi-source international trading company."

### 3. Walk Through a Scenario (3 min)

Select **"Meridian Financial Services"** (mid-maturity FinOps):

- **Recent Runs**: "Here you see 12 reconciliation runs over the past month. Each one compared NetSuite records against Bank of America deposits."
- **Open Exceptions**: "These are the items that need operator attention — amount mismatches, missing counterparts, timing variances."
- **Exception Detail**: Click on an exception to show the type, severity, amount, reason tags, and recommended action

> "Every exception has a clear status, severity, and explanation. Operators know exactly what happened and what to do next."

### 4. Integrations & Trust (2 min)

Scroll to the Integrations section:

- Show connected/degraded/disconnected statuses
- Point out record counts and last sync times

Scroll to the Trust & Provenance card:

> "Every run produces deterministic results — same inputs always produce identical outputs. Every action is audit-trailed. Data never crosses tenant boundaries."

### 5. Compare Scenarios (1 min)

Switch to **"Atlas Global Trading"** to show:

- Lower match rate (78-90%) — this is a messier environment
- More exceptions, including duplicate detections and currency mismatches
- More alerts including sync failures

> "Different environments have different challenges. Settler handles all of them with the same engine and operator workflow."

### 6. CTA (1 min)

> "What you're seeing is real product with deterministic data. In a trial, you'd connect your own Stripe, Shopify, QuickBooks, or bank account and see your actual reconciliation results within minutes."

Point to the "Start Free Trial" button.

---

## Scenario Guide

| Tenant | Industry | Match Rate | Key Story |
|--------|----------|------------|-----------|
| Acme Commerce Inc. | E-Commerce | 95-99% | Clean, high-match Stripe↔Shopify environment |
| Meridian Financial | Financial Services | 88-95% | Mid-maturity FinOps with recurring exceptions |
| Atlas Global Trading | International Trade | 78-90% | Messy multi-source with currency issues |
| Pulse Payments Corp | Payments/FinTech | 92-97% | High-volume processor settlements |
| Sentinel Audit Corp | Audit & Compliance | 96-99.5% | Tight thresholds, manual review focus |

---

## Common Questions

**Q: Is this real data?**
A: It's deterministic showcase data generated from a seeded algorithm. Same seed always produces identical data. In production, you'd see your actual financial records.

**Q: How long does setup take?**
A: Connect an integration (e.g., Stripe) in under 5 minutes. First reconciliation run completes in seconds to minutes depending on volume.

**Q: Can I replay a run?**
A: Yes. Every run is deterministic — same inputs and rules always produce identical results. The Replay Lab lets you verify this.

**Q: What happens with exceptions?**
A: Operators review, investigate, resolve, or mark as noise. Every action is logged in the audit trail with actor and timestamp.

**Q: Is data isolated between tenants?**
A: Completely. Tenant isolation is enforced at the database level. No data crosses boundaries.
