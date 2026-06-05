# Settler Pre-Seed Investor Pitch Deck Outline

**Version:** FINAL (Attempt 3 — Reflexion Framework)
**Date:** June 2026
**Stage:** Pre-Seed
**Investment Structure:** Hybrid — Partial Equity + Partial Business Loan + Optional Revenue-Based Financing Conversion

---

## How This Document Was Built

This outline was built through three iterative attempts using the Reflexion framework. Each attempt was critiqued and improved. Only Attempt 3 (FINAL) is presented here. The Reflexion process is documented in the companion artifact.

**Evidence sources:**

- Settler repository code, migrations, tests, and documentation
- Market research (Precedence Research, Fortune Business Insights, Polaris Market Research, Forbes, CFO.com, Carta, Crunchbase)
- Repo files: README.md, PRODUCT_OVERVIEW.md, INVESTOR_OVERVIEW.md, INVESTOR_NARRATIVE.md, GTM_STRATEGY.md, SECURITY_INVARIANTS.md, ICP_DEFINITIONS.md, PRICING.md, UNIT_ECONOMICS.md, ECONOMICS.md, DUE_DILIGENCE.md, moat.md, settler-defense-moat.md, competitor-teardown-matrix.md, reconciliation-core source

---

## SLIDE 1: Cover

**Title:** Settler — Reconciliation Intelligence for Finance Operations

**Core Message:** Settler replaces spreadsheet-based financial reconciliation with a deterministic, evidence-generating operating system that accumulates institutional memory with every run.

**Supporting Content:**

- Tagline: "Stop reconciling. Start settling."
- Pre-seed stage. Solo technical founder. Revenue-ready product.
- Hybrid investment: Partial equity + business loan + optional revenue-based financing path
- settler.dev

**Anchor Visual:** Product logo + single screenshot of the operator console showing a reconciliation run with matched/unmatched/exception counts and a proofpack export button.

**Fact-Grounding Note:** Screenshot must be pulled from live `/console` or `/reconciliation` routes. Repo evidence confirms these routes exist in `packages/web/src/app/`.

---

## SLIDE 2: Problem

**Title:** Reconciliation Is Where Finance Teams Lose Time, Trust, and Audit Confidence

**Core Message:** Finance and ops teams at SMBs and mid-market companies spend 20–50 hours/month on manual reconciliation across fragmented systems, producing no durable evidence trail.

**Supporting Content:**

- **50% of finance teams** take 6+ business days to close books monthly (Forbes, CFO.com 2025 surveys)
- **94% still use Excel** as a core close tool — the same tool that's the #1 bottleneck cited by finance leaders
- Cash/account reconciliation is consistently the **#1 most time-consuming close activity**
- Teams navigate 3–5 different systems (ERP, processor, bank, accounting, email) — each creating data fragmentation
- When exceptions arise, the evidence trail is email threads, screenshots, and tribal memory — not audit-grade artifacts

**Anchor Visual:** Side-by-side comparison:

- LEFT: "Today" — spreadsheet with red-highlighted mismatches, email threads, manual notes
- RIGHT: "With Settler" — structured exception queue, proofpack export, adjudication history

**Fact-Grounding Note:**

- ✅ SOURCED: "50% take 6+ business days" — Ledge.co / CFO.com surveys, corroborated by Forbes 2025 coverage
- ✅ SOURCED: "94% use Excel" — Ledge.co close management survey
- ✅ SOURCED: "20–50 hours/month on reconciliation" — CFO.com, Forbes
- Repo evidence: `docs/INVESTOR_NARRATIVE.md` cites "8–16 hours/month" for B2B SaaS operators specifically — the broader 20–50 figure covers full accounting teams

---

## SLIDE 3: Customer / ICP

**Title:** Who Buys Settler — And Why They Can't Wait

**Core Message:** Settler's initial buyers are finance managers and ops leads at B2B SaaS companies and e-commerce businesses (50–500 employees, $5M–$50M revenue) who already spend $400–$800/month in labor on reconciliation work they hate.

**Supporting Content:**

- **Primary ICP #1:** E-commerce Finance Manager — monthly reconciliation takes 2–3 days, triggered by audit prep or scaling past manual capacity
- **Primary ICP #2:** SaaS Operations Lead — multi-currency, multi-processor matching between Stripe/PayPal/bank is manual and error-prone
- **Primary ICP #3:** Developer/Founder — spending engineering time on custom reconciliation scripts instead of product
- **Secondary (post-PMF):** Accounting firm partners (multi-client reconciliation margin pressure), fintech compliance leads (regulatory audit trail requirements)
- Budget authority: $500–$1,000/month approvable without procurement. Clear ROI: $29–$99/month replaces $400–$800/month in labor.

**Anchor Visual:** ICP quadrant diagram: X-axis = pain intensity, Y-axis = budget authority. E-commerce Finance Manager and SaaS Ops Lead in top-right.

**Fact-Grounding Note:**

- ✅ REPO: `docs/ICP_DEFINITIONS.md` — 5 detailed ICPs with trigger events, budget authority, buying friction, use cases, and monetization paths
- ✅ REPO: `docs/WHO_THIS_IS_NOT_FOR.md` — explicit exclusions showing ICP discipline
- ⚠️ NEEDS VALIDATION: ICP definitions are internally authored. Need 5–10 customer discovery interviews to validate pain intensity and willingness to pay at stated price points.

---

## SLIDE 4: Market Opportunity

**Title:** $2.4B Reconciliation Software Market, Growing 10–15% CAGR

**Core Message:** The reconciliation software market is $2.0–2.4B in 2024, projected to reach $4–8B by 2034. Settler targets the underserved mid-market segment where teams are too large for spreadsheets but too small for enterprise platforms.

**Supporting Content:**

- **Global reconciliation software market (2024):** USD $2.01–$2.44B (Polaris Market Research, Fortune Business Insights, Precedence Research)
- **Projected CAGR:** 10–15% through 2034, depending on scope definition
- **Growth drivers:** Cloud adoption, AI/ML integration, regulatory compliance mandates, increasing transaction volume across digital commerce
- **Settler's wedge:** The $29–$499/month price band is a desert — enterprise tools start at $1,000+/month, spreadsheets cost $0 but fail at scale. Settler fills the gap.
- **SAM framing:** ~50,000 B2B SaaS companies in the US alone with 5–200 employees. At $100/month avg ARPU × 12 months = $60M addressable in Year 1 ICP segment alone.

**Anchor Visual:** Market map showing price vs. capability:

- Bottom-left: Spreadsheets (free, fragile)
- Top-right: BlackLine, Trintech, ReconArt ($1,000+/mo, enterprise)
- Center gap: Settler ($29–$499/mo, automated, audit-ready)

**Fact-Grounding Note:**

- ✅ SOURCED: Market size ranges from Precedence Research, Polaris Market Research, Fortune Business Insights, IMARC Group — multiple analyst reports cross-referenced
- ✅ SOURCED: CAGR range 10–15% is a conservative consensus across 5+ reports
- ⚠️ NEEDS VALIDATION: SAM calculation ($60M) uses repo's ICP count of 50,000 US SaaS companies (from `docs/INVESTOR_NARRATIVE.md`) — needs independent validation
- ⚠️ TAM figures in repo docs ($20B–$50B) appear inflated relative to analyst reports. This deck uses the sourced $2–2.4B figure. The repo's larger numbers may include adjacent markets (financial ops software broadly).

---

## SLIDE 5: Solution

**Title:** Settler — Reconciliation Intelligence, Not Another Dashboard

**Core Message:** Settler is a deterministic reconciliation engine that matches transactions across sources, generates hash-linked proofpacks for every run, preserves exception history, and accumulates operator decisions as institutional memory.

**Supporting Content:**

- **Deterministic matching:** Same inputs → same outputs. Every match, tolerance, and exception is replayable and auditable.
- **Proofpack generation:** Every reconciliation run produces a cryptographically-linked evidence bundle — exportable for auditors, compliance, and month-end close.
- **Exception workflow:** Unmatched items enter a structured exception queue with adjudication history, not an email chain.
- **Institutional memory:** Reconciliation rules, match patterns, source reliability signals, and resolution paths accumulate per-tenant. The system learns which rules work, improving match rates over time.
- **Tenant isolation:** Row-Level Security (RLS) on all tenant-scoped tables. 9 documented security invariants with test coverage.

**Anchor Visual:** Architecture diagram showing the 5-layer system:

1. Rust Kernel (deterministic primitives, hashing, proofs)
2. TypeScript Control Plane (API, orchestration, tenancy)
3. CLI Surface (foundry, operator tooling)
4. Console Surface (Next.js operator dashboard)
5. Enterprise Integration Layer

**Fact-Grounding Note:**

- ✅ REPO: `packages/reconciliation-core/src/` — 56 source files including `canonical-reconciliation.ts`, `run-proofpack-index.ts` (32KB), `exception-intelligence.ts` (19KB), `cross-run-intelligence.ts` (27KB), `source-reliability.ts`, `run-institutional-memory.ts`
- ✅ REPO: `crates/` — Rust kernel for deterministic computation
- ✅ REPO: `SECURITY_INVARIANTS.md` — 9 tenant isolation invariants, all code-backed
- ✅ REPO: `proofpacks/` directory with `determinism/`, `latest/`, `milestone-proof/` subdirectories
- ✅ REPO: `pnpm run verify:moat-readiness` — canonical surface + proofpack + tenant posture verification script

---

## SLIDE 6: Product / Workflow

**Title:** What Settler Does — A Reconciliation Run in 4 Steps

**Core Message:** An operator uploads source data (CSV or API), Settler runs deterministic matching with configurable tolerances, exceptions surface in a review queue, and a proofpack is generated for every run.

**Supporting Content:**

1. **Ingest:** CSV upload or API connector (Stripe ↔ Bank today). Normalized transaction pipeline. Adapters for multiple source types.
2. **Match:** Configurable tolerance rules. Policy engine applies matching logic. Deterministic: same data → same result. Audit stages tracked.
3. **Review:** Exceptions surface in operator console. Manual adjudication with full history. Override decisions become institutional memory.
4. **Prove:** Proofpack generated per run — hash-linked, exportable, verifiable. Includes match/no-match counts, exception details, operator decisions, source metadata.

**Supporting workflows (implemented or partially implemented):**

- Multi-workspace tenant isolation
- Reconciliation run history and replay
- Cross-run intelligence and delta analysis
- Exception intelligence and pattern detection
- Billing entitlement enforcement
- Foundry test data generation (smoke, chaos profiles)

**Anchor Visual:** 4-step horizontal workflow diagram with screenshots from each stage:

1. CSV upload / connector config
2. Run progress + match stats
3. Exception review queue
4. Proofpack export / verification

**Fact-Grounding Note:**

- ✅ IMPLEMENTED: Stripe ↔ Bank transaction matching (README.md: "Core Workflows That Work Today")
- ✅ IMPLEMENTED: Manual review queue with audit trails
- ✅ IMPLEMENTED: Deterministic evidence generation
- ✅ IMPLEMENTED: CSV/API ingestion pipelines
- ✅ IMPLEMENTED: Multi-workspace tenant isolation
- ✅ IMPLEMENTED: Reconciliation-core engine (56 source files, test suite)
- ✅ IMPLEMENTED: Proofpack generation and verification (`verify:proofpack`, `requiem:prove`, `requiem:verify`)
- ✅ IMPLEMENTED: Exception intelligence (`exception-intelligence.ts`, 19KB)
- ✅ IMPLEMENTED: Cross-run intelligence (`cross-run-intelligence.ts`, 27KB)
- ✅ PARTIALLY: Additional connectors beyond Stripe/bank (marketplace listed but needs verification)
- ⚠️ CLAIM "50+ integrations" appears in repo docs but the competitor teardown shows "10+" adapters. The adapter count needs honest audit.

---

## SLIDE 7: Why Now

**Title:** Three Secular Tailwinds Make This the Right Moment

**Core Message:** The convergence of regulatory pressure, digital payment volume growth, and AI-enabled automation creates a window for a reconciliation-specific platform — before incumbents adapt.

**Supporting Content:**

1. **Regulatory acceleration:** Increasing audit and compliance requirements push finance teams toward provable, deterministic reconciliation — not spreadsheet approximations. SOC 2, SOX, and industry-specific mandates are expanding.
2. **Payment fragmentation:** E-commerce and SaaS companies now process through Stripe, PayPal, Square, Shopify Payments, Apple Pay, bank ACH, and more — creating exponentially more matching surfaces. The average team navigates 3–5 systems during close.
3. **Automation readiness:** 94% of teams still use Excel for close. Less than 40% of close processes are automated. The market is pre-disruption, not post-disruption. Enterprise tools (BlackLine, Trintech) are priced for Fortune 500 — there is no automation layer for the mid-market.
4. **AI-as-accelerator, not AI-as-product:** Settler uses AI as an optional augmentation layer (BYOK architecture for graceful degradation), not as a core dependency. This positions Settler well as the market matures past AI hype toward deterministic reliability.

**Anchor Visual:** Timeline showing payment platform proliferation (2015: 2–3 processors → 2026: 8–12 processors per mid-market company) alongside reconciliation tool adoption curve (still early).

**Fact-Grounding Note:**

- ✅ SOURCED: "94% use Excel" — Ledge.co / CFO.com surveys
- ✅ SOURCED: "<40% automated" — Ledge.co / Datamatics BPM surveys
- ✅ SOURCED: "3–5 systems" — Forbes 2025
- ✅ REPO: BYOK AI architecture documented in `PRODUCT_OVERVIEW.md` — `verified_degraded` state for graceful AI fallback
- ⚠️ NEEDS VALIDATION: Payment platform proliferation claim ("8–12 processors per mid-market company") is directionally correct but needs specific sourcing

---

## SLIDE 8: Business Model

**Title:** Usage-Based SaaS with 85%+ Gross Margins

**Core Message:** Base subscription ($29–$499/month) plus $0.01/transaction overage creates aligned revenue growth — Settler earns more as customers process more.

**Supporting Content:**

- **Free Tier:** $0/month, 100 txns included. Evaluation and low-volume testing.
- **Starter:** $29/month, 1,000 txns included. Small businesses, startups.
- **Growth:** $99/month, 10,000 txns included. Scaling businesses.
- **Enterprise:** $500–$10,000+/month, custom volumes. Volume discounts at 100K+ txns.
- **Overage:** $0.01/txn above tier inclusion. Revenue scales with customer growth.
- **Gross margin:** 85%+ (infrastructure ~15% of revenue: Supabase $25–$500/mo, Vercel $20–$1,000/mo, Upstash $0–$200/mo)
- **Expansion path:** Per-tenant ARPU expands as transaction volume grows, integration count increases, and proofpack exports become audit-critical infrastructure

**Anchor Visual:** Pricing tier table with "typical customer" example at each tier showing monthly cost and ROI vs. manual labor ($50/hr × estimated hours saved).

**Fact-Grounding Note:**

- ✅ REPO: `docs/PRICING.md` — full tier breakdown with examples
- ✅ REPO: `docs/ECONOMICS.md` — infrastructure cost model
- ✅ REPO: `config/pricing-simple.ts` — pricing enforcement in code
- ✅ REPO: Stripe integration confirmed (`packages/web/src/domain/billing/stripeService.ts`, webhook handler, customer portal)
- ⚠️ NOTE: Pricing docs show inconsistencies between files (PRICING.md lists Free/$29/$99/Enterprise; ECONOMICS.md lists Starter $99/Professional $499/Enterprise custom; INVESTOR_NARRATIVE.md lists $99/$299/Enterprise). Recommend consolidating to a single canonical pricing table before investor meetings.

---

## SLIDE 9: Traction / Validation

**Title:** Pre-Revenue with Production-Ready Product and Verification Infrastructure

**Core Message:** Settler is pre-revenue but production-ready — with a working reconciliation engine, proofpack system, tenant isolation, billing infrastructure, and extensive verification suite. The product gap is not buildability — it's first customers and revenue validation.

**Supporting Content:**

- **Product completeness:**
  - Reconciliation engine: Implemented and tested (deterministic matching, exception handling, proofpack generation)
  - Billing: Stripe integration complete (subscription management, webhook handling, usage tracking)
  - Security: 9 tenant isolation invariants, RLS on all tenant-scoped tables, cross-tenant test coverage
  - Console: Next.js operator dashboard with 74+ route groups
  - CLI tooling: Foundry test data generation, reconciliation verification, replay
- **Verification depth (repo-verifiable):**
  - `pnpm verify` — lint, typecheck, build, test, surface verification, policy verification
  - `pnpm verify:moat-readiness` — canonical surface, proofpack, degraded states, tenant isolation, security routes, claims verification
  - `pnpm verify:security` — RLS, cross-tenant, admin authz, dependency audit, security drift
  - `pnpm test:reconciliation:e2e` — end-to-end reconciliation verification
- **What is NOT claimed:**
  - No paying customers yet
  - No ARR
  - No completed pilot programs
  - No external LOIs
  - Matching accuracy claims ("95%+ instant resolution") need validation with real customer data

**Anchor Visual:** "Build vs. Validate" matrix showing:

- ✅ Built: Engine, billing, security, console, CLI, verification
- 🔄 In Progress: First pilot, first revenue, first proofpack with real customer data
- ⬜ Next: Customer discovery validation, SOC 2, additional integrations

**Fact-Grounding Note:**

- ✅ REPO: All product claims above are verifiable via repo code and scripts
- ✅ REPO: `docs/INVESTOR_NARRATIVE.md` states "Product: Production-ready. Customers: Early adopters, pilot customers. Revenue: Pre-revenue (launch-ready)."
- ⚠️ HONEST NOTE: "Early adopters" and "pilot customers" language in the narrative doc is not substantiated by any customer data, pilot logs, or revenue records in the repo. This deck treats the company as **pre-revenue, pre-customer** until evidence of paying users is provided.
- ⚠️ HONEST NOTE: Integration count claims vary between "50+" (INVESTOR_NARRATIVE.md, DUE_DILIGENCE.md) and "10+" (competitor teardown). The honest position for investors is to disclose the actual number of working, tested adapters.

---

## SLIDE 10: Competition / Alternatives

**Title:** The Market Has Enterprise Solutions and Spreadsheets — Nothing in Between

**Core Message:** Existing alternatives are either too expensive (BlackLine, Trintech, ReconArt — $1,000+/month, enterprise sales cycles) or too fragile (spreadsheets, custom scripts). General automation tools (Zapier, Tray.io) lack reconciliation-specific matching logic, exception workflows, and audit trail capabilities.

**Supporting Content:**

- **Enterprise incumbents (BlackLine, Trintech, ReconArt):**
  - $1,000–$10,000+/month. Long implementation. Fortune 500 focus.
  - Strong at high-volume bank reconciliation. Weak at mid-market SMB needs.
  - Settler advantage: 10–100x cheaper, self-service onboarding, API-first.
- **General automation (Zapier, Tray.io):**
  - Not built for reconciliation. No matching logic, no exception workflow, no proofpacks.
  - Settler advantage: Purpose-built reconciliation engine with deterministic outcomes.
- **Spreadsheets / custom scripts:**
  - Free but unscalable. No audit trail. No institutional memory. Linear labor cost.
  - Settler advantage: Automated matching, evidence generation, compounding rule accuracy.
- **Accounting software (QuickBooks, Xero):**
  - Built for bookkeeping, not reconciliation. Require manual data entry.
  - Settler advantage: Integrates with accounting software as a data source, not a replacement.
- **Key differentiator:** Settler is the only tool that (a) generates cryptographic proofpacks per run, (b) accumulates exception/adjudication history as institutional memory, and (c) operates in the $29–$499/month price band with self-service onboarding.

**Anchor Visual:** 2×2 competitive matrix:

- X-axis: Price (Low → High)
- Y-axis: Reconciliation depth (Shallow → Deep)
- Spreadsheets: Low price, shallow depth
- Zapier/Tray: Low-mid price, shallow depth
- BlackLine/Trintech: High price, deep depth
- **Settler: Low-mid price, deep depth** (unique quadrant)

**Fact-Grounding Note:**

- ✅ REPO: `docs/competitor-teardown-matrix.md` — competitor analysis with feature comparison
- ✅ REPO: `docs/COMPETITIVE_BOUNDARIES.md`, `docs/CATEGORY_POSITIONING.md`
- ⚠️ NEEDS VALIDATION: BlackLine/Trintech pricing ranges should be confirmed with current public pricing or analyst reports. Enterprise pricing is often opaque and may vary.
- ⚠️ NOTE: Competitor teardown in repo compares against Zapier, Supabase, Tray.io, and custom solutions — but does NOT include direct reconciliation competitors (Ledge, FloQast, ReconArt, Adra by Trintech). A stronger competitive slide would address these directly.

---

## SLIDE 11: Moat / Defensibility

**Title:** Settler Gets Harder to Replace Over Time — By Design

**Core Message:** Settler's moat is not UI polish or feature count. It's the accumulation of reconciliation rules, exception patterns, adjudication history, source reliability signals, and proofpack history that compounds per-tenant over time.

**Supporting Content:**

1. **Rules Engine compounding:** Each tenant creates custom matching rules (vendor name normalization, amount tolerances, source mapping). Rules track `match_count` and `success_rate`. After 6 months, a typical customer would have 50+ custom rules with 90%+ success rates — not replicable elsewhere. (Schema: `reconciliation_rules`, `rule_usage_events`)
2. **Exception intelligence:** `exception-intelligence.ts` (19KB) classifies exception patterns, tracks resolution paths, and builds per-tenant resolution memory. Over time, previously novel exceptions become recognized patterns with suggested resolutions.
3. **Cross-run intelligence:** `cross-run-intelligence.ts` (27KB) compares run outcomes across time, detecting trends in match rates, exception frequencies, and source reliability degradation.
4. **Proofpack history:** Every run generates a hash-linked evidence bundle. Cumulative proofpack history becomes the tenant's audit-ready institutional memory — portable as compliance evidence, but deeply integrated with Settler's workflow.
5. **Switching cost escalation:** Month 1: Settler is a reconciliation tool. Month 6: Settler contains the tenant's reconciliation policy, exception history, resolution patterns, and audit evidence. Month 12: Settler _is_ the tenant's reconciliation institutional memory. Replacing it means rebuilding all rules, re-establishing all patterns, and losing all evidence continuity.

**Anchor Visual:** "Compounding value" curve showing switching cost growing over time:

- Month 1: 5 rules, baseline match rate
- Month 6: 50+ rules, 90%+ match rate, exception patterns recognized
- Month 12: 100+ rules, 95%+ match rate, institutional memory established

**Fact-Grounding Note:**

- ✅ REPO: `docs/moat.md` — rules engine moat with schema, implementation, and investor narrative
- ✅ REPO: `packages/reconciliation-core/src/exception-intelligence.ts` (19,251 bytes)
- ✅ REPO: `packages/reconciliation-core/src/cross-run-intelligence.ts` (27,433 bytes)
- ✅ REPO: `packages/reconciliation-core/src/source-reliability.ts` (1,962 bytes)
- ✅ REPO: `packages/reconciliation-core/src/run-institutional-memory.ts` (5,648 bytes)
- ✅ REPO: `packages/reconciliation-core/src/run-proofpack-index.ts` (32,470 bytes)
- ⚠️ NEEDS VALIDATION: "50+ rules after 6 months" and "90%+ success rate" are projected estimates from `docs/moat.md`, not measured from real customer data. Must be validated with pilot customers.

---

## SLIDE 12: Ask / Investment Structure

**Title:** Raising $250K–$500K — Hybrid Structure: Partial Equity + Business Loan + Optional Revenue-Based Financing Path

**Core Message:** Settler is raising pre-seed capital through a hybrid instrument designed to align founder and investor interests while preserving founder control of a vertical SaaS company with strong unit economics potential.

### Capital Structure

| Component                   | Amount               | Structure                                                                    |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| **Equity component**        | 40–60% of raise      | Post-money SAFE or priced equity at pre-seed valuation                       |
| **Business loan component** | 40–60% of raise      | Fixed-term note with interest, secured by business assets                    |
| **Optional conversion**     | At investor election | Remove equity stake → convert to revenue-based financing / royalty agreement |

### Proposed Terms (Draft — Subject to Legal/Accounting Review)

**Equity Component:**

- Instrument: Post-money SAFE with valuation cap, OR priced equity round
- Valuation cap range: $3M–$5M post-money (consistent with pre-seed vertical SaaS benchmarks per Carta 2025 data)
- Target dilution: 10–15% (equity portion only)
- Pro-rata rights: Available for investors above minimum check size

**Business Loan Component:**

- Interest rate: 6–10% annual (market-rate for pre-seed business loan)
- Term: 24–36 months
- Repayment: Monthly or quarterly, deferred for first 6–12 months (runway preservation)
- Secured by: Business assets, IP, accounts receivable

**Optional Revenue-Based Financing / Royalty Conversion:**

- **At investor election** (not founder election), equity stake may be surrendered in exchange for:
  - Revenue share: 3–8% of gross monthly revenue
  - Repayment cap: 1.5x–2.5x of original equity investment amount
  - Term: Until repayment cap is reached (estimated 18–36 months at projected growth)
- **Why this benefits the investor:** Provides a cash-return path without waiting for exit event. De-risks the investment with ongoing cash flow.
- **Why this benefits the founder:** Recovers equity, preserves cap table cleanliness for future institutional rounds (Seed/Series A).

### Use of Funds (Milestone-Based Deployment)

| Phase                      | Timeline    | Allocation | Milestone                                                                |
| -------------------------- | ----------- | ---------- | ------------------------------------------------------------------------ |
| **Phase 1: First Revenue** | Months 1–4  | 35%        | 10 paying customers, $1K MRR, first proofpack delivered to real customer |
| **Phase 2: PMF Signal**    | Months 5–8  | 35%        | 50 paying customers, $5K MRR, <5% monthly churn, NPS >40                 |
| **Phase 3: Scale Prep**    | Months 9–12 | 20%        | 200 paying customers, $20K MRR, SOC 2 Type I initiated                   |
| **Buffer**                 | As needed   | 10%        | Contingency, unexpected opportunities                                    |

**Allocation breakdown:**

- 40% Product & Engineering (additional integrations, matching algorithm improvements, proofpack enhancements)
- 30% Sales & GTM (founder-led sales, content marketing, SEO, pilot program execution)
- 20% Operations (infrastructure scaling, SOC 2 prep, customer success)
- 10% Buffer

### Investor Upside

- **Equity path:** Participate in standard pre-seed → Seed → Series A valuation progression. If Settler reaches $1M ARR at Seed, typical 3–5x paper markup on pre-seed equity.
- **Loan path:** Fixed return via interest payments. Senior to equity in liquidation.
- **Revenue-based path:** Cash returns beginning at first revenue, without waiting for exit. Repayment cap provides defined upside.
- **Hybrid protection:** Investor holds BOTH equity upside AND loan repayment. If company succeeds: equity appreciates AND loan repays. If company grows slowly: loan still repays with interest.

### Investor Protection / Repayment Logic

- Loan component has repayment priority over equity distributions
- Information rights: Monthly revenue dashboard, quarterly investor update
- Board observer seat available for lead investor (>$100K)
- Standard protective provisions (consent for additional debt, major asset sales, change of control)
- Revenue-based financing conversion is one-way (investor choice) and cannot be reversed

### Why This Structure Fits Settler

1. **Vertical SaaS founder-control:** Reconciliation intelligence is a deep vertical — product decisions require domain expertise, not committee governance. Preserving founder control is strategically valuable.
2. **Strong unit economics:** 85%+ gross margins and $29–$499 ARPU mean the business can service loan repayment while reinvesting in growth.
3. **Revenue-alignment:** The optional RBF path means investors who want cash returns don't have to wait for a Series A or exit. They can convert to revenue share once Settler has meaningful MRR.
4. **Cap table cleanliness:** If early investors convert to RBF, the cap table is cleaner for institutional Seed/Series A investors — which increases probability of follow-on funding.
5. **Pre-seed risk mitigation:** The loan component provides downside protection that a pure SAFE does not. If the company doesn't achieve venture-scale returns, the loan still repays.

### Critical Disclaimer

> **All percentages, valuation caps, interest rates, repayment caps, royalty rates, and conversion terms presented here are draftable structure options — NOT final legal terms.** Exact terms require review by qualified legal counsel and tax/accounting advisors for both founder and investor(s). This structure is presented to illustrate the intended framework and alignment principles. Nothing in this deck constitutes legal or financial advice.

**Anchor Visual:** Capital structure diagram showing:

- Total raise → splits into Equity Component + Loan Component
- Arrow from Equity Component → optional one-way conversion to Revenue-Based Financing
- Milestone timeline below showing capital deployment phases

**Fact-Grounding Note:**

- ✅ SOURCED: Pre-seed valuations $4M–$6M post-money median (Carta 2025, ValueAddVC). $3M–$5M range used here reflects conservative positioning for pre-revenue company.
- ✅ SOURCED: RBF terms — 2–15% revenue share, 1.3x–2.5x repayment cap, 12–36 month typical term (multiple RBF market research sources)
- ✅ SOURCED: Pre-seed typical raise $750K–$1.5M (Carta 2025). Settler's $250K–$500K target is deliberately smaller, reflecting capital efficiency and hybrid structure.
- ✅ REPO: `docs/INVESTOR_NARRATIVE.md` originally cited "$500K–$1M seed round" — this deck adjusts to $250K–$500K pre-seed to match actual stage and hybrid structure.
- ⚠️ NEEDS LEGAL REVIEW: Hybrid equity + loan + RBF structures have state-level regulatory implications. SAFE-to-RBF conversion mechanics need securities counsel.
- ⚠️ NEEDS ACCOUNTING REVIEW: Tax treatment of RBF payments (revenue expense vs. loan repayment vs. dividend) varies by jurisdiction and instrument design.

---

## Appendix A: Claims Requiring External Sourcing

| Claim                                               | Status                | Source                                                                  |
| --------------------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| Reconciliation software market $2.0–2.4B (2024)     | ✅ Sourced            | Polaris Market Research, Fortune Business Insights, Precedence Research |
| Market CAGR 10–15%                                  | ✅ Sourced            | Multiple analyst reports (2025–2034 projections)                        |
| 50% of finance teams take 6+ business days to close | ✅ Sourced            | Ledge.co, CFO.com, Forbes surveys                                       |
| 94% of teams use Excel in close process             | ✅ Sourced            | Ledge.co survey                                                         |
| 20–50 hours/month on reconciliation                 | ✅ Sourced            | CFO.com, Forbes                                                         |
| Pre-seed valuations $4M–$6M post-money              | ✅ Sourced            | Carta 2025, ValueAddVC                                                  |
| RBF typical terms (2–15%, 1.3x–2.5x cap)            | ✅ Sourced            | Multiple RBF market research                                            |
| "50+ integrations" claim in repo docs               | ⚠️ Needs audit        | Repo says 50+ but competitor teardown shows 10+. Honest count needed.   |
| "95%+ instant match resolution"                     | ⚠️ Needs validation   | Projected from rule engine design, not measured from customer data      |
| BlackLine/Trintech pricing                          | ⚠️ Needs confirmation | Enterprise pricing is opaque; ranges are estimated                      |
| 50,000 B2B SaaS companies in US (ICP base)          | ⚠️ Needs sourcing     | Cited in repo docs, needs independent validation                        |

## Appendix B: Repo Evidence Used

| Evidence                             | File / Path                                                               |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Product description and architecture | `README.md`, `PRODUCT_OVERVIEW.md`                                        |
| Reconciliation engine source         | `packages/reconciliation-core/src/` (56 files)                            |
| Proofpack generation                 | `packages/reconciliation-core/src/run-proofpack-index.ts` (32KB)          |
| Exception intelligence               | `packages/reconciliation-core/src/exception-intelligence.ts` (19KB)       |
| Cross-run intelligence               | `packages/reconciliation-core/src/cross-run-intelligence.ts` (27KB)       |
| Source reliability                   | `packages/reconciliation-core/src/source-reliability.ts`                  |
| Institutional memory                 | `packages/reconciliation-core/src/run-institutional-memory.ts`            |
| Tenant isolation invariants          | `SECURITY_INVARIANTS.md` (9 invariants, code-backed)                      |
| RLS policies                         | `supabase/migrations/` (49 migration files)                               |
| Pricing enforcement                  | `docs/PRICING.md`, `docs/ECONOMICS.md`, `config/pricing-simple.ts`        |
| Billing / Stripe                     | `packages/web/src/domain/billing/stripeService.ts`                        |
| ICP definitions                      | `docs/ICP_DEFINITIONS.md`                                                 |
| Moat / rules engine                  | `docs/moat.md`, `docs/settler-defense-moat.md`                            |
| Investor narrative (existing)        | `docs/INVESTOR_NARRATIVE.md`, `INVESTOR_OVERVIEW.md`                      |
| GTM strategy                         | `GTM_STRATEGY.md`, `docs/GTM_STRATEGY.md`                                 |
| Unit economics                       | `docs/UNIT_ECONOMICS.md`, `docs/ECONOMICS.md`                             |
| Due diligence checklist              | `docs/DUE_DILIGENCE.md`                                                   |
| Competitor analysis                  | `docs/competitor-teardown-matrix.md`                                      |
| Verification infrastructure          | `package.json` (347 scripts including verify:_, validate:_, test:_, qa:_) |

## Appendix C: Missing Investor Diligence Items

1. **Legal entity structure** — Not documented in repo. Entity type, jurisdiction, incorporation status needed.
2. **Cap table** — No existing cap table found in repo. Pre-existing investors, advisors, or option grants unclear.
3. **Financial model** — No formal financial model spreadsheet. Projections in `docs/UNIT_ECONOMICS.md` are narrative, not model-backed.
4. **Customer evidence** — No customer interviews, LOIs, pilot results, or revenue data in repo.
5. **Founder bio / team page** — `docs/founder-story.md` exists but founder identity and background need verification.
6. **IP ownership** — `docs/DUE_DILIGENCE.md` says "Proprietary codebase" but license file shows it's not fully proprietary (`LICENSE` file exists at root).
7. **SOC 2 status** — Documented as "Ready" in due diligence doc but not initiated. Pre-revenue is normal for pre-seed.
8. **Actual integration count** — Discrepancy between "50+" and "10+" needs resolution.
9. **Test coverage metrics** — Due diligence doc says "[To be measured]" for test coverage.
10. **Competitive analysis gaps** — No analysis of direct reconciliation competitors (FloQast, Ledge, ReconArt, Adra).

## Appendix D: Recommended Next Artifacts

| Artifact                            | Purpose                                                                             | Priority |
| ----------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| **One-page investor memo**          | Single page for cold outreach and angel syndicate submissions                       | P0       |
| **Financial model (spreadsheet)**   | 3-year model with revenue, costs, headcount, milestones, scenarios                  | P0       |
| **Market map**                      | Visual landscape of reconciliation tools by segment, price, and capability          | P1       |
| **Demo script**                     | 10-minute live demo walkthrough: ingest → match → review → proofpack                | P1       |
| **Product screenshots (annotated)** | 8–12 screenshots covering full workflow for deck insertion                          | P1       |
| **Due diligence folder checklist**  | Organized folder with legal, financial, technical, and product evidence             | P1       |
| **Pilot program one-pager**         | Structured pilot offer for first 10 customers with success criteria                 | P2       |
| **ROI calculator**                  | Interactive calculator showing labor savings vs. Settler cost by transaction volume | P2       |
| **Competitive battlecard**          | 1-page per competitor (BlackLine, FloQast, Ledge, spreadsheets)                     | P2       |

---

_This document was generated from Settler repository evidence and sourced market research. It represents an outline, not final slide prose. All financial projections, market claims, and investment terms should be independently verified before use in investor communications._
