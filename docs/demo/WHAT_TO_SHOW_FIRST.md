# What to Show First — Persona Cheat Sheet

Use this to tailor the first 60 seconds of a demo with almost no prep.
Pick the prospect's primary lens and start there.

---

## Finance-focused prospect

_(CFO, Controller, Finance Manager, AP/AR lead)_

**Start at:** `/app/runs` → click into the most recent completed run

**Open with:**

> "This is the March reconciliation — 142 records processed, 89 matched automatically.
> Here are the 5 that need your team's eyes, with the amount difference shown.
> The rest are done."

**Key things to point at:**

- Match rate (89/98 = 91% auto-resolved)
- Fuzzy match rows with `amountDiff` column
- The export button (CSV report)

**Talk track anchor:** time saved, accuracy, fewer manual errors

---

## Ops-focused prospect

_(Head of Ops, Revenue Ops, Ops Manager)_

**Start at:** `/app/sources` (connectors page)

**Open with:**

> "Here's your integration panel. Stripe and Chase are syncing on schedule.
> Shopify lost its OAuth token 3 days ago — you can see the error and when it
> last succeeded. One action to fix it."

**Key things to point at:**

- Healthy vs degraded connector status
- Last sync time, sync schedule
- The failed run caused by the Shopify issue (`/app/runs` → run 3)

**Talk track anchor:** operational visibility, catching connector failures before they cause problems

---

## Technical prospect

_(Engineering lead, DevOps, Platform engineer, CTO)_

**Start at:** `/app/audit` (audit trail)

**Open with:**

> "Every action is logged — connector setup, run triggers, user exports.
> Full trace with IP and timestamp. Then here's the API surface if you want
> to drive reconciliation runs programmatically or hook into webhooks."

**Key things to point at:**

- Audit log entries with action, resource, user, IP
- Mention API key management and webhook config
- Mention the TypeScript SDK (`@settler/sdk`) and deterministic kernel

**Talk track anchor:** auditability, API-first design, no vendor lock-in on the data

---

## Executive prospect

_(CEO, COO, VP Finance)_

**Start at:** `/app/runs` for 20 seconds, then go straight to talk track

**Open with:**

> "Your finance team probably spends a couple of days every month on reconciliation.
> This is what that work looks like automated. The run completes, exceptions surface,
> your team reviews only what needs a decision. Everything else is done."

**Key things to point at:**

- Run status list (completed, exceptions flagged, failed run surfaced)
- One-line match rate summary
- Export → "this is what goes to your auditors"

**Talk track anchor:** cost savings, risk reduction, scale without headcount

---

## Quick decision guide

| Prospect says...                          | Start here                           |
| ----------------------------------------- | ------------------------------------ |
| "We spend too long on month-end"          | `/app/runs` → run detail             |
| "Our connectors break and we don't know"  | `/app/sources`                       |
| "We need this for our audit / compliance" | `/app/audit` + exports               |
| "Can it connect to [our system]?"         | `/app/sources` → show connector list |
| "How do exceptions get handled?"          | Run detail → unmatched tab           |
| "What does your API look like?"           | Audit trail + mention SDK/webhooks   |
