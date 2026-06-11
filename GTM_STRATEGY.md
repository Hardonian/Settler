# Settler — Go-To-Market Strategy

## 1. Executive Summary

Settler is positioned as the deterministic reconciliation engine for modern finance teams, scaling startups, and enterprise compliance organizations. The GTM motion is a hybrid **Product-Led Growth (PLG)** model: self-serve developer onboarding that converts to paid subscriptions as transaction volume grows.

## 2. Target Audience

| Persona                            | Pain Point                                            | Settler Value                                                |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| **Scaling CTO / Engineering Lead** | Writing and maintaining custom reconciliation scripts | API-first matching engine with deterministic outcomes        |
| **Head of Finance / Controller**   | Manual spreadsheet reconciliation, audit prep burden  | Automated matching with hash-linked proofpacks for auditors  |
| **Compliance / Risk Officer**      | Proving reconciliation accuracy to regulators         | Replayable runs, tenant-scoped audit trails, evidence export |

## 3. Product-Led Growth Mechanics

The funnel is designed to monetize as customers scale:

1. **Developer Tier (Free):** Up to 500 transactions/month. Full access to the matching engine, CLI tooling, and proofpack generation. Zero friction to first value.
2. **Growth Tier ($99/mo + usage):** Primary monetization loop. Per-transaction pricing ($0.01/txn) creates a direct correlation between customer scale and Settler revenue. Includes live activity feed, advanced exception intelligence, and priority support.
3. **Enterprise Tier (Custom):** SSO/SCIM, custom SLAs, dedicated tenant isolation guarantees, OpenFGA fine-grained authorization, and compliance evidence packages.

## 4. Distribution Channels

### Phase 1: Developer Community Launch

- **Channels:** Hacker News, Product Hunt, targeted developer communities (FinTech Twitter/X, Stripe developer forums)
- **Messaging:** "Stop writing custom scripts for your ledger. Deterministic reconciliation as an API."
- **Goal:** 100 active developer-tier users, 10 paying growth-tier users

### Phase 2: Ecosystem Partnerships

- **Channels:** Stripe Apps marketplace, accounting software partner programs
- **Messaging:** "The reconciliation layer for your existing financial stack."
- **Goal:** Organic acquisition through platform marketplaces and integration directories

### Phase 3: Enterprise Outbound

- **Channels:** Direct outreach to finance teams at Series B+ companies processing >10k transactions/month
- **Messaging:** "Audit-grade reconciliation with zero manual effort. Proofpacks your auditor can verify."
- **Goal:** 5 enterprise contracts with annual commitment

## 5. Content Strategy

All content is grounded in verifiable product capabilities:

- **Technical blog posts:** Deterministic matching algorithms, proofpack architecture, tenant isolation design
- **Case studies:** Built from pilot program outcomes (see [Pilot Runbook](docs/pilot-runbook.md))
- **Documentation as marketing:** The [SETUP.md](SETUP.md) → first working screen path is designed to be completed in under 10 minutes

## 6. Success Metrics

| Metric                           | Target (90 days) |
| -------------------------------- | ---------------- |
| Developer-tier signups           | 100              |
| Growth-tier conversions          | 10               |
| Time to first reconciliation run | < 15 minutes     |
| Documentation-driven conversions | > 30% of signups |
| Churn (monthly)                  | < 5%             |
