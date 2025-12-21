# Decision Frameworks — Settler.dev

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active  
**Purpose:** Clear decision frameworks for business operations

---

## Overview

This document defines **decision frameworks** for Settler.dev business operations. These frameworks help answer:
- What to say yes to
- What to say no to
- What never to build
- What metrics actually matter

**Philosophy:** Clear frameworks prevent decision paralysis and ensure consistency.

---

## 1. What to Say Yes To

### Framework: ROI + Risk Assessment

**Say Yes If:**
- **High ROI** (unlocks revenue, reduces costs, builds trust)
- **Low Risk** (doesn't create liability, doesn't destroy margins)
- **Aligned with Strategy** (fits business model, supports growth)

---

### ✅ Yes: Customer Success Stories

**Why:** Builds trust, unlocks enterprise deals (P0 trust gap)

**ROI:** High
- Unlocks enterprise deals ($50K-$500K+ per deal)
- Reduces sales cycle time
- Builds buyer confidence

**Risk:** Low
- No technical risk
- No margin risk
- Minimal cost (time investment)

**Decision:** ✅ **YES** — Do immediately

**Action:**
- Collect 5-10 customer success stories
- Publish 2-3 case studies within 1 month
- Maintain library of 5-10 case studies

---

### ✅ Yes: SOC 2 Certification

**Why:** Unlocks enterprise deals (P0 trust gap)

**ROI:** High
- Unlocks enterprise deals ($50K-$500K+ per deal)
- Reduces sales cycle time
- Builds buyer confidence

**Risk:** Medium
- Cost: $15K-$30K (Type I), $20K-$40K (Type II)
- Time: 3-6 months (Type I), 6-12 months (Type II)
- Operational: Requires process improvements

**Decision:** ✅ **YES** — Begin immediately

**Action:**
- Begin SOC 2 Type I audit (Month 1)
- Complete Type I audit (Month 3-6)
- Complete Type II certification (Month 6-12)

---

### ✅ Yes: Pricing Model Fix

**Why:** Ensures business viability (critical business model issue)

**ROI:** Critical
- Ensures profitability
- Prevents margin destruction
- Makes business investable

**Risk:** Medium
- May cause churn (if prices increase)
- Requires careful communication
- May require grandfathering existing customers

**Decision:** ✅ **YES** — Do immediately

**Action:**
- Align pricing page with pricing logic (Week 1)
- Ensure profitability at full usage (Week 1)
- Update all pricing sources (Week 1)

---

### ✅ Yes: SLA for Professional Tier

**Why:** Meets customer expectations, reduces churn

**ROI:** Medium
- Reduces churn
- Meets customer expectations
- Improves reputation

**Risk:** Low
- Can implement with existing resources
- Low cost (process improvement)
- Minimal operational risk

**Decision:** ✅ **YES** — Do this month

**Action:**
- Add 24-hour response SLA to Professional tier
- Implement SLA tracking
- Update support model documentation

---

### ✅ Yes: Data Retention Enforcement

**Why:** Compliance, cost control

**ROI:** Medium
- Cost savings (reduced storage)
- Compliance (meets requirements)
- Risk reduction (data accumulation)

**Risk:** Low
- Technical implementation
- Low cost
- Minimal customer impact

**Decision:** ✅ **YES** — Do this quarter

**Action:**
- Define retention policies (Month 1)
- Implement automatic enforcement (Month 2-3)
- Update documentation (Month 1)

---

## 2. What to Say No To

### Framework: Cost + Risk Assessment

**Say No If:**
- **High Cost** (doesn't justify ROI)
- **High Risk** (creates liability, destroys margins)
- **Misaligned** (doesn't fit business model, doesn't support growth)

---

### ❌ No: Custom Integrations (Non-Enterprise)

**Why:** High cost, low ROI, support burden

**Cost:** High
- Development time: 2-4 weeks per integration
- Support burden: Ongoing maintenance
- Opportunity cost: Time not spent on core product

**Risk:** High
- Support overload
- Unprofitable (if not priced appropriately)
- Diverts resources from core product

**Alternative:**
- Enterprise-only (paid add-on)
- Custom adapter SDK (self-service)
- Platform request form (collect demand)

**Decision:** ❌ **NO** — Enterprise-only or paid add-on

**Exception:** Enterprise customers (custom pricing covers costs)

---

### ❌ No: Free Tier Expansion

**Why:** Already unprofitable at full usage, margin destruction risk

**Cost:** High
- Margin destruction if customers use full limits
- Support burden (free tier customers)
- Infrastructure costs

**Risk:** High
- Business model relies on customers not using full limits
- Free tier expansion increases risk
- May attract abuse

**Alternative:**
- Keep free tier limited (1,000 reconciliations/month)
- Add usage-based pricing for free tier (after limit)
- Focus on paid tier growth

**Decision:** ❌ **NO** — Keep free tier limited

**Exception:** If pricing model is fixed (profitable at full usage)

---

### ❌ No: New Features Without Pricing Alignment

**Why:** Features cost money, pricing must cover costs

**Cost:** High
- Development time
- Infrastructure costs
- Support burden

**Risk:** High
- Unprofitable features
- Margin destruction
- Business model misalignment

**Alternative:**
- Price features appropriately
- Include features in higher tiers
- Make features paid add-ons

**Decision:** ❌ **NO** — Price features appropriately

**Exception:** Features that reduce costs (e.g., automation)

---

### ❌ No: Best-Effort Support for Paid Tiers

**Why:** Customers expect SLA for paid tiers

**Cost:** Medium
- SLA enforcement requires process
- May require additional support staff
- Monitoring and tracking

**Risk:** High
- Churn (customers expect SLA)
- Reputational damage
- Legal risk (if SLA implied)

**Alternative:**
- Add SLA to Professional tier
- Or: Lower Professional price to reflect best-effort
- Or: Add SLA add-on for Professional

**Decision:** ❌ **NO** — Add SLA or lower price

**Exception:** Free tier (community support acceptable)

---

### ❌ No: Pricing Changes Without Notice

**Why:** Legal risk, customer trust

**Cost:** Low
- Communication cost
- Process cost

**Risk:** High
- Legal risk (if not properly communicated)
- Customer trust loss
- Churn

**Alternative:**
- 30-day notice minimum
- Grandfather existing customers
- Clear communication

**Decision:** ❌ **NO** — 30-day notice minimum

**Exception:** Security-related changes (immediate notice acceptable)

---

## 3. What Never to Build

### Framework: Risk + Liability Assessment

**Never Build If:**
- **Creates Liability** (legal risk, financial risk)
- **Doesn't Scale** (requires manual support, doesn't automate)
- **Violates Boundaries** (data boundaries, security boundaries)
- **Overpromises** (promises what we can't deliver)

---

### 🚫 Never: Features That Require Manual Support

**Why:** Doesn't scale, support burden

**Examples:**
- Custom integrations without automation
- Manual data processing
- Hand-holding for customers

**Risk:**
- Support overload
- Doesn't scale
- High cost

**Alternative:**
- Automate everything possible
- Self-service tools
- Documentation and guides

**Decision:** 🚫 **NEVER** — Automate or don't build

---

### 🚫 Never: Features That Destroy Margins

**Why:** Business viability

**Examples:**
- Unlimited usage without pricing
- Free features that cost money
- Features that don't cover costs

**Risk:**
- Business failure
- Margin destruction
- Unprofitability

**Alternative:**
- Price features appropriately
- Include features in higher tiers
- Make features paid add-ons

**Decision:** 🚫 **NEVER** — Price appropriately or don't build

---

### 🚫 Never: Features That Create Legal Risk

**Why:** Liability

**Examples:**
- Financial advice
- Tax calculation
- Legal compliance (beyond data processing)

**Risk:**
- Legal liability
- Regulatory risk
- Reputational damage

**Alternative:**
- Focus on data processing (not advice)
- Integrate with compliance tools (don't provide compliance)
- Clear boundaries (what we do vs. don't do)

**Decision:** 🚫 **NEVER** — Avoid legal liability

---

### 🚫 Never: Features That Violate Data Boundaries

**Why:** Security, compliance

**Examples:**
- Cross-tenant data access
- Data sharing without consent
- Unencrypted sensitive data

**Risk:**
- Data breach
- Compliance violations
- Reputational damage

**Alternative:**
- RLS-enforced isolation
- Encryption for sensitive data
- Clear data boundaries

**Decision:** 🚫 **NEVER** — Maintain data boundaries

---

### 🚫 Never: Features That Promise What We Can't Deliver

**Why:** Reputational damage, customer trust loss

**Examples:**
- 100% accuracy (we have confidence scores)
- Zero downtime (we're single-region)
- Instant processing (we have latency)

**Risk:**
- Customer trust loss
- Reputational damage
- Legal risk (if implied guarantee)

**Alternative:**
- Honest claims (high accuracy, not 100%)
- Clear limitations (documented)
- Realistic expectations

**Decision:** 🚫 **NEVER** — Be honest about capabilities

---

## 4. What Metrics Actually Matter

### Framework: Business Impact + Actionability

**Metrics Matter If:**
- **Business Impact** (affects revenue, costs, growth)
- **Actionable** (can take action based on metric)
- **Measurable** (can track consistently)

---

### Business Metrics (Critical)

#### Unit Economics
**Metrics:**
- LTV/CAC ratio (target: >3:1)
- Payback period (target: <12 months)
- Gross margin (target: >70%)

**Why:** Business viability
- LTV/CAC shows profitability
- Payback period shows cash flow
- Gross margin shows efficiency

**Action:**
- Track monthly
- Optimize pricing to improve metrics
- Monitor customer acquisition costs

---

#### Customer Health
**Metrics:**
- Churn rate (target: <5% monthly)
- NPS (target: >50)
- Support ticket volume per customer

**Why:** Growth sustainability
- Churn rate shows retention
- NPS shows satisfaction
- Support volume shows product quality

**Action:**
- Track monthly
- Reduce churn (improve product, support)
- Improve NPS (customer success)
- Reduce support volume (improve product)

---

#### Pricing Health
**Metrics:**
- Average revenue per customer
- Usage vs. limits (target: 30-50% usage)
- Overage revenue (if applicable)

**Why:** Pricing effectiveness
- ARPU shows pricing power
- Usage vs. limits shows pricing fit
- Overage revenue shows pricing flexibility

**Action:**
- Track monthly
- Optimize pricing (increase ARPU)
- Monitor usage patterns
- Adjust limits if needed

---

#### Operational Health
**Metrics:**
- Uptime (target: 99.5%+)
- Support response time (target: <24 hours)
- Incident frequency (target: <1/month)

**Why:** Operational reliability
- Uptime shows reliability
- Support response shows service quality
- Incident frequency shows stability

**Action:**
- Track daily (uptime), weekly (support), monthly (incidents)
- Improve uptime (monitoring, incident response)
- Reduce support response time (SLA enforcement)
- Reduce incident frequency (prevention)

---

### Product Metrics (Important)

#### Usage Metrics
**Metrics:**
- Reconciliations per customer
- Receipt parses per customer
- Feature flag evaluations per customer

**Why:** Product adoption
- Shows feature usage
- Shows product value
- Shows growth potential

**Action:**
- Track weekly
- Optimize features (improve usage)
- Monitor adoption trends
- Identify underused features

---

#### Quality Metrics
**Metrics:**
- Reconciliation accuracy (confidence scores)
- Receipt parsing accuracy
- Error rate

**Why:** Product quality
- Shows product reliability
- Shows customer satisfaction
- Shows improvement opportunities

**Action:**
- Track weekly
- Improve accuracy (algorithm improvements)
- Reduce error rate (bug fixes)
- Monitor quality trends

---

#### Engagement Metrics
**Metrics:**
- API calls per customer
- Console logins per customer
- Documentation views

**Why:** Product engagement
- Shows product usage
- Shows customer engagement
- Shows product value

**Action:**
- Track weekly
- Improve engagement (better UX, features)
- Monitor engagement trends
- Identify disengaged customers

---

### Trust Metrics (Important)

#### Trust Signals
**Metrics:**
- SOC 2 certification status
- Customer references count
- Security audit status

**Why:** Trust building
- Shows credibility
- Shows enterprise readiness
- Shows security posture

**Action:**
- Track monthly
- Improve trust signals (SOC 2, references)
- Monitor trust gap progress
- Publish trust signals

---

#### Reputation Metrics
**Metrics:**
- Customer testimonials
- Case studies published
- Public status page uptime

**Why:** Reputation management
- Shows customer satisfaction
- Shows success stories
- Shows reliability

**Action:**
- Track monthly
- Collect testimonials (customer success)
- Publish case studies (marketing)
- Maintain status page (operations)

---

## 5. Decision Process

### Step 1: Assess ROI
- **High ROI:** Unlocks revenue, reduces costs, builds trust
- **Medium ROI:** Moderate impact
- **Low ROI:** Minimal impact

### Step 2: Assess Risk
- **Low Risk:** No liability, no margin risk, minimal cost
- **Medium Risk:** Some liability, some margin risk, moderate cost
- **High Risk:** High liability, high margin risk, high cost

### Step 3: Assess Alignment
- **Aligned:** Fits business model, supports growth
- **Neutral:** Doesn't conflict but doesn't directly support
- **Misaligned:** Conflicts with business model, doesn't support growth

### Step 4: Make Decision
- **High ROI + Low Risk + Aligned:** ✅ **YES**
- **High ROI + Medium Risk + Aligned:** ✅ **YES** (with mitigation)
- **Medium ROI + Low Risk + Aligned:** ✅ **YES** (if resources available)
- **Low ROI + Any Risk:** ❌ **NO**
- **Any ROI + High Risk:** ❌ **NO**
- **Any ROI + Misaligned:** ❌ **NO**

---

## 6. Decision Examples

### Example 1: Add New Integration

**ROI:** Medium (adds value for customers)
**Risk:** Medium (development cost, support burden)
**Alignment:** Aligned (supports product growth)

**Decision:** ✅ **YES** (if demand is high, if priced appropriately)

**Conditions:**
- High customer demand (5+ requests)
- Can be priced appropriately (covers costs)
- Can be automated (not manual support)

---

### Example 2: Expand Free Tier

**ROI:** Low (may attract customers but low conversion)
**Risk:** High (margin destruction if customers use full limits)
**Alignment:** Misaligned (pricing model already unprofitable)

**Decision:** ❌ **NO** (until pricing model is fixed)

**Conditions:**
- Pricing model is profitable at full usage
- Free tier expansion doesn't destroy margins
- Can support free tier customers

---

### Example 3: Add SLA to Professional Tier

**ROI:** Medium (reduces churn, meets expectations)
**Risk:** Low (can implement with existing resources)
**Alignment:** Aligned (supports customer satisfaction)

**Decision:** ✅ **YES** (do this month)

**Conditions:**
- Can enforce SLA (process, monitoring)
- Can track SLA (metrics, alerts)
- Can communicate SLA (documentation, marketing)

---

## 7. Decision Review Process

### Monthly Review
- Review all decisions made
- Assess outcomes
- Update frameworks based on learnings

### Quarterly Review
- Review decision frameworks
- Update frameworks based on business changes
- Document new patterns

### Annual Review
- Comprehensive framework review
- Update frameworks based on business evolution
- Document lessons learned

---

**Document Status:** Active  
**Last Updated:** January 2026  
**Next Review:** Monthly (update based on decisions made)
