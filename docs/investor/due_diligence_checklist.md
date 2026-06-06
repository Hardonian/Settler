# Settler — Due Diligence Folder Checklist

**Purpose:** Organize all diligence materials an investor may request, with status tracking
**Last Updated:** June 2026

---

## How to Use This Checklist

Pre-assemble all items below BEFORE investor meetings. When an investor asks for diligence materials, point them to this folder. Each item has a status (✅ Ready, 🔄 In Progress, ❌ Missing, ⚠️ Needs Update).

---

## 1. Corporate / Legal

| #    | Item                            | Status     | Location                            | Notes                                                                                               |
| ---- | ------------------------------- | ---------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1.1  | Certificate of Incorporation    | ❌ Missing | —                                   | Entity formation needed. Delaware C-Corp recommended for VC compatibility.                          |
| 1.2  | Operating Agreement / Bylaws    | ❌ Missing | —                                   | Required after incorporation.                                                                       |
| 1.3  | Cap Table                       | ❌ Missing | —                                   | No existing investors, advisors, or options documented. Create on Carta/Pulley after incorporation. |
| 1.4  | Founder Employment Agreement    | ❌ Missing | —                                   | IP assignment clause critical.                                                                      |
| 1.5  | IP Assignment Agreement         | ❌ Missing | —                                   | Must confirm all IP is owned by the company, not the individual.                                    |
| 1.6  | Terms of Service                | ✅ Ready   | `/legal/terms` route in app         | Review for investor-specific concerns.                                                              |
| 1.7  | Privacy Policy                  | ✅ Ready   | `/legal/privacy` route in app       | GDPR, CCPA coverage needed.                                                                         |
| 1.8  | Data Processing Agreement (DPA) | ✅ Ready   | `/legal/dpa` route in app           | Template available.                                                                                 |
| 1.9  | Acceptable Use Policy           | ✅ Ready   | `/legal/aup` route in app           |                                                                                                     |
| 1.10 | Subprocessor List               | ✅ Ready   | `/legal/subprocessors` route in app |                                                                                                     |
| 1.11 | Patent / Trademark Status       | ❌ Missing | —                                   | Consider trademark for "Settler" name. Patent TBD.                                                  |
| 1.12 | Open Source License Compliance  | ✅ Ready   | `LICENSE` file at repo root         | License is proprietary, dual licensing structure noted.                                             |

## 2. Financial

| #   | Item                       | Status     | Location                                            | Notes                                                 |
| --- | -------------------------- | ---------- | --------------------------------------------------- | ----------------------------------------------------- |
| 2.1 | 3-Year Financial Model     | ✅ Ready   | `docs/investor/financial_model.md`                  | Three scenarios (base, conservative, aggressive).     |
| 2.2 | Canonical Pricing Table    | ✅ Ready   | `docs/investor/canonical_pricing.md`                | Single source of truth.                               |
| 2.3 | Unit Economics Summary     | ✅ Ready   | `docs/UNIT_ECONOMICS.md` + financial model          | Cross-reference both.                                 |
| 2.4 | Bank Statements            | ❌ Missing | —                                                   | Business bank account needed.                         |
| 2.5 | P&L Statement (Historical) | ❌ Missing | —                                                   | No revenue history. Projected P&L in financial model. |
| 2.6 | Burn Rate Calculation      | ✅ Ready   | `docs/investor/financial_model.md` (runway section) |                                                       |
| 2.7 | Revenue Data / Dashboard   | ❌ Missing | —                                                   | Pre-revenue. Stripe dashboard will serve once live.   |
| 2.8 | Tax Returns                | ❌ Missing | —                                                   | Business not yet generating taxable income.           |

## 3. Product / Technical

| #    | Item                        | Status       | Location                                                                   | Notes                                                                           |
| ---- | --------------------------- | ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 3.1  | Product Overview            | ✅ Ready     | `PRODUCT_OVERVIEW.md`                                                      |                                                                                 |
| 3.2  | Architecture Diagram        | ✅ Ready     | `README.md` (architecture section)                                         | Rust kernel + TS control plane + TigerBeetle + Supabase                         |
| 3.3  | Security Invariants         | ✅ Ready     | `SECURITY_INVARIANTS.md`                                                   | 9 invariants, all code-backed.                                                  |
| 3.4  | RLS Policy Coverage         | ✅ Ready     | `supabase/migrations/20250122000000_rls_enforcement_critical.sql` + others |                                                                                 |
| 3.5  | Integration Audit           | ✅ Ready     | `docs/investor/integration_audit.md`                                       | 25+ unique platforms, 33 total adapters.                                        |
| 3.6  | Test Coverage Report        | ⚠️ Partial   | Test files exist across packages                                           | Coverage metrics not measured. Run `pnpm test -- --coverage` to generate.       |
| 3.7  | Verification Infrastructure | ✅ Ready     | `package.json` (347 scripts)                                               | `verify`, `verify:security`, `verify:moat-readiness`, `test:reconciliation:e2e` |
| 3.8  | Database Schema             | ✅ Ready     | `prisma/schema.prisma` + `supabase/migrations/`                            | 49+ migration files.                                                            |
| 3.9  | API Documentation           | ⚠️ Partial   | `/api/v1/` routes + OpenAPI route                                          | Need consolidated API reference.                                                |
| 3.10 | Dependency Audit            | ⚠️ Needs Run | Run `npm audit` or `pnpm audit`                                            | Check for known vulnerabilities.                                                |
| 3.11 | Proofpack Verification      | ✅ Ready     | `pnpm requiem:verify`                                                      | Can demo live.                                                                  |
| 3.12 | CI/CD Pipeline              | ✅ Ready     | `.github/workflows/`                                                       |                                                                                 |

## 4. Go-to-Market

| #   | Item                    | Status     | Location                                                             | Notes                                    |
| --- | ----------------------- | ---------- | -------------------------------------------------------------------- | ---------------------------------------- |
| 4.1 | GTM Strategy            | ✅ Ready   | `GTM_STRATEGY.md`                                                    | Founder-led PLG + content + outbound.    |
| 4.2 | ICP Definitions         | ✅ Ready   | `docs/ICP_DEFINITIONS.md`                                            | 5 detailed ICPs with trigger events.     |
| 4.3 | Competitive Analysis    | ✅ Ready   | `docs/investor/market_map.md` + `docs/competitor-teardown-matrix.md` |                                          |
| 4.4 | Competitive Battlecards | ✅ Ready   | `docs/investor/competitive_battlecards.md`                           | Per-competitor.                          |
| 4.5 | Category Positioning    | ✅ Ready   | `docs/CATEGORY_POSITIONING.md`                                       |                                          |
| 4.6 | Customer Testimonials   | ❌ Missing | —                                                                    | Pre-customer. First 10 pilots needed.    |
| 4.7 | Case Studies            | ❌ Missing | —                                                                    | Requires completed pilot programs.       |
| 4.8 | Pilot Program Plan      | ✅ Ready   | `docs/investor/pilot_program.md`                                     | Structured offer for first 10 customers. |

## 5. Investor Materials

| #   | Item                           | Status        | Location                                              | Notes                                                                                 |
| --- | ------------------------------ | ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 5.1 | Pitch Deck Outline (12 slides) | ✅ Ready      | `docs/investor/settler_preseed_pitch_deck_outline.md` | Full outline with fact-grounding.                                                     |
| 5.2 | One-Page Investor Memo         | ✅ Ready      | `docs/investor/one_page_investor_memo.md`             | For cold outreach.                                                                    |
| 5.3 | Demo Script                    | ✅ Ready      | `docs/investor/demo_script.md`                        | 10-minute live demo.                                                                  |
| 5.4 | Market Map                     | ✅ Ready      | `docs/investor/market_map.md`                         |                                                                                       |
| 5.5 | ROI Calculator                 | ✅ Ready      | `docs/investor/roi_calculator.md`                     | Self-serve calculation tool.                                                          |
| 5.6 | Moat Documentation             | ✅ Ready      | `docs/moat.md`                                        | Rules engine moat with schema evidence.                                               |
| 5.7 | Defense Moat Analysis          | ✅ Ready      | `docs/settler-defense-moat.md`                        | Security + business fortification.                                                    |
| 5.8 | Product Screenshots            | 🔄 Spec Ready | `docs/investor/product_screenshots_spec.md`           | 12 screenshots defined, need capture.                                                 |
| 5.9 | Existing Investor Narrative    | ✅ Ready      | `docs/INVESTOR_NARRATIVE.md`                          | Marked as superseded. Refer to `docs/investor/settler_preseed_pitch_deck_outline.md`. |

## 6. Team / Operations

| #   | Item                       | Status     | Location                             | Notes                                                                    |
| --- | -------------------------- | ---------- | ------------------------------------ | ------------------------------------------------------------------------ |
| 6.1 | Founder Bio / Resume       | ✅ Ready   | `docs/investor/founder_resume.md`    | Founder profile tailored for investors.                                  |
| 6.2 | Hiring Plan                | ✅ Ready   | `docs/investor/hiring_plan.md`       | First 12 months hiring plan aligned with financial model.                |
| 6.3 | Advisory Board             | ❌ Missing | —                                    | No advisors documented. Consider domain experts in fintech/accounting.   |
| 6.4 | Board Structure (Proposed) | ❌ Missing | —                                    | Define before term sheet. Typical: 2 founders + 1 investor for pre-seed. |
| 6.5 | Operational Runbooks       | ✅ Ready   | `/runbooks` route + operational docs |                                                                          |

---

## Summary Scorecard

| Category            | Ready  | Partial | Missing | Total              |
| ------------------- | ------ | ------- | ------- | ------------------ |
| Corporate / Legal   | 5      | 0       | 7       | 12                 |
| Financial           | 4      | 0       | 4       | 8                  |
| Product / Technical | 8      | 3       | 0       | 11 (+ 1 needs run) |
| Go-to-Market        | 5      | 0       | 2       | 7 (+ 1 ready)      |
| Investor Materials  | 9      | 0       | 0       | 9                  |
| Team / Operations   | 3      | 0       | 2       | 5                  |
| **TOTAL**           | **34** | **3**   | **15**  | **52**             |

## Critical Path Before First Investor Meeting

1. **Incorporate** (Delaware C-Corp) — unlocks items 1.1, 1.2, 1.3
2. **IP assignment** — founder assigns all code to company (1.4, 1.5)
3. **Capture product screenshots** — run demo seed, capture 12 screenshots (5.8)
4. **Run dependency audit** — `pnpm audit` (3.10)
5. **Generate test coverage** — `pnpm test -- --coverage` (3.6)
6. **Prepare founder resume** — formal one-page (6.1)

> Items 1.1–1.5 are legal prerequisites. Do NOT present the hybrid investment structure to investors before incorporation is complete.
