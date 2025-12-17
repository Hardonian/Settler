# Settler.dev — Investor Overview

**Version:** 1.0  
**Date:** January 2026  
**Status:** Pre-revenue / Early Stage  
**Classification:** Investor Materials

---

## Executive Summary

**Settler.dev** is an API-first reconciliation platform that automates financial data matching across payment processors, e-commerce platforms, and accounting systems. We eliminate manual reconciliation work—reducing hours of manual matching to minutes of automated processing.

**Current Status:** Pre-revenue, early product development. Core reconciliation engine implemented. Stripe billing integrated. Public website live. No paying customers as of January 2026.

**Investment Ask:** Seed round to accelerate product development, acquire initial customers, and establish product-market fit.

---

## Problem

### The Pain Point

Mid-market e-commerce and SaaS companies ($1M-$50M ARR) spend **10+ hours per week** manually reconciling transactions across:
- Payment processors (Stripe, PayPal, Square)
- E-commerce platforms (Shopify, WooCommerce)
- Accounting systems (QuickBooks, Xero, NetSuite)
- Internal databases

### Why This Matters

1. **Revenue Leakage:** Unmatched transactions = lost revenue
2. **Compliance Risk:** Audit failures, regulatory violations
3. **Operational Cost:** Finance teams waste time on manual matching
4. **Scalability:** Manual processes don't scale with growth

### Market Size

- **TAM:** $2.3B (reconciliation software market, 2024)
- **SAM:** $500M (mid-market e-commerce/SaaS companies)
- **SOM:** $10M (Year 1-3 target)

---

## Solution

### What Settler Does

Settler provides a **reconciliation-as-a-service API** that:
1. **Matches transactions** across multiple platforms automatically
2. **Parses receipts** from PDFs/images into structured JSON
3. **Converts currencies** with deterministic math (no floating-point errors)
4. **Manages feature flags** for phased rollouts

### How It Works

1. Developer integrates Settler SDK (5-minute setup)
2. Configure source/target adapters (Stripe → QuickBooks, Shopify → Database, etc.)
3. Define matching rules (amount tolerance, date windows, custom logic)
4. Settler processes reconciliation jobs automatically
5. Results available via API, webhooks, or dashboard

### Technical Architecture

- **Backend:** Node.js/TypeScript, PostgreSQL (Supabase), Redis (Upstash)
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Deployment:** Vercel (serverless)
- **Billing:** Stripe (subscriptions, webhooks, customer portal)
- **Architecture:** Hexagonal (Ports & Adapters), CQRS, Event-Driven

---

## Market & ICP

### Ideal Customer Profile

**Primary ICP:** Mid-market e-commerce and SaaS companies
- **Company Size:** 10-500 employees
- **Revenue:** $1M-$50M ARR
- **Transaction Volume:** 1,000+ transactions/month
- **Platforms:** Using 2+ payment/e-commerce platforms

**Buyer Personas:**
1. **CTO/VP Engineering** (technical buyer) — Wants to eliminate custom reconciliation code
2. **CFO/Finance Director** (business buyer) — Needs compliance, audit trails, reduced manual work
3. **Operations Manager** (end user) — Spends hours daily on reconciliation

### Go-to-Market Strategy

**Phase 1 (Months 1-6):** Developer-Led Growth
- Product Hunt launch
- Technical blog posts
- Developer community engagement (Twitter, Hacker News)
- Free tier (1K reconciliations/month)
- **Target:** 1,000 beta users → 100 paying customers → $5K MRR

**Phase 2 (Months 7-12):** Product-Led Growth
- Self-service onboarding
- Comprehensive documentation
- Interactive playground
- Content marketing and SEO
- **Target:** 5,000 users → 1,000 paying customers → $50K MRR

**Phase 3 (Year 2+):** Sales-Assisted Growth
- Enterprise sales team
- Partner channel (agencies, consultants)
- Paid acquisition
- Referral program

---

## Business Model

### Pricing

| Tier | Price | Reconciliations/Month | Target Customer |
|------|-------|----------------------|-----------------|
| **Free** | $0 | 1,000 | Developers, small projects |
| **Commercial** | $99/month | 100,000 | Growing businesses |
| **Enterprise** | Custom | Unlimited | Large organizations |

**Note:** Pricing page shows Free, Commercial ($99), Enterprise (Custom). This is the current, implemented pricing model.

### Revenue Model

- **Primary:** Subscription-based SaaS (monthly/annual)
- **Secondary:** Usage-based overage fees for high-volume customers
- **Enterprise:** Custom pricing with dedicated infrastructure

### Unit Economics (Projected)

- **CAC:** $200 (SMB), $5,000 (mid-market), $50,000 (enterprise)
- **LTV:** $1,800 (SMB), $50,000 (mid-market), $500,000 (enterprise)
- **LTV:CAC:** 9:1 (SMB), 10:1 (mid-market), 10:1 (enterprise)
- **Payback Period:** 1.3 months (SMB), 12 months (mid-market), 18 months (enterprise)

**Note:** These are projections. No actual customer data exists yet.

---

## Differentiation

### Competitive Advantages

1. **Developer-First:** API design like Stripe/Resend—5-minute integration vs. weeks/months
2. **Pricing:** 10-100x cheaper than enterprise solutions (BlackLine: $100K+, Settler: $99/month)
3. **Speed:** Real-time reconciliation vs. batch processing
4. **Composability:** Adapter SDK enables custom integrations
5. **Network Effects:** More adapters → more customers → more adapters

### Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Differentiation |
|------------|-----------|------------|---------------------|
| **BlackLine** | Comprehensive, SOC 2 | Expensive ($100K+), slow setup (3-6 months) | 10-100x cheaper, 5-minute setup |
| **QuickBooks/Xero** | Widely adopted | Manual process, limited API, batch processing | Real-time, API-first, composable |
| **Stripe Revenue Recognition** | API-first, real-time | Stripe-only, no multi-platform | Multi-platform, 50+ adapters |
| **Fivetran** | Data integration | Not purpose-built, expensive | Purpose-built for reconciliation |
| **Custom Scripts** | Flexible | High maintenance, no compliance | Compliance built-in, maintained |

---

## Traction

### Current Status

**As of January 2026:**
- **Paying Customers:** 0
- **MRR:** $0
- **Beta Users:** <50 (estimated, not tracked)
- **GitHub Stars:** Not publicly tracked
- **Website Traffic:** Not disclosed

**What Exists:**
- ✅ Core reconciliation engine (implemented)
- ✅ Stripe billing integration (implemented)
- ✅ Public website (live)
- ✅ Developer console (implemented)
- ✅ API documentation (in progress)
- ✅ SDKs (TypeScript, Python, Go, Ruby — in progress)

**What Doesn't Exist:**
- ❌ Paying customers
- ❌ Production usage data
- ❌ Customer testimonials (real ones)
- ❌ Case studies
- ❌ SOC 2 certification (planned Q3 2026)
- ❌ 10+ adapters (currently 2-3: Stripe, Shopify, basic database)

### Roadmap (Next 12 Months)

**Q1 2026:**
- Public beta launch
- Product Hunt launch
- 100 beta users
- 10 paying customers → $1K MRR

**Q2 2026:**
- Free tier launch
- Blog content (10+ posts)
- 1,000 users → 100 paying customers → $10K MRR

**Q3 2026:**
- SOC 2 Type II certification (target)
- 10+ adapters (QuickBooks, PayPal, Square, Xero)
- Enterprise features (SSO, white-label reports)
- 500 paying customers → $50K MRR

**Q4 2026:**
- 1,000 paying customers → $100K MRR
- Self-service onboarding
- Open-source adapter SDK

---

## Moat & Defensibility

### Technical Moat

**Recon Core Architecture:** Reconciliation-as-a-Service is the architectural core, not just a feature. Competitors would need to rebuild their entire architecture to match.

**Strengths:**
- Network effects: More reconciliations = better matching algorithms
- Data moat: Reconciliation patterns improve with usage
- Switching costs: Core architecture is hard to replicate

**Weaknesses:**
- Open source risk: Competitors could open-source similar tools
- Big tech entry: AWS, Google could build similar (mitigation: developer-first, not infrastructure-first)

### Process Moat

**Developer Experience:** 5-minute integration vs. weeks/months for competitors. Strong SDK ecosystem (TypeScript, Python, Go, Ruby).

**Strengths:**
- Network effects: More developers = more integrations
- Community: Developer community creates content
- Switching costs: Developers build on our APIs

**Weaknesses:**
- Early stage: No established developer community yet
- Limited adapters: Only 2-3 adapters currently (need 10+)

### Data Moat

**Usage Analytics:** Usage patterns inform product evolution, cost optimization, health optimization.

**Strengths:**
- Proprietary data: Usage patterns are unique
- Feedback loop: Intelligence improves product

**Weaknesses:**
- No data yet: Pre-revenue, no usage data to analyze

### Overall Moat Assessment

**Current Strength:** 3/10 (early stage, limited moats)

**Potential Strength:** 7/10 (if execution succeeds)
- Technical depth: Recon Core architecture is hard to replicate
- Developer ecosystem: Network effects from developer adoption
- Vertical modules: Industry-specific solutions (future)

**Timeline to Strong Moats:**
- Year 1: Technical moat (Recon Core architecture)
- Year 2: Product moat (Vertical modules)
- Year 3: Intelligence moat (AI self-improvement)
- Year 4: Network moat (Developer ecosystem)

---

## Risks & Mitigations

### Technical Risks

**Risk:** Scaling challenges with high-volume reconciliation  
**Mitigation:** Built on serverless architecture (Vercel, Supabase, Upstash). Designed for horizontal scaling.

**Risk:** API dependency failures (Stripe, Shopify, etc.)  
**Mitigation:** Adapter abstraction layer, fallback plans, monitoring.

**Risk:** Data quality issues  
**Mitigation:** Deterministic math, comprehensive validation, audit trails.

### Go-to-Market Risks

**Risk:** Customer acquisition cost higher than projected  
**Mitigation:** Focus on product-led growth, content marketing, developer community.

**Risk:** Churn rate higher than 5% target  
**Mitigation:** Strong onboarding, comprehensive documentation, proactive support.

**Risk:** Market doesn't need dedicated reconciliation service  
**Mitigation:** Validate with beta users, iterate based on feedback, expand to adjacent markets.

### Solo-Operator Risks

**Risk:** Founder unavailable (illness, burnout)  
**Mitigation:** Comprehensive documentation, operational runbook, automated systems.

**Risk:** Key person dependency  
**Mitigation:** Document all processes, build team (Year 1 target: 5 people).

### Regulatory/Compliance Risks

**Risk:** SOC 2 certification delays  
**Mitigation:** Early compliance investment, target Q3 2026 certification.

**Risk:** Data residency requirements  
**Mitigation:** Multi-region infrastructure (future), data residency options.

### Dependency Risks

**Risk:** Stripe, Supabase, Vercel outages  
**Mitigation:** Multi-provider strategy (future), monitoring, fallback plans.

**Risk:** API changes from third parties  
**Mitigation:** Adapter abstraction layer, versioning, monitoring.

---

## Team

### Current Team

**Founder/CEO:** [Name/Background] — Solo operator as of January 2026

**Note:** Team information should be filled in with actual founder details.

### Hiring Plan (Year 1)

- **Engineering:** 2 backend engineers, 1 SDK engineer
- **Product/Design:** 1 designer
- **GTM:** Founder (product, GTM)
- **Sales:** 1 sales/business development (Q4)

**Target Team Size:** 5 people by end of 2026

---

## Financials

### Year 1 Targets (2026)

- **Customers:** 1,000 paying customers (target)
- **ARR:** $600K (target)
- **MRR Growth:** $0 → $50K (Q1 → Q4)
- **Team Size:** 5 people
- **Burn Rate:** $25K/month (projected)
- **Runway:** 18+ months (with $1M seed)

### Use of Funds (Seed Round)

- **40%** Product development (engineers, infrastructure)
- **30%** Marketing and growth (content, ads, community)
- **20%** Team expansion (hiring, benefits)
- **10%** Operations (legal, compliance, tools)

### Path to Profitability

**Target:** Q4 2027 (18 months post-seed)

**Assumptions:**
- 1,000 paying customers @ $50/month average = $50K MRR = $600K ARR
- Burn rate: $25K/month = $300K/year
- Break-even: $25K MRR = 500 customers @ $50/month average

---

## Investment Ask

### Seed Round: $1M

**Valuation:** [To be determined based on market conditions]

**Use of Funds:**
- Product development: $400K
- Marketing and growth: $300K
- Team expansion: $200K
- Operations: $100K

### Milestones (18 Months)

1. **Product:** 10+ adapters, SOC 2 certification, self-service onboarding
2. **Customers:** 1,000 paying customers, $50K MRR
3. **Team:** 5 people, key hires in place
4. **Metrics:** <5% churn, 120%+ NRR, product-market fit signals

### Exit Strategy

**Likely Acquirers:**
- **Stripe:** Expand payment ecosystem ($50M-$200M valuation range)
- **Intuit (QuickBooks):** Modernize reconciliation ($100M-$500M)
- **Shopify:** Add reconciliation to merchant platform ($50M-$300M)
- **Fivetran:** Expand data integration platform ($50M-$200M)

**Timeline:** 3-5 years (strategic acquisition most likely)

---

## Why This Team

**Note:** This section should be filled in with actual founder background, relevant experience, and why this team can execute.

**Founder Strengths:**
- [To be filled in]

**Execution Track Record:**
- [To be filled in]

**Why Now:**
- [To be filled in]

---

## Red Flags & Honest Assessment

### What's Working

1. ✅ **Solid Technical Foundation:** Core reconciliation engine implemented, Stripe billing integrated
2. ✅ **Clear Problem:** Manual reconciliation is a real pain point
3. ✅ **Reasonable Pricing:** $99/month is accessible for target market
4. ✅ **Developer-First Approach:** API design aligns with modern developer expectations

### What's Not Working / Concerns

1. ❌ **No Traction:** Zero paying customers, no revenue
2. ❌ **Unverified Claims:** Previous "500+ companies" claims were aspirational (now removed)
3. ❌ **Limited Adapters:** Only 2-3 adapters (need 10+ for competitive advantage)
4. ❌ **No Compliance:** SOC 2 certification not yet achieved (target Q3 2026)
5. ❌ **Solo Operator:** Key person risk, limited bandwidth
6. ❌ **Early Stage:** Pre-product-market fit, unproven business model

### Critical Questions for Investors

1. **Can the founder execute?** (Need to assess founder background)
2. **Is there real demand?** (Need beta user validation)
3. **Can we acquire customers cost-effectively?** (CAC assumptions unproven)
4. **Will customers pay?** (No revenue yet)
5. **Can we build moats?** (Early stage, limited defensibility)

### Recommendation

**Status:** **NOT YET INVESTABLE** — Needs traction first

**Shortest Path to Investability:**
1. **Get 10 paying customers** → Prove willingness to pay
2. **Achieve $1K MRR** → Prove revenue model
3. **Validate product-market fit** → NPS >50, churn <5%
4. **Build 10+ adapters** → Prove technical execution
5. **Establish developer community** → Prove GTM execution

**Timeline to Investability:** 6-12 months (if execution succeeds)

---

## Conclusion

Settler.dev addresses a real problem (manual reconciliation) with a solid technical foundation. However, **the company is pre-revenue with zero paying customers and unproven product-market fit**.

**Investment Recommendation:**
- **Pre-seed / Friends & Family:** Consider if founder has strong background
- **Seed:** Wait until 10+ paying customers, $1K+ MRR, product-market fit signals
- **Strategic Partnership:** Consider if acquirer wants to build reconciliation capabilities

**The company needs to prove:**
1. Customers will pay for this
2. Product-market fit exists
3. Founder can execute on GTM
4. Technical moats can be built

**If these are proven in 6-12 months, this becomes an investable opportunity.**

---

**Last Updated:** January 2026  
**Next Review:** Quarterly or upon significant milestones
