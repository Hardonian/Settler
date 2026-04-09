# Settler Demo Narrative

Three scripted levels — use whichever fits the conversation.

---

## 30-Second Version

**Talk track:**

> "Settler automates financial reconciliation. Instead of your finance team spending days
> each month matching transactions between Stripe, your bank, and your accounting system,
> Settler does it automatically — and surfaces only what actually needs human attention.
>
> In this demo account you can see a real reconciliation run that processed 142 records,
> matched 89 automatically at 96% confidence, and flagged 13 for review. That's the whole
> month of Stripe-to-bank reconciliation done in minutes."

**Screens:**

1. `/app/runs` — Show the run list. Point to the most recent completed run.
2. `/app/runs/<run-id>` — Show the match breakdown (matched / fuzzy / unmatched tabs).

---

## 2-Minute Version

**Step 1 — Run overview** (`/app/runs`)

> "Here's the reconciliation history for Acme Corp's demo account. You can see a daily
> scheduled run that completed successfully, one from last month with elevated exceptions
> (we'll show you why), and a failed run caused by a connector issue."

Point to: status badges, match rates, run timestamps.

**Step 2 — Healthy run detail** (`/app/runs/<run-1-id>` → Matches tab)

> "The most recent run matched 89 of 98 bank records. 30 were exact matches — same
> reference number, same amount, settled same day. 5 were fuzzy matches — small
> differences, probably processing fees. Settler flagged those for review rather than
> auto-approving them."

Point to: exact match confidence (>97%), fuzzy match rows with amount diff column.

**Step 3 — Exceptions** (Unmatched tab)

> "8 Stripe charges don't have a bank counterpart yet — they're in pending payout.
> Settler knows this and notes it. 3 bank transactions have no processor source —
> looks like bank fees. Those also get flagged for your team."

Point to: unmatched source vs unmatched target split.

**Step 4 — Connector health** (`/app/sources`)

> "Settler pulls from 4 sources. Stripe and Chase are healthy, syncing on schedule.
> Shopify lost its OAuth token 3 days ago — you can see the alert and the last
> successful sync time. One click re-authenticates it."

Point to: the degraded Shopify connector status badge and error message.

---

## 5-Minute Version

Follow the 2-minute version above, then extend with:

**Step 5 — Degraded run story** (`/app/runs/<run-2-id>`)

> "This run from last month shows elevated unmatched counts. If you dig into the
> metadata, it's the same period the Shopify connector was failing. 18 source
> transactions didn't get matched because the Shopify ingestion was partial.
> Settler surfaced this — it didn't silently under-report."

Point to: elevated unmatchedSourceCount, lower confidence average (88% vs 96%).

**Step 6 — Failed run** (`/app/runs/<run-3-id>`)

> "And here's the failed run — manual trigger that tried to reconcile Shopify against
> QuickBooks. Ingestion failed because the connector token was expired. Full error
> message, traceable back to the connector. No partial output, no silent failure."

Point to: error message, run status badge, connector link.

**Step 7 — Audit trail** (`/app/audit`)

> "Every action is logged. Who connected the Stripe account, when a reconciliation
> was triggered, who exported which report. This is the audit trail your compliance
> team will ask for."

Point to: create source, trigger run, export entries with timestamps and IP.

**Step 8 — Export** (`/app/exports`)

> "When the month is done, finance downloads the reconciliation report — CSV or JSON.
> This one from last month has 142 rows: matched, fuzzy, and unmatched all in one file
> with confidence scores."

Point to: completed export with row count and file size.

---

## Talk track notes

- **Don't open-code the UI.** Show surfaces, not implementation.
- **Lead with outcomes.** "matched 89 of 98 automatically" > "uses fuzzy matching algorithm".
- **Acknowledge the exceptions.** The unmatched items make the demo _more_ credible, not less.
- **The degraded connector is a feature.** It shows Settler surfaces real operational issues — not a liability.
- **Be honest about what's seeded.** If asked: "Yes, this is a seeded demo account with representative data. The workflows, matching logic, and audit trail are all real."

---

## URL reference (demo tenant)

| Surface              | Path                 |
| -------------------- | -------------------- |
| Reconciliation runs  | `/app/runs`          |
| Run detail           | `/app/runs/:id`      |
| Connectors / sources | `/app/sources`       |
| Audit trail          | `/app/audit`         |
| Export history       | `/app/exports`       |
| System health        | `/app/system-health` |
| Operator dashboard   | `/console/operator`  |
