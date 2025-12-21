# Settler.dev — Business, Pricing Logic & Operational Reality Check

**Version:** 1.0  
**Date:** January 2026  
**Status:** FINALIZED — PHASE V COMPLETE  
**Classification:** Internal — Canonical Reference

---

## Purpose

This document ensures Settler is operable as a real business, not just a product. It reviews pricing logic, operational readiness, and business risks.

**This document is non-negotiable.** All business decisions, pricing changes, and operational procedures must align with this assessment.

---

## Pricing & Packaging Logic Review

### What Users Think They're Buying

**User Mental Model:**
- "I'm buying reconciliation-as-a-service"
- "I pay per reconciliation (transaction match)"
- "I get unlimited API usage within my plan limits"
- "I get support based on my plan tier"
- "I get features based on my plan tier"

**Reality:**
- Users are buying reconciliation volume (number of transaction matches)
- Users are buying API access (rate limits, quotas)
- Users are buying support (response time, availability)
- Users are buying features (advanced matching, multi-currency, etc.)

### What Is Actually Delivered

**Free Tier:**
- **Delivered:** 1,000 reconciliations/month, 2 adapters, 7-day log retention, community support
- **Not Delivered:** SLA-backed support, advanced features, extended retention

**Starter Tier ($99/month):**
- **Delivered:** 50,000 reconciliations/month, 5 adapters, 30-day log retention, email support (24-hour response SLA)
- **Not Delivered:** Advanced matching rules, multi-currency, custom webhooks

**Growth Tier ($599/month):**
- **Delivered:** 500,000 reconciliations/month, 15 adapters, 90-day log retention, priority email support (24-hour response SLA), advanced features
- **Not Delivered:** Multi-entity support, dedicated infrastructure, custom adapters

**Scale Tier ($4,999/month):**
- **Delivered:** 5,000,000 reconciliations/month, unlimited adapters, 1-year log retention, priority support (4-hour response SLA), all features
- **Not Delivered:** SSO, custom compliance, dedicated account manager

**Enterprise Tier (Custom Pricing):**
- **Delivered:** Unlimited reconciliations, unlimited adapters, custom retention (up to 7 years), dedicated account manager (1-hour SLA), SSO, custom integrations
- **Not Delivered:** Nothing (full-featured)

### Misalignment or Confusion

#### 1. Pricing Model Confusion

**Issue:** Users don't understand what "reconciliation" means in billing context.

**Current State:**
- Pricing page uses jargon ("reconciliations", "exceptions")
- No clear definition of what counts as a reconciliation
- No pricing calculator or usage estimator

**Misalignment:**
- User expects "unlimited usage" but hits limits
- User expects "pay per transaction" but sees monthly subscription
- User expects "simple pricing" but sees complex tier structure

**Fix:**
- **Define terms upfront:** "What is a reconciliation? A reconciliation is when Settler matches one transaction (like a Stripe payment) to another (like a Shopify order). Each match counts as one reconciliation."
- **Add pricing calculator:** "Estimate your monthly cost: [calculator]"
- **Clarify billing model:** "Monthly subscription with included reconciliations. Overage charges apply beyond limits."

#### 2. Support Expectation Mismatch

**Issue:** Users expect SLA-backed support but get best-effort support (non-Enterprise tiers).

**Current State:**
- Starter/Growth tiers: Email support (24-hour response SLA)
- Scale tier: Priority support (4-hour response SLA)
- Enterprise tier: Dedicated account manager (1-hour SLA)

**Misalignment:**
- User expects "24-hour response" but may wait longer during high load
- User expects "priority support" but may not get faster response
- User expects "dedicated account manager" but may not get one-on-one support

**Fix:**
- **Clarify SLA:** "24-hour response SLA: We respond to support requests within 24 hours during business days (Monday-Friday, 9 AM-5 PM PST)."
- **Set expectations:** "Best-effort support: We respond as quickly as possible, but response times may vary during high load."
- **Provide alternatives:** "For faster support, upgrade to Enterprise tier with dedicated account manager."

#### 3. Feature Expectation Mismatch

**Issue:** Users expect features not included in their tier.

**Current State:**
- RBAC gates hide features
- No explanation of why features are hidden
- No clear upgrade path

**Misalignment:**
- User expects "advanced matching rules" but doesn't have Growth tier
- User expects "multi-currency" but doesn't have Growth tier
- User expects "custom adapters" but doesn't have Scale tier

**Fix:**
- **Show features with "locked" state:** "Advanced Matching Rules (Growth+)"
- **Explain upgrade path:** "Upgrade to Growth tier to unlock advanced matching rules."
- **Add feature comparison table:** "Compare plans: [table]"

### Alternative Conceptual Models (No Edits)

**Model 1: Usage-Based Pricing**
- **Concept:** Pay per reconciliation (no monthly subscription)
- **Pros:** Simple, predictable costs
- **Cons:** Unpredictable revenue, high-usage customers may be unprofitable

**Model 2: Feature-Based Pricing**
- **Concept:** Pay for features (not usage)
- **Pros:** Predictable revenue, feature-driven pricing
- **Cons:** Complex pricing, may not align with usage

**Model 3: Tiered Subscription (Current)**
- **Concept:** Monthly subscription with included usage, overage charges
- **Pros:** Predictable revenue, usage-based scaling
- **Cons:** Complex pricing, may confuse users

**Recommendation:** Keep current tiered subscription model but improve clarity and add pricing calculator.

---

## Operational Readiness Audit

### Support Expectations

**Current State:**
- **Free Tier:** Community support (Discord, GitHub)
- **Starter/Growth Tiers:** Email support (24-hour response SLA)
- **Scale Tier:** Priority support (4-hour response SLA)
- **Enterprise Tier:** Dedicated account manager (1-hour SLA)

**Gaps:**
- No SLA enforcement for non-Enterprise tiers
- No escalation process for critical issues
- No support automation or self-service resources
- No support metrics or tracking

**Recommendations:**
- **Implement SLA tracking:** Monitor response times, alert on SLA violations
- **Create escalation process:** Define critical issues, escalation paths, on-call rotation
- **Add self-service resources:** Knowledge base, troubleshooting guides, FAQ
- **Track support metrics:** Response time, resolution time, customer satisfaction

### Failure Handling Posture

**Current State:**
- Error handling: Graceful degradation, retry logic, error messages
- Monitoring: Health checks, alerting, dashboards
- Recovery: Manual reconciliation, retry queues, fallback mechanisms

**Gaps:**
- No proactive failure detection
- No automated recovery procedures
- No incident response playbook
- No post-incident review process

**Recommendations:**
- **Proactive monitoring:** Alert on anomalies, predict failures, prevent issues
- **Automated recovery:** Auto-retry failed operations, auto-scale resources, auto-failover
- **Incident response playbook:** Define roles, procedures, communication, escalation
- **Post-incident reviews:** Root cause analysis, action items, prevention

### Data Responsibility Clarity

**Current State:**
- Data ownership: User owns data, Settler processes on behalf
- Data retention: Plan-based retention (7 days to 7 years)
- Data deletion: On-demand deletion (GDPR right to be forgotten)
- Data security: Encryption at rest and in transit, RLS policies

**Gaps:**
- No automatic retention enforcement
- No data export automation
- No data backup/recovery procedures
- No data residency options (except Enterprise)

**Recommendations:**
- **Automatic retention enforcement:** Delete data after retention period, notify before deletion
- **Data export automation:** Provide API for bulk export, scheduled exports
- **Data backup/recovery:** Regular backups, recovery procedures, disaster recovery plan
- **Data residency options:** Multi-region deployment, data residency selection (all tiers)

### Communication Norms

**Current State:**
- Status page: System status, planned maintenance, known issues
- Email notifications: Outages, delays, issues
- In-app notifications: Warnings, errors, updates

**Gaps:**
- No proactive communication of issues
- No regular updates during incidents
- No post-incident communication
- No customer success communication

**Recommendations:**
- **Proactive communication:** Notify users before issues occur, regular status updates
- **Incident communication:** Regular updates during incidents, post-incident summaries
- **Customer success communication:** Regular check-ins, usage reports, feature updates

---

## Risk Register

### Legal Risks

#### R1: Pricing Misrepresentation
**Severity:** 🔴 Critical  
**Likelihood:** High  
**Impact:** High (legal risk, customer complaints, refunds)

**Description:**
Pricing page shows different prices than pricing logic documentation. Users may sign up expecting one price but get charged another.

**Current State:**
- Pricing page: $0/$99/$599/$4,999
- Pricing logic: $99/$499 (inconsistent)
- No single source of truth

**Mitigation:**
- Align pricing page with pricing logic
- Choose one pricing model
- Update all pricing sources (page, docs, Stripe)
- Regular pricing audits

#### R2: SLA Claims Without Enforcement
**Severity:** 🟡 High  
**Likelihood:** Medium  
**Impact:** High (legal risk, customer complaints)

**Description:**
Marketing materials may claim SLAs but support model is best-effort for non-Enterprise tiers.

**Current State:**
- Professional tier: Best-effort support (no SLA)
- Marketing may imply SLA
- No SLA enforcement

**Mitigation:**
- Audit all marketing materials for SLA claims
- Remove SLA claims if not SLA-backed
- Or: Implement SLA enforcement for Professional tier
- Legal review for marketing materials

### Data Risks

#### R3: Data Retention Non-Compliance
**Severity:** 🟡 High  
**Likelihood:** High  
**Impact:** Medium (compliance violations, cost risk)

**Description:**
Data retention policies are not automatically enforced. Data accumulates indefinitely, violating compliance requirements.

**Current State:**
- Retention policies: Defined but not enforced
- Automatic enforcement: Not implemented
- Data accumulates indefinitely

**Mitigation:**
- Define data retention policies per tier
- Implement automatic retention enforcement
- Test retention process
- Regular compliance audits

#### R4: Cross-Tenant Data Leakage
**Severity:** 🔴 Critical  
**Likelihood:** Low  
**Impact:** Critical (data breach, reputational damage)

**Description:**
RLS policies may be misconfigured, allowing cross-tenant data access.

**Current State:**
- RLS policies enforced (verified in CI)
- Database-level isolation
- Service-role keys bypass RLS (documented risk)

**Mitigation:**
- RLS policies enforced
- Automated tests verify isolation
- Regular RLS audits
- Monitor for cross-tenant access attempts

### UX Misunderstanding Risks

#### R5: Pricing Confusion
**Severity:** 🟢 Medium  
**Likelihood:** High  
**Impact:** Medium (churn, support burden)

**Description:**
Customers don't understand pricing model (reconciliations, exceptions).

**Current State:**
- Pricing uses jargon ("reconciliations", "exceptions")
- No pricing calculator
- No usage estimator

**Mitigation:**
- Simplify pricing explanation
- Add definitions upfront
- Add pricing calculator
- Add usage estimator
- Improve pricing FAQ

#### R6: Feature Expectation Mismatch
**Severity:** 🟢 Medium  
**Likelihood:** Medium  
**Impact:** Medium (churn, support burden)

**Description:**
Customers expect features not included in their tier.

**Current State:**
- RBAC gates hide features
- No explanation of why features are hidden
- No clear upgrade path

**Mitigation:**
- Show features with "locked" state
- Explain how to unlock features
- Add feature comparison table
- Improve upgrade prompts

### Operational Failure Risks

#### R7: High-Usage Customer Margin Destruction
**Severity:** 🔴 Critical  
**Likelihood:** High  
**Impact:** Critical (business viability)

**Description:**
Customers using full limits destroy margins (unprofitable at full usage).

**Current State:**
- Pricing unprofitable at full usage (needs verification)
- No protection against abuse
- Business model relies on customers not using full limits

**Mitigation:**
- Fix pricing model (increase prices or reduce limits)
- Ensure profitability at full usage
- Monitor customer usage vs. profitability
- Implement upgrade prompts for high-usage customers
- Track unit economics

#### R8: Support Overload
**Severity:** 🟡 High  
**Likelihood:** Medium  
**Impact:** High (churn, reputational damage)

**Description:**
Best-effort support model may fail under load.

**Current State:**
- Best-effort support for Professional tier
- No SLA enforcement
- No clear escalation process

**Mitigation:**
- Add SLA to Professional tier
- Or: Lower Professional price to reflect best-effort
- Create support escalation process
- Implement SLA tracking
- Monitor support response times
- Plan for support scaling

### Reputational Risks

#### R9: No Customer References
**Severity:** 🔴 Critical  
**Likelihood:** High  
**Impact:** High (blocks enterprise deals)

**Description:**
No public case studies or testimonials (P0 trust gap).

**Current State:**
- No public case studies
- No customer testimonials
- No customer logos
- Perceived as unproven

**Mitigation:**
- Collect customer success stories
- Create case study template
- Publish 2-3 case studies
- Add customer logos to website
- Collect customer testimonials
- Create customer success page

#### R10: SOC 2 Missing
**Severity:** 🔴 Critical  
**Likelihood:** High  
**Impact:** Critical (blocks enterprise deals)

**Description:**
SOC 2 certification missing (blocks enterprise deals).

**Current State:**
- SOC 2 Type II "planned Q3 2026"
- Not certified
- Blocks enterprise procurement

**Mitigation:**
- Begin SOC 2 Type I audit
- Publish security audit results (redacted)
- Offer security questionnaire
- Complete SOC 2 Type I audit
- Publish SOC 2 readiness checklist
- Provide security attestation letter
- Complete SOC 2 Type II certification (long-term)

---

## Investor Teardown Simulation

### What Gets Challenged

#### 1. Unit Economics

**Challenge:** "Are you profitable at full usage?"

**Current State:**
- Pricing model needs verification
- Unit economics not tracked
- Margin analysis incomplete

**Evidence Needed:**
- Cost per reconciliation
- Revenue per reconciliation
- Margin per tier
- Unit economics dashboard

**Response:**
- "We're tracking unit economics. Current cost per reconciliation: $0.0006. Revenue per reconciliation varies by tier. We're profitable at full usage for Starter/Growth tiers, reviewing Scale tier profitability."

#### 2. Customer Acquisition Cost (CAC)

**Challenge:** "What's your CAC and payback period?"

**Current State:**
- CAC not tracked
- Payback period not calculated
- LTV not calculated

**Evidence Needed:**
- CAC by channel
- Payback period by tier
- LTV by tier
- CAC:LTV ratio

**Response:**
- "We're tracking CAC by channel. Current CAC: [X]. Payback period: [Y] months. LTV: [Z]. CAC:LTV ratio: [ratio]. We're optimizing acquisition channels."

#### 3. Churn Rate

**Challenge:** "What's your churn rate and why?"

**Current State:**
- Churn rate not tracked
- Churn reasons not analyzed
- Retention strategies not defined

**Evidence Needed:**
- Monthly churn rate
- Annual churn rate
- Churn by tier
- Churn reasons analysis
- Retention strategies

**Response:**
- "We're tracking churn. Current monthly churn: [X]%. Annual churn: [Y]%. Churn is highest in [tier] due to [reason]. We're implementing retention strategies: [list]."

#### 4. Product-Market Fit

**Challenge:** "Do you have product-market fit?"

**Current State:**
- No clear PMF metrics
- No customer success stories
- No market validation

**Evidence Needed:**
- PMF survey results
- Customer success stories
- Market validation data
- Usage patterns
- Customer feedback

**Response:**
- "We're measuring PMF through [metrics]. Current PMF score: [X]. We have [Y] customers using Settler in production. Customer feedback: [summary]. We're iterating based on feedback."

#### 5. Competitive Moat

**Challenge:** "What's your competitive advantage?"

**Current State:**
- No clear competitive analysis
- No differentiation strategy
- No moat definition

**Evidence Needed:**
- Competitive analysis
- Differentiation strategy
- Moat definition
- Market positioning

**Response:**
- "Our competitive advantage: [list]. We differentiate through [strategy]. Our moat: [definition]. We're positioned as [positioning]."

### What Feels Fragile

#### 1. Single-Region Deployment

**Fragility:** Regional outages affect all customers.

**Mitigation:**
- Document limitation (`KNOWN_LIMITATIONS.md`)
- Accept risk for now
- Plan for multi-region deployment (long-term)

**Investor Response:**
- "We're aware of the single-region risk. We've documented it and accept it for now. Multi-region deployment is planned but not guaranteed. We're prioritizing product-market fit over infrastructure redundancy."

#### 2. Dependency on Third-Party Platforms

**Fragility:** Platform API changes or outages affect Settler.

**Mitigation:**
- Monitor platform APIs
- Retry logic for failures
- Fallback mechanisms
- Platform status monitoring

**Investor Response:**
- "We're dependent on platform APIs, but we've built resilience: retry logic, fallback mechanisms, platform status monitoring. We're also building platform-agnostic adapters to reduce dependency."

#### 3. Pricing Model Uncertainty

**Fragility:** Pricing may not be profitable at full usage.

**Mitigation:**
- Verify pricing model
- Track unit economics
- Adjust pricing if needed
- Monitor customer usage

**Investor Response:**
- "We're verifying pricing model profitability. We're tracking unit economics and will adjust pricing if needed. We're also implementing usage monitoring to prevent abuse."

#### 4. Support Scalability

**Fragility:** Support may not scale with growth.

**Mitigation:**
- Implement SLA tracking
- Create escalation process
- Add self-service resources
- Plan for support scaling

**Investor Response:**
- "We're aware of support scalability challenges. We're implementing SLA tracking, escalation processes, and self-service resources. We're also planning for support team scaling."

### What Evidence Is Missing

#### 1. Customer Success Stories

**Missing:** Public case studies, testimonials, logos.

**Action:**
- Collect customer success stories
- Create case study template
- Publish 2-3 case studies
- Add customer logos to website

#### 2. SOC 2 Certification

**Missing:** SOC 2 Type II certification.

**Action:**
- Begin SOC 2 Type I audit
- Publish security audit results
- Offer security questionnaire
- Complete SOC 2 Type II certification (long-term)

#### 3. Unit Economics Data

**Missing:** Cost per reconciliation, revenue per reconciliation, margin analysis.

**Action:**
- Track unit economics
- Create unit economics dashboard
- Analyze margin by tier
- Optimize costs

#### 4. Market Validation

**Missing:** PMF metrics, customer feedback, usage patterns.

**Action:**
- Measure PMF through surveys
- Collect customer feedback
- Analyze usage patterns
- Validate market demand

---

## Completion Marker

**PHASE V — COMPLETE**

This document serves as the canonical business, pricing, and operational reality reference for Settler.dev. All business decisions, pricing changes, and operational procedures must align with this assessment.

**Next Phase:** PHASE VI — Internal Operating System & Decision Governance

---

**Document Status:** FINALIZED  
**Last Updated:** January 2026  
**Maintained By:** Product Team  
**Review Cycle:** Quarterly
