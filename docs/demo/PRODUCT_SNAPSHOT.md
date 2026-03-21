# Settler — Product Snapshot

**One-page summary for leads, stakeholders, and follow-up context.**

---

## What Settler is

Settler is a financial reconciliation API for companies that process payments across multiple
platforms. It connects to your payment processors, e-commerce systems, and accounting tools,
then automatically matches transactions across them — producing matched records, flagged
exceptions, and a complete audit trail on a schedule you control.

**One sentence:** Settler automates the monthly reconciliation work your finance team currently
does manually in spreadsheets.

---

## Who it is for

- Finance teams at companies processing **10K–1M+ transactions/month**
- Businesses operating across **multiple payment processors or sales channels**
- Ops teams who need **reconciliation at scale** without growing headcount
- Engineering teams who want a **reconciliation API** rather than building their own

---

## Core workflows

| Workflow | What it does |
|----------|-------------|
| **Connect** | One-time API setup to your platforms (Stripe, bank, Shopify, QuickBooks, etc.) |
| **Ingest** | Pull transaction data on a schedule or on-demand |
| **Reconcile** | Automatically match records across sources with confidence scoring |
| **Review** | Surface exceptions — unmatched, fuzzy, or conflicting — for human decision |
| **Export** | Download reconciliation reports in CSV, JSON, or Excel |
| **Audit** | Full trail of every action, match, and change across your account |

---

## What the demo account showcases

The demo is an isolated enterprise tenant (Acme Corp) with realistic seeded data:

- **4 connectors:** Stripe (healthy), Chase bank (healthy), Shopify (degraded — auth expired), QuickBooks (partial sync)
- **3 reconciliation runs:** one healthy, one with elevated exceptions, one failed due to connector issue
- **46 transactions:** 30 exact matches, 5 fuzzy matches, 11 unmatched
- **Full audit trail:** connector setup, run triggers, exports, user actions
- **2 completed exports:** monthly reconciliation report + exceptions-only report

This shows the product working end-to-end with real operational scenarios, including a connector
health issue and elevated exceptions — not just a happy-path demo.

---

## 5 reasons it is useful

1. **Eliminates manual spreadsheet reconciliation.** Finance teams reclaim 20–30 hours/month.

2. **Surfaces exceptions automatically.** Only the records that actually need human review reach your team — not everything.

3. **Handles multiple platforms in one place.** Stripe, bank, Shopify, QuickBooks, and 40+ others via a single API.

4. **Audit trail out of the box.** Every reconciliation action is logged with user, timestamp, and IP — useful for compliance reviews.

5. **Scales without additional headcount.** Processing 10x more transactions takes the same effort once configured.

---

## Connectors available

**Payment processors:** Stripe, PayPal, Stripe Connect, Chargebee, Recurly
**E-commerce:** Shopify, Amazon Seller, eBay, Etsy, TikTok Shop
**Accounting:** QuickBooks, Xero, NetSuite, Freshbooks, Wave, SAP
**Banking:** Plaid, TrueLayer
**Tax:** Avalara, TaxJar
**Custom:** Enterprise custom integrations framework

---

## Tiers

| | Starter | Growth | Scale | Enterprise |
|-|---------|--------|-------|-----------|
| Transactions/month | Up to 10K | Up to 100K | Up to 500K | Unlimited |
| Connectors | 2 | 5 | 15 | Unlimited |
| Exports | CSV | CSV + JSON | All formats | All + white-label |
| Audit trail | Basic | Full | Full | Full + retention |
| Support | Docs | Email | SLA | Dedicated |

---

## What's next

- **Explore the demo:** See `DEMO_README.md` for login and walkthrough
- **Technical deep-dive:** 30-minute call to map your reconciliation flow to Settler
- **Pilot scope:** Connect one source, run one month, validate match rate against your baseline
- **Integration:** TypeScript SDK (`@settler/sdk`), REST API, webhooks

---

*Settler does not provide legal, financial, or compliance advice. SOC 2 Type II planned Q3 2026.*
*For current product status and known limitations, see `docs/CANONICAL_PRODUCT_NARRATIVE.md`.*
