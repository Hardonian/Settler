# Settler — 10-Minute Investor Demo Script

**Purpose:** Live product demonstration for investor meetings
**Duration:** 10 minutes (8 min demo + 2 min Q&A transition)
**Prerequisites:** Local dev stack running (`pnpm dev:stack`) or deployed instance at settler.dev

---

## Pre-Demo Checklist

- [ ] Console loaded at `/console` or `localhost:3000/console`
- [ ] Demo data seeded (`pnpm demo:seed` or `pnpm demo:setup`)
- [ ] Two CSV files ready for upload (Stripe export + Bank statement)
- [ ] Terminal open for CLI commands (optional, for proof verification)
- [ ] Screen sharing active, browser at 80% zoom for readability
- [ ] Close all irrelevant tabs and notifications

---

## Minute 0:00–1:00 — Context Setting (Do NOT skip)

**Say:**

> "Let me show you what Settler actually does. I'm going to run a complete reconciliation — from raw data to audit-ready proof — in about 8 minutes. Everything you see is the real product."

**Do:**

- Show the console dashboard landing page
- Point out: workspace name (tenant isolation), navigation (reconciliation, exceptions, integrations, settings)

**Key point to make:**

> "This is the operator console. Every operator works in their own isolated workspace — our tenant isolation is enforced at the database level, not just the UI."

---

## Minute 1:00–3:00 — Data Ingestion

**Say:**

> "Step one: get data in. A finance operator typically has two data sources they need to match — let's say Stripe payments and a bank statement."

**Do:**

1. Navigate to the ingestion / data sources page
2. Upload CSV #1 — label it "Stripe payments export" (or show the Stripe adapter config if available)
3. Upload CSV #2 — label it "Bank statement"
4. Show the normalized transaction view — both sources now in a common format

**Key points to make:**

> "Settler normalizes data from different sources into a common format. We have adapters for 25+ platforms — Stripe, PayPal, QuickBooks, Shopify, Xero, Plaid, and more. CSV upload is the simplest path, but most customers would use the API or direct connectors."

> "Notice the tenant scope indicator — this data belongs to this workspace only. Other tenants can't see it."

---

## Minute 3:00–5:00 — Reconciliation Run

**Say:**

> "Step two: run the reconciliation. This is where Settler matches transactions across your two sources."

**Do:**

1. Navigate to the reconciliation run page
2. Configure a new run:
   - Select Source A and Source B
   - Show tolerance settings (e.g., $0.50 amount tolerance, 3-day date tolerance)
   - Point out the policy engine options
3. Start the run
4. Show the results page:
   - **Matched:** X transactions (green)
   - **Unmatched:** Y transactions (amber)
   - **Exceptions:** Z transactions (red)
   - Match rate percentage

**Key points to make:**

> "This is deterministic. Same data, same rules, same result — every time. No AI guessing, no probabilistic matching. Auditors can verify this independently."

> "Look at the match rate. For well-structured data, we typically see 85–95% auto-match on first run. That improves as the customer builds custom rules."

---

## Minute 5:00–7:00 — Exception Handling + Institutional Memory

**Say:**

> "Step three: handle the exceptions. These are the transactions that didn't auto-match. In the old world, this is where someone opens a spreadsheet and starts emailing."

**Do:**

1. Click into the exception queue
2. Open one exception — show:
   - The two transactions that almost matched (highlight the discrepancy — e.g., amount differs by $0.35)
   - Resolution options: approve match (with reason), flag for review, create manual match, reject
3. Resolve one exception — choose "approve with tolerance override"
4. Show the adjudication record that was created:
   - Who resolved it, when, why, what the tolerance was
5. If available, show the rules engine:
   - "This override just created a new rule. Next time Settler sees this pattern, it'll suggest the same resolution."

**Key points to make:**

> "This is where the moat builds. Every exception resolution becomes institutional memory. The more a customer uses Settler, the smarter it gets for THEIR specific data patterns. After 6 months, most of these exceptions would be auto-suggested."

> "This isn't AI magic — it's rule accumulation. Each rule has a tracked success rate. High-confidence rules get prioritized."

---

## Minute 7:00–8:30 — Proofpack Generation

**Say:**

> "Step four: prove it. Every reconciliation run generates a proofpack — a hash-linked evidence bundle that an auditor can independently verify."

**Do:**

1. Navigate to the proofpack export for this run
2. Show the proofpack contents:
   - Run metadata (timestamp, operator, workspace, sources used)
   - Match summary (matched/unmatched/exception counts)
   - Exception resolutions (who, what, when, why)
   - Hash chain (each artifact links to previous)
3. Click "Export" or "Download" — show the exported proofpack file
4. (Optional CLI) Run verification: `pnpm requiem:verify proofpacks/latest/proofpack.json`
   - Show the verification passing

**Key points to make:**

> "This is what makes Settler different from every spreadsheet and every generic automation tool. The proofpack is cryptographically linked — you can't modify part of it without breaking the chain. This is audit-grade evidence, not a PDF summary."

> "For month-end close, this replaces the folder of emails and screenshots that finance teams currently hand to auditors."

---

## Minute 8:30–9:30 — Moat / Why This Compounds

**Say:**

> "Let me show you why this gets stickier over time."

**Do:**

1. Navigate to reconciliation history / run list
2. Show multiple past runs (if demo data includes them)
3. Point out: match rate improving across runs
4. Show cross-run comparison (if available) — delta analysis between runs
5. Show the rules page — accumulated rules with match counts and success rates

**Key points to make:**

> "After 3 months, this customer has 30 custom rules with an average 90% success rate. That's not something you rebuild with a competitor overnight."

> "The switching cost isn't contractual — it's operational. Settler IS their reconciliation memory."

---

## Minute 9:30–10:00 — Close + Transition

**Say:**

> "That's the full workflow: ingest, match, review, prove. What you saw was:
>
> 1. Two data sources normalized in seconds
> 2. Deterministic matching with configurable tolerances
> 3. Structured exception handling that builds institutional memory
> 4. Hash-linked proofpack — audit-ready evidence for every run
>
> This is what we're replacing 20–50 hours per month of manual spreadsheet work with. Starting at $29/month."

**Transition to Q&A or Ask slide.**

---

## Demo Contingency Plans

| Problem                                | Recovery                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Dev server won't start                 | Use pre-recorded screenshots. Have backup screenshots in `docs/investor/screenshots/`.                   |
| CSV upload fails                       | Show pre-loaded demo data from `pnpm demo:seed`.                                                         |
| Proofpack verification fails           | Skip CLI verification. Show proofpack JSON contents directly.                                            |
| Slow network                           | Run locally. Never depend on network for investor demos.                                                 |
| Investor wants to see tenant isolation | Show `SECURITY_INVARIANTS.md` — walk through INV-1 through INV-9.                                        |
| Investor wants to see code             | Open `packages/reconciliation-core/src/` — show `canonical-reconciliation.ts`, `run-proofpack-index.ts`. |

## Post-Demo Follow-Up

Send within 24 hours:

1. One-page investor memo (`docs/investor/one_page_investor_memo.md`)
2. Link to pitch deck outline
3. Offer: "Happy to share repo access for technical diligence"
4. Offer: "Can run a live reconciliation on YOUR data during a follow-up call"
