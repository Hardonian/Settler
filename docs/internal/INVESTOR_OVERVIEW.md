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

| Layer | Technology | Purpose |
|---|---|---|
| **Rust Kernel** | Cargo workspace | Deterministic primitives, cryptographic hashing, proofpack generation |
| **Reconciliation Core** | TypeScript | Matching engine, tolerance evaluation, evidence emission |
| **Control Plane** | Express + PostgreSQL | API routes, multi-tenant orchestration, audit trails |
| **Operator Console** | Next.js App Router | Run history, exception review, evidence export |
| **Ledger** | TigerBeetle | Immutable double-entry financial records |

## Product Metrics — Platform Depth

These are not mockups. Every number below maps to deployed, tested code.

| Metric | Count |
|--------|-------|
| **Monorepo packages** | 30 |
| **API route modules** | 37 (v1) |
| **Middleware layers** | 46 |
| **Verified adapter connectors** | 25+ |
| **Web application routes** | 170+ |
| **CI/CD workflows** | 23 (GitHub Actions) |
| **Backend services** | 80+ |
| **Reconciliation-core modules** | 56 source files |
| **E2E test specs** | 25+ Playwright specs |

## Adapter Ecosystem

| Category | Connectors |
|----------|-----------|
| **Payment Processing** | Stripe, PayPal, Square, Google Pay, Stripe Connect |
| **Accounting** | QuickBooks, Xero, FreshBooks, Wave, NetSuite |
| **E-Commerce** | Shopify, WooCommerce, Etsy, Amazon Seller, eBay, Wix, TikTok Shop |
| **Banking** | Plaid, TrueLayer |
| **Enterprise ERP** | SAP, NetSuite (advanced) |
| **Subscription Billing** | Chargebee, Recurly |
| **Tax** | TaxJar, Avalara |

Each adapter includes: rate limiting, OAuth token refresh, webhook signature verification, retry queues, and batch processing.

## Competitive Landscape

| Capability | **Settler** | BlackLine | Trintech | ReconArt |
|---|---|---|---|---|
| Open-source core | ✅ | ❌ | ❌ | ❌ |
| Deterministic matching | ✅ | Partial | Partial | ❌ |
| Hash-linked evidence | ✅ | ❌ | ❌ | ❌ |
| API-first architecture | ✅ | Limited | Limited | Limited |
| Self-hosted option | ✅ | ❌ | ❌ | ❌ |
| Rust kernel for performance | ✅ | ❌ | ❌ | ❌ |
| Modern tech stack (2026) | ✅ | Legacy | Legacy | Legacy |
| Multi-tenant by default | ✅ | Add-on | Add-on | Add-on |
| Deployment | Cloud / Self-hosted | Cloud only | Cloud only | Cloud only |
| Target buyer | CTO → CFO | CFO → IT | CFO → IT | CFO |

**Positioning:** Settler is the only open-source, API-first reconciliation platform with cryptographic proof of correctness. Legacy vendors (BlackLine $2.5B market cap, Trintech) are closed-source, cloud-only, and built on 15-year-old architectures.

## Market Opportunity

The financial operations software market is valued at **$23B** and growing at **14% CAGR**. Settler targets the core of this market by replacing manual reconciliation labor with deterministic software execution.

**Beachhead:** Mid-market companies processing 10K–500K transactions/month across 2+ payment processors. These companies are too large for spreadsheets but too modern for legacy enterprise tools.

## Moat — Three Compounding Loops

1. **Decision memory:** Every operator adjudication is preserved. The longer a customer uses Settler, the more institutional knowledge is embedded in their instance — increasing switching cost.
2. **Evidence depth:** Proofpacks accumulate run-over-run, building a verifiable audit trail that becomes the system of record for compliance.
3. **Workflow centrality:** Once wired into a company's payment processor and accounting stack, Settler becomes the reconciliation layer — not a tool you switch, but infrastructure you depend on.

## Monetization

| Tier | Price | Target |
|------|-------|--------|
| **OSS** | Free, self-hosted | Developers, evaluators |
| **Cloud API** | $99/mo + $0.01/txn | Scaling startups (10K–100K txn/mo) |
| **Managed** | $499/mo + usage | Mid-market (100K–500K txn/mo) |
| **Enterprise** | Custom | Fortune 500, regulated industries |

**Unit economics:** Infrastructure costs are fixed (PostgreSQL, TigerBeetle, Redis). Variable costs approach zero at scale. Gross margin target: 85%+.

## Enterprise Security & Compliance

- **Multi-tenant isolation:** 5-layer enforcement (middleware → types → SQL → RLS → entity checks)
- **SSO/SAML:** Enterprise identity federation via SAML 2.0
- **DLP:** PII redaction middleware (SSN, credit card, sensitive fields)
- **SOX compliance:** Maker-checker approval workflows with evidence bundles
- **SOC 2 readiness:** Structured audit logging, access control, data retention policies
- **GDPR/CCPA:** Data residency controls, PII scanning, right-to-erasure support
- **OpenFGA:** Attribute-based access control with fail-closed posture

## Traction & Milestones

- Full monorepo with 30 packages shipping production-grade code
- 170+ web routes across marketing, console, admin, and legal surfaces
- 23 CI/CD workflows including security scanning, migration guardian, release provenance
- Vercel deployment pipeline with preflight verification
- Comprehensive test coverage: unit, integration, E2E (Playwright)

## Ask

Settler is seeking pre-seed investment to:
1. **Hire first 3 engineers** — expand adapter coverage and matching engine depth
2. **Launch managed cloud offering** — convert self-hosted evaluators to paying cloud customers
3. **Enterprise pilot program** — land 5 design partners at Series B+ companies
4. **SOC 2 Type II certification** — table stakes for enterprise sales

---

*For technical deep-dives, see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md), [SECURITY_INVARIANTS.md](SECURITY_INVARIANTS.md), and the [operator console demo](/demo/console).*
