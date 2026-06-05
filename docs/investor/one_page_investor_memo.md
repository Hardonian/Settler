# Settler — One-Page Investor Memo

**Stage:** Pre-Seed | **Structure:** Hybrid (Equity + Loan + Optional RBF) | **Raising:** $250K–$500K

---

## The Problem

Finance and ops teams at SMBs and mid-market companies spend **20–50 hours/month** on manual reconciliation. They match transactions across Stripe, PayPal, bank feeds, Shopify, and accounting systems using spreadsheets, email threads, and tribal memory. **94% still use Excel as a core close tool** (CFO.com / Forbes 2025). The result: delayed closes (50% of teams take 6+ business days), audit risk, and zero institutional memory of past exceptions and resolutions.

Existing solutions fail structurally: enterprise tools (BlackLine $77K–$340K/yr, FloQast ~$999/mo minimum) are too expensive. Spreadsheets are free but fragile. General automation (Zapier, Tray.io) lacks reconciliation logic, exception workflow, and audit evidence.

## The Solution

**Settler is a reconciliation-intelligence operating system.** It matches financial transactions across data sources with deterministic, replayable outcomes — and generates hash-linked proofpacks for every run.

- **Deterministic matching engine** with configurable tolerance rules and policy enforcement
- **Exception workflow** — unmatched items enter a structured queue with adjudication history, not email chains
- **Proofpack generation** — cryptographically-linked evidence bundles per run, exportable for auditors
- **Institutional memory** — rules, match patterns, source reliability signals, and resolution paths compound per-tenant over time, increasing match rates and switching costs

**Architecture:** Rust kernel (deterministic primitives) → TypeScript control plane (API, orchestration) → Next.js console (operator dashboard). Tenant isolation enforced via 9 security invariants with RLS on all scoped tables.

## Market

The global reconciliation software market is **$2.0–$2.4B (2024)**, growing at **10–15% CAGR** through 2034 (Precedence Research, Polaris Market Research, Fortune Business Insights). Settler targets the price gap between spreadsheets ($0) and enterprise platforms ($1,000+/month) — the $29–$499/month band where no credible automated reconciliation tool exists today.

## Product Status

| What's Built                                                                             | What's Not               |
| ---------------------------------------------------------------------------------------- | ------------------------ |
| Reconciliation engine (56 source files, tests)                                           | Paying customers         |
| 25+ platform adapters (Stripe, PayPal, Shopify, QuickBooks, Xero, Plaid, NetSuite, etc.) | Revenue / ARR            |
| Proofpack generation + verification                                                      | Completed pilot programs |
| Exception intelligence + cross-run intelligence                                          | SOC 2 certification      |
| Stripe billing integration (subscriptions, webhooks, usage tracking)                     | External LOIs            |
| Tenant isolation (9 invariants, RLS, cross-tenant tests)                                 |                          |
| Next.js operator console (74+ route groups)                                              |                          |
| CLI tooling (Foundry test data, replay, verification)                                    |                          |

## Business Model

Usage-based SaaS: $29–$499/month base + $0.01/transaction overage. **85%+ gross margins.** Infrastructure costs ~15% of revenue (Supabase, Vercel, Upstash). CAC payback target: <5 months. LTV/CAC target: 5:1+.

## Moat

Settler gets harder to replace over time — by design. Each tenant accumulates custom matching rules (tracked via `success_rate`), exception resolution patterns, source reliability signals, and proofpack history. After 6 months, switching means rebuilding all rules, re-establishing all patterns, and losing all evidence continuity.

## The Ask

**Raising $250K–$500K** via hybrid instrument:

| Component           | Share             | Structure                                                                  |
| ------------------- | ----------------- | -------------------------------------------------------------------------- |
| Equity              | 40–60%            | Post-money SAFE, $3M–$5M cap                                               |
| Business loan       | 40–60%            | 6–10% annual interest, 24–36 month term                                    |
| Optional conversion | Investor election | Surrender equity → revenue-based financing (3–8% of revenue, 1.5–2.5x cap) |

**Use of funds:** 40% Product | 30% GTM | 20% Ops | 10% Buffer

**Milestones:** 10 paying customers by Month 4 → 50 by Month 8 → 200 by Month 12

---

> **All terms are draftable structure options, not final legal terms. Exact percentages, valuations, and rates require legal/accounting review.**

**Contact:** [Founder] | **Product:** settler.dev | **Repo:** Available for technical diligence
