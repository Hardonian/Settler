# Show HN: Settler – Open-source API for financial reconciliation and receipt parsing

Hi HN, we are the team behind Settler.dev. We've built an API infrastructure that handles the "boring but critical" parts of fintech: reconciliation, receipt parsing, and deterministic unit conversion.

## The Problem
Every fintech company eventually builds an internal "Reconciliation Service". It usually starts as a cron job matching Stripe payouts to DB rows, then grows into a monster dealing with currency conversion, fuzzy matching, and PDF parsing. It's fragile, unmaintained, and incorrect.

## The Solution
Settler is a double-entry ledger and reconciliation engine wrapped in a clean, typed API.

- **Reconcile**: Match transactions across any two sources (Stripe, Shopify, DB, CSV) with configurable rules.
- **Receipts**: Send us a PDF/Image, get back structured JSON (Vendor, Date, Line Items, Tax) using our edge-optimized OCR.
- **Flags**: Feature flags designed for financial rollout (e.g. "enable for users with >$10k volume").

## Tech Stack
- Typescript / Node.js
- Event Sourcing for auditability
- Edge-first architecture for low latency

## Links
- Docs: https://settler.dev/docs
- Repo: https://github.com/settler/settler
- Playground: https://settler.dev/console/playground

We'd love your feedback on the API design and the specific reconciliation pain points you've faced!
