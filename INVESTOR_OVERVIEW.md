# Investor Overview: Settler

## The Problem

Every scaling business eventually hits the reconciliation wall. When processing thousands of transactions across payment processors, bank feeds, and internal databases, matching the money requires massive manual effort. Companies hire finance ops teams or task expensive engineers with writing fragile scripts to hunt for missing pennies.

**The result:** Delayed financial reporting, failed audits, and stalled growth.

## The Solution

Settler is a deterministic reconciliation engine that replaces spreadsheet matching with an API-first platform. It ingests transaction data from multiple sources, matches them using configurable tolerance rules, flags exceptions into a structured review queue, and exports hash-linked evidence bundles — all scoped to isolated tenants and replayable from scratch.

**What makes Settler different:**

- **Deterministic outcomes:** Every reconciliation run produces byte-for-byte reproducible results. No probabilistic guessing.
- **Audit-grade evidence:** Hash-linked proofpacks that auditors can verify offline — not screenshots or pivot tables.
- **Exception intelligence:** Past adjudication decisions are preserved as institutional memory. The system learns from operator decisions over time.
- **Tenant isolation:** Five-layer security model (middleware, TypeScript interfaces, SQL guards, PostgreSQL RLS, entity-level checks) enforced by default.

## Architecture

| Layer                   | Technology           | Purpose                                                               |
| ----------------------- | -------------------- | --------------------------------------------------------------------- |
| **Rust Kernel**         | Cargo workspace      | Deterministic primitives, cryptographic hashing, proofpack generation |
| **Reconciliation Core** | TypeScript           | Matching engine, tolerance evaluation, evidence emission              |
| **Control Plane**       | Express + PostgreSQL | API routes, multi-tenant orchestration, audit trails                  |
| **Operator Console**    | Next.js App Router   | Run history, exception review, evidence export                        |
| **Ledger**              | TigerBeetle          | Immutable double-entry financial records                              |

## Market Opportunity

The financial operations software market is valued at $23B and growing at 14% CAGR. Settler targets the core of this market by replacing manual reconciliation labor with deterministic software execution.

## Moat

Settler's competitive advantage compounds over time through three reinforcing loops:

1. **Decision memory:** Every operator adjudication is preserved. The longer a customer uses Settler, the more institutional knowledge is embedded in their instance — increasing switching cost.
2. **Evidence depth:** Proofpacks accumulate run-over-run, building a verifiable audit trail that becomes the system of record for compliance.
3. **Workflow centrality:** Once wired into a company's payment processor and accounting stack, Settler becomes the reconciliation layer — not a tool you switch, but infrastructure you depend on.

## Monetization

- **Pricing:** Tiered subscription (free developer tier, growth at $99/mo + per-transaction usage, enterprise custom)
- **Unit economics:** Infrastructure costs are fixed (PostgreSQL, TigerBeetle, Redis). Variable costs approach zero at scale.
- **Expansion:** Land-and-expand via ecosystem integrations. Once Settler is processing transactions from a payment processor, adding new data sources is incremental.
