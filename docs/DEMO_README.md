# Settler Demo — Quick Start

This document is your single entry point for the Settler enterprise demo system.

---

## What is set up here

An isolated enterprise demo tenant ("Acme Corp") with:

- 4 connectors (Stripe, Bank, Shopify, QuickBooks — one intentionally degraded)
- 2 completed ingestions (Stripe + Chase)
- 46 transactions (30 exact matches, 5 fuzzy matches, 11 unmatched)
- 3 reconciliation runs (healthy, elevated exceptions, failed/degraded)
- Full audit trail
- 2 completed exports

This is **real seeded data flowing through real product flows**. No frontend-only mocking.

---

## Seed / reset the demo tenant

```bash
# First time or after a wipe:
pnpm demo:seed

# Wipe everything and re-seed from scratch:
pnpm demo:reset
```

Both commands are idempotent. `demo:seed` will not duplicate data if run twice.

If `DATABASE_URL` is not set, JSON files are written to `demo/data/` for manual import.

---

## Demo accounts

| Account                    | Email                | Role   |
| -------------------------- | -------------------- | ------ |
| Admin (use this for demos) | `demo@settler.dev`   | Admin  |
| Viewer (share with leads)  | `viewer@settler.dev` | Viewer |

**Creating the demo user in Supabase Auth:**

```bash
# Via Supabase dashboard → Authentication → Users → Invite user
# Or via Supabase CLI:
supabase auth user create --email demo@settler.dev --password <your-password>
```

Set a memorable password and keep it in your team password manager. See
`docs/demo/ACCESS_SHARING.md` for the full sharing and rotation process.

---

## Key URLs to show

| Surface              | URL                    | Story                                        |
| -------------------- | ---------------------- | -------------------------------------------- |
| Reconciliation runs  | `/app/runs`            | Overview of all runs, statuses, match rates  |
| Run detail (healthy) | `/app/runs/<run-1-id>` | Match explorer: exact + fuzzy + unmatched    |
| Connectors           | `/app/sources`         | 3 healthy, 1 degraded (Shopify auth expired) |
| Audit trail          | `/app/audit`           | Who did what, when                           |
| Exports              | `/app/exports`         | CSV and reconciliation report downloads      |

---

## 30-second demo

1. Show `/app/runs` → "Here's your reconciliation history. Most recent run matched 89 of 98 records automatically."
2. Click into the run → "These matched exactly. These 5 need a quick review — small amount diffs. These 8 are pending payout, they'll clear tomorrow."
3. Show `/app/sources` → "Your Shopify connector needs attention — expired OAuth. Everything else is healthy."

Done. Value communicated in under a minute.

---

## Collateral and narrative guides

All demo and lead assets are in `docs/demo/`:

| File                    | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `DEMO_NARRATIVE.md`     | 30 sec / 2 min / 5 min walkthrough scripts |
| `LEAD_EXPLAINER.md`     | Copy-paste explainer for email or DM       |
| `PRODUCT_SNAPSHOT.md`   | One-page product summary                   |
| `VALUE_SUMMARY.md`      | 5-bullet value summary                     |
| `WHAT_TO_SHOW_FIRST.md` | Persona-based cheat sheet                  |
| `ACCESS_SHARING.md`     | How to share and revoke access safely      |
| `FOLLOW_UP_EMAIL.md`    | Post-demo email template                   |
| `FAQ.md`                | Mini FAQ for common prospect questions     |

---

## After a demo session

1. Run `pnpm demo:reset` to restore pristine state
2. If you shared the viewer account, rotate the password via Supabase dashboard
3. Optionally revoke the session via Supabase → Auth → Users → Invalidate sessions

---

## What is not included here

- Screenshot generation (run `pnpm demo:assets` if Playwright is available)
- Actual Stripe/Shopify API keys (the demo uses seeded local data only)
- A real auth user (must be created once via Supabase dashboard or CLI)

---

_For the full demo narrative, see `docs/demo/DEMO_NARRATIVE.md`._
_For the lead explainer you can paste into an email, see `docs/demo/LEAD_EXPLAINER.md`._
