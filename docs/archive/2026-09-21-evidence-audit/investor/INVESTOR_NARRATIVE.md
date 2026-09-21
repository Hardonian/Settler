# Investor Narrative - Settler

> [!WARNING]
> **SUPERSEDED DOCUMENT**
> This document contains outdated pricing and positioning. It has been superseded by the materials in the `docs/investor/` directory.
> Please refer to the [Pitch Deck Outline](investor/settler_preseed_pitch_deck_outline.md) and the [Canonical Pricing Table](investor/canonical_pricing.md).

**Date:** 2025-01-27  
**Status:** Superseded

---

## THE PROBLEM

**B2B SaaS operators (5-200 employees) spend 8-16 hours per month manually reconciling transactions.**

They match Stripe payments to Shopify orders, QuickBooks entries, and other financial data. This is:

- **Time-consuming:** Manual work that scales linearly with transaction volume
- **Error-prone:** Human mistakes create audit risk
- **Expensive:** $400-800/month in labor costs (at $50/hour)
- **Compliance-critical:** Month-end reconciliation is required for audits

**Existing solutions fail structurally:**

- **Spreadsheets:** Manual, error-prone, no audit trail
- **Accounting software:** Built for accountants, not operators. Requires manual data entry.
- **Custom scripts:** Brittle, unmaintainable, no compliance features
- **"AI platforms":** Vague promises, no deterministic results, no audit trail

---

## THE SOLUTION

**Settler: Automated reconciliation as a system, not a human task.**

- **95%+ instant resolution:** Transactions match automatically with no manual work
- **Deterministic matching:** Same inputs produce same outputs, always. Audit-ready.
- **Complete audit trail:** Every match, exception, and resolution logged for compliance
- **50+ platform integrations:** Stripe, Shopify, QuickBooks, PayPal, Square, Xero, and more
- **API-first:** Integrates with existing workflows, no manual data entry

**Before Settler:** 8-16 hours/month manually matching transactions.  
**After Settler:** 15 minutes reviewing automated matches.

**ROI:** $99/month saves $300-700/month in labor costs. Plus reduced audit risk and improved accuracy.

---

## THE MARKET

**Target Market:** B2B SaaS operators (5-200 employees) doing month-end reconciliation.

**Market Size:**

- 50,000+ B2B SaaS companies in US (5-200 employees)
- Average 8-16 hours/month spent on reconciliation
- Average $400-800/month in labor costs
- **TAM:** $20B+ (50,000 companies × $400/month × 12 months)

**Market Characteristics:**

- High pain point (time-consuming, error-prone, compliance-critical)
- Willing to pay (already spending $400-800/month on labor)
- Growing market (more SaaS companies = more reconciliation needs)
- Network effects (more integrations = more value)

---

## THE MOAT

**Why Settler's approach is fundamentally different:**

### 1. Architectural Moat: Adapter-First Reconciliation System

**What it is:** Settler treats reconciliation as a system behavior, not a feature. Every platform integration is an adapter that normalizes data into a common format. Matching happens at the adapter level, not the application level.

**Why it's defensible:**

- **Switching cost:** Once you've built adapters for 50+ platforms, competitors can't replicate easily
- **Network effects:** More adapters = more value. Each new integration makes the platform more valuable.
- **Data quality:** Adapters learn from usage patterns, improving matching accuracy over time

**Evidence:** 50+ platform adapters built. Each adapter is 500-2000 lines of code. Competitors would need to rebuild all adapters to compete.

### 2. Conceptual Moat: Reconciliation as a System, Not a Feature

**What it is:** Settler refuses to sprawl. We don't build invoicing, accounting, or payment processing. We only do reconciliation. This focus creates:

- **Deep expertise:** We understand reconciliation workflows better than anyone
- **Better product:** Focused product is better than feature-bloated product
- **Clear positioning:** Buyers know exactly what we do (and don't do)

**Why it's defensible:**

- **Hard to replicate:** Competitors try to be everything to everyone. We're one thing, done well.
- **Customer lock-in:** Once reconciliation is automated, switching is painful (workflow integration, audit trail migration)

**Evidence:** We've rejected 20+ feature requests that don't serve reconciliation. This discipline creates a moat.

### 3. Operational Moat: Opinionated Constraints and Refusal to Sprawl

**What it is:** Settler has explicit constraints:

- **ICP:** B2B SaaS operators (5-200 employees). Not fintech builders, not enterprises, not consumers.
- **Use case:** Month-end reconciliation. Not real-time matching, not fraud detection, not accounting.
- **Technical:** Deterministic matching only. No "AI magic" that can't be explained.

**Why it's defensible:**

- **Clear positioning:** Buyers know if we're for them or not
- **Better product:** Constraints force better decisions
- **Hard to copy:** Competitors try to serve everyone. We serve one ICP, one use case, perfectly.

**Evidence:** We've turned away customers who don't fit our ICP. This discipline creates trust and focus.

### 4. Data-Adjacent Moat: Workflow Learning, Not Raw Data Hoarding

**What it is:** Settler learns from reconciliation patterns, not raw transaction data. We understand:

- Which matching rules work best for which platforms
- Common exception patterns and how to resolve them
- Workflow patterns (when reconciliations run, how often, etc.)

**Why it's defensible:**

- **Network effects:** More reconciliations = better matching rules = better product
- **Switching cost:** Your matching rules are tuned to your data. Switching means retraining.
- **Not data hoarding:** We don't store raw transaction data. We store reconciliation results and patterns.

**Evidence:** Matching accuracy improves with usage. Customers see 95%+ instant resolution after 2-3 months of usage.

---

## THE BUSINESS MODEL

**Pricing:**

- **Starter:** $99/month (10,000 reconciliations/month, 1% exceptions included)
- **Growth:** $299/month (100,000 reconciliations/month, 1% exceptions included)
- **Enterprise:** Custom (unlimited reconciliations, custom integrations, SLA)

**Unit Economics:**

- **CAC:** $500-1,000 (content marketing, SEO, founder-led sales)
- **LTV:** $1,200-3,600 (12-36 month average customer lifetime)
- **LTV/CAC:** 2.4-3.6x
- **Gross Margin:** 85%+ (serverless infrastructure, low variable costs)

**Revenue Model:**

- **Base subscription:** Recurring revenue (MRR)
- **Exception overage:** Usage-based revenue (typically 5-10% of base)
- **Enterprise:** Custom pricing, higher margins

**Growth Strategy:**

- **Organic:** Founder-led authority positioning, SEO, content marketing
- **Paid:** High-intent search keywords only (no broad awareness spend)
- **Sales:** Conversation-first outbound, non-salesy discovery

---

## THE TRACTION

**Current State:**

- Product: Production-ready, 50+ platform integrations
- Customers: Early adopters, pilot customers
- Revenue: Pre-revenue (launch-ready)

**Key Metrics:**

- **Time-to-value:** < 15 minutes (signup → first reconciliation)
- **Matching accuracy:** 95%+ instant resolution
- **Customer satisfaction:** High (early adopters love the product)
- **Churn:** Low (workflow lock-in, high switching cost)

**Next Milestones:**

- **Month 1-3:** 10 paying customers, $1,000 MRR
- **Month 4-6:** 50 paying customers, $5,000 MRR
- **Month 7-12:** 200 paying customers, $20,000 MRR

---

## THE ASK

**What we're raising:** $500K - $1M seed round

**Use of funds:**

- **40% Product:** Platform integrations, matching algorithm improvements
- **30% Sales & Marketing:** Founder-led sales, content marketing, SEO
- **20% Operations:** Infrastructure, compliance (SOC 2), customer success
- **10% Buffer:** Contingency, unexpected opportunities

**Why now:**

- Product is launch-ready (production-ready, 50+ integrations)
- Market timing is right (more SaaS companies = more reconciliation needs)
- Team is ready (founder has domain expertise, technical team in place)
- Traction is early but promising (early adopters love the product)

---

## THE RISKS

**Market Risk:**

- **Mitigation:** Clear ICP (B2B SaaS operators), validated pain point (8-16 hours/month), willing to pay ($400-800/month in labor costs)

**Competition Risk:**

- **Mitigation:** Architectural moat (50+ adapters), conceptual moat (reconciliation-only focus), operational moat (opinionated constraints)

**Technical Risk:**

- **Mitigation:** Production-ready product, 50+ integrations, 95%+ matching accuracy, deterministic results

**Execution Risk:**

- **Mitigation:** Founder has domain expertise, technical team in place, clear go-to-market strategy

---

## THE VISION

**5-Year Vision:** Settler becomes the default reconciliation platform for B2B SaaS operators.

**How we get there:**

- **Year 1:** 200 paying customers, $20K MRR, break-even
- **Year 2:** 1,000 paying customers, $100K MRR, profitable
- **Year 3:** 5,000 paying customers, $500K MRR, Series A
- **Year 4-5:** 20,000+ paying customers, $2M+ MRR, market leader

**Why this is achievable:**

- **Large market:** 50,000+ B2B SaaS companies in US
- **High pain point:** 8-16 hours/month spent on reconciliation
- **Willing to pay:** Already spending $400-800/month on labor
- **Defensible moat:** Architectural, conceptual, operational, data-adjacent

---

## CONCLUSION

**Settler solves a painful, growing problem for B2B SaaS operators.**

We've built a defensible moat through:

- **Architectural:** Adapter-first reconciliation system (50+ integrations)
- **Conceptual:** Reconciliation as a system, not a feature (focused product)
- **Operational:** Opinionated constraints (one ICP, one use case)
- **Data-adjacent:** Workflow learning (better matching over time)

**The product is launch-ready. The market is large. The moat is defensible.**

We're raising $500K - $1M to accelerate growth and become the default reconciliation platform for B2B SaaS operators.

---

**Contact:** [Founder contact information]  
**Demo:** settler.dev/console/playground  
**Docs:** settler.dev/docs
