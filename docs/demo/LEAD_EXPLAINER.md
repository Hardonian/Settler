# Lead Explainer

Copy-paste-ready blocks for email, LinkedIn DM, follow-up notes, or sales intro.

---

## Short version (email intro / DM / cold outreach)

---

Subject: Settler — automated financial reconciliation

Hi [Name],

Finance teams at companies like yours typically spend 2–3 days every month manually
reconciling transactions between Stripe, their bank, and their accounting system — exporting
CSVs, running VLOOKUPs, chasing mismatches.

Settler automates this end-to-end via API. You connect your platforms once, create a
reconciliation job, and it runs automatically on your schedule. Results: matched transactions,
flagged exceptions, confidence scores, and a full audit trail — without the manual work.

I've set up a demo account so you can see it with real data. Here's the login:

URL: [your demo URL]
Email: viewer@settler.dev
Password: [your shared password]

Start at /app/runs — you'll see a completed reconciliation run with 89 automatically matched
records, a few flagged for review, and a connector that surfaced an auth issue. It's a realistic
slice of what a month of Stripe-to-bank reconciliation looks like for a mid-size business.

Happy to walk through it together if useful.

[Your name]

---

## Medium version (follow-up after a call / post-demo)

---

Great talking with you — here's a quick summary of what Settler does and what you saw in the demo.

**What it is:**
Settler is a financial reconciliation API. It connects to your payment processors, e-commerce
platforms, and accounting systems, then automatically matches transactions across them. You
get matched records, flagged exceptions, and a complete audit trail — on a schedule, without
manual work.

**The problem it solves:**
Most finance teams spend 20–30 hours/month on reconciliation — exporting data, running
VLOOKUPs, investigating mismatches. That work scales poorly and creates compliance risk.
Settler brings it down to under an hour by automating the matching and surfacing only what
actually needs a human decision.

**What you saw in the demo:**

- A completed monthly reconciliation of Stripe vs Chase (142 records, 89 auto-matched)
- Fuzzy matches flagged for review with amount differences shown
- A degraded connector (Shopify OAuth expired) surfaced as an operational alert
- Audit trail showing every action across the account
- Export history with downloadable reconciliation reports

**Connectors available:**
Stripe, PayPal, Shopify, Amazon, eBay, QuickBooks, NetSuite, Xero, Plaid (bank), and 40+
more. Custom integrations available on Enterprise.

**What's a realistic next step:**
A 30-minute technical walkthrough where we map your current reconciliation flow to what
Settler can automate, and scope a pilot. No commitment required.

[Your name]

---

## One-liner (for referral, intro, or first message)

> "Settler automates financial reconciliation between payment processors and accounting
> systems — connects once via API, runs on a schedule, surfaces exceptions, full audit trail.
> Used by finance teams processing 10K–1M+ transactions/month who are tired of manual
> CSV matching."

---

## Demo access reminder block

```
Demo account (read-only):
  URL:      [your demo URL]/app
  Email:    viewer@settler.dev
  Password: [shared password]

Start at: /app/runs
Best surfaces: runs list, run detail (match explorer), connectors page, audit trail

Reset or revoke access: ping [your name/team]
```

---

_Internal note: rotate the viewer password after each lead session.
See `docs/demo/ACCESS_SHARING.md` for the full access management process._
