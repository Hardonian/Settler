# Follow-Up Email Template

Copy and adapt after sharing demo access or following a live walkthrough.
Adjust bracketed fields and remove lines that don't apply.

---

## After sharing async access (no live call yet)

Subject: Settler demo — where to start + quick context

Hi [Name],

Sharing the demo account details below — takes about 5 minutes to get a feel for it.

**Demo access:**
- URL: [your app URL]/app
- Email: viewer@settler.dev
- Password: [current password]

**Where to start:**

1. `/app/runs` — the reconciliation history. Click into the most recent completed run
   to see the match explorer: exact matches, fuzzy matches (small amount diffs flagged
   for review), and unmatched records with a reason for each.

2. `/app/sources` — your connectors. Stripe and bank are healthy. Shopify shows a
   degraded state with an expired OAuth token — this is intentional, to show how
   Settler surfaces connector issues operationally.

3. `/app/audit` — every action logged with user, timestamp, and IP.

**About the data:**
This is a seeded enterprise demo account representing a month of Stripe-to-bank
reconciliation for a fictional business. The data is internally consistent — matches,
exceptions, and the degraded connector tell a coherent story.

Happy to walk through it together or answer questions async. What's your timeline for
evaluating this?

[Your name]

---

## After a live walkthrough

Subject: Settler follow-up — [company name] next steps

Hi [Name],

Thanks for the time today. Quick recap and next steps:

**What you saw:**
- [Customize: "Monthly Stripe-to-bank reconciliation automated end-to-end"]
- [Customize: "Exception surfacing for fuzzy matches and unmatched bank charges"]
- [Customize: "Connector health monitoring — the degraded Shopify example"]
- [Customize: "Full audit trail suitable for compliance review"]

**Your main questions / what we discussed:**
- [Insert key topics from the call]

**Suggested next step:**
[Choose one:]

- A: 30-minute technical call to map your reconciliation flow to what Settler can automate
- B: Pilot scope — connect your Stripe account, run one month, validate match rate
- C: I'll send over the API docs and SDK reference for your engineering team to review

**Reference materials:**
- One-page product summary: [link or attach docs/demo/PRODUCT_SNAPSHOT.md]
- Value summary: [link or attach docs/demo/VALUE_SUMMARY.md]
- FAQ: [link or attach docs/demo/FAQ.md]

The demo account stays active — feel free to share it with your team or re-explore.
I'll rotate the credentials in [X days], so let me know if you need more time.

[Your name]

---

## One-liner follow-up (if no response after a week)

Subject: Re: Settler demo

Hi [Name] — just checking in. The demo account is still active at [URL].
Happy to answer questions or jump on a quick call if useful.

[Your name]

---

*Internal: After sending, log the lead in your CRM with demo access date.
Rotate viewer@settler.dev password and run `pnpm demo:reset` if needed.*
