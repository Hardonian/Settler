# Settler.dev — Decision Frameworks

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Clear decision frameworks for what to say yes/no to, what never to build, and what metrics matter

---

## Overview

This document provides decision frameworks to help Settler make consistent, strategic decisions. Use these frameworks when evaluating:
- Customer requests
- Product features
- Operational investments
- Strategic initiatives

**Philosophy:** Clear frameworks prevent scope creep, maintain focus, and ensure resources are allocated to highest-ROI activities.

---

## 1. What to Say Yes To

### 1.1 Customer Requests

**✅ Say Yes To:**

1. **Feature Requests Aligned with Core Value**
   - **Criteria:** Improves reconciliation accuracy, speed, or ease of use
   - **Examples:**
     - Better matching algorithms
     - Additional adapter integrations (Stripe, Shopify, QuickBooks, etc.)
     - Improved reporting/export formats
     - Webhook enhancements
   - **Rationale:** Core value proposition drives customer retention

2. **Integration Requests for Popular Platforms**
   - **Criteria:** Platform has >10K potential customers, clear integration path
   - **Examples:**
     - Stripe, Shopify, QuickBooks, Xero, NetSuite
     - PayPal, Square, Adyen (payment providers)
     - Popular e-commerce platforms
   - **Rationale:** Expands addressable market, reduces customer friction

3. **Support Requests Within Documented SLAs**
   - **Criteria:** Request falls within support scope, customer has appropriate plan
   - **Examples:**
     - API usage questions
     - Integration assistance
     - Bug reports
     - Documentation questions
   - **Rationale:** Support is a product, meeting SLAs builds trust

4. **Custom Pricing for Enterprise (with Clear Terms)**
   - **Criteria:** Customer commits to annual contract, clear usage requirements
   - **Examples:**
     - Volume discounts for high-usage customers
     - Custom SLAs
     - Dedicated infrastructure
   - **Rationale:** Enterprise customers drive high LTV, justify custom terms

**Decision Process:**
1. Evaluate against criteria above
2. Assess ROI (customer LTV, support burden, development cost)
3. Check resource availability
4. Get approval if >$10K investment required

---

### 1.2 Product Decisions

**✅ Say Yes To:**

1. **Features That Improve Developer Experience**
   - **Criteria:** Reduces integration time, improves API usability, reduces support burden
   - **Examples:**
     - Better SDK documentation
     - Interactive API playground
     - Code examples and tutorials
     - Improved error messages
   - **Rationale:** Developer experience drives adoption and retention

2. **Features That Reduce Support Burden**
   - **Criteria:** Automates common support tasks, reduces ticket volume
   - **Examples:**
     - Self-service troubleshooting
     - Automated error detection and resolution
     - Improved documentation
     - In-app help/guidance
   - **Rationale:** Support costs scale with customers, automation reduces costs

3. **Features That Increase Customer Retention**
   - **Criteria:** Increases switching costs, improves product stickiness
   - **Examples:**
     - Data export/import capabilities
     - Custom workflows
     - Integration with customer's existing tools
     - Historical data retention
   - **Rationale:** Retention drives LTV, reduces churn

4. **Features That Enable Upselling**
   - **Criteria:** Creates natural upgrade path, adds value for higher tiers
   - **Examples:**
     - Advanced matching rules (Growth+)
     - Multi-currency support (Growth+)
     - White-label reports (Scale+)
     - Custom adapters (Enterprise)
   - **Rationale:** Upselling increases ARPU, improves unit economics

**Decision Process:**
1. Evaluate against criteria above
2. Estimate development cost and timeline
3. Assess impact on support burden
4. Prioritize based on ROI and customer demand
5. Get approval if >$50K investment required

---

### 1.3 Operational Decisions

**✅ Say Yes To:**

1. **Investments in Support Capacity (if Customer Demand Exists)**
   - **Criteria:** Support ticket volume exceeds capacity, customer satisfaction declining
   - **Examples:**
     - Hiring support engineers
     - Implementing support ticketing system
     - Creating knowledge base
     - Training support team
   - **Rationale:** Support quality drives retention, poor support causes churn

2. **Security and Compliance Investments**
   - **Criteria:** Required for customer acquisition, reduces risk, enables market access
   - **Examples:**
     - SOC 2 Type II certification
     - GDPR compliance improvements
     - Security audits
     - Compliance documentation
   - **Rationale:** Security/compliance enables Enterprise sales, reduces legal risk

3. **Infrastructure Investments That Reduce Costs**
   - **Criteria:** Reduces per-unit costs, improves scalability, reduces operational burden
   - **Examples:**
     - Serverless architecture optimization
     - Caching improvements
     - Database optimization
     - Automated scaling
   - **Rationale:** Lower costs improve margins, enable competitive pricing

4. **Documentation Improvements**
   - **Criteria:** Reduces support burden, improves customer onboarding, enables self-service
   - **Examples:**
     - API documentation updates
     - Integration guides
     - Troubleshooting guides
     - Video tutorials
   - **Rationale:** Documentation reduces support costs, improves customer experience

**Decision Process:**
1. Evaluate against criteria above
2. Estimate cost and ROI
3. Assess impact on operational burden
4. Prioritize based on customer demand and risk reduction
5. Get approval if >$25K investment required

---

## 2. What to Say No To

### 2.1 Customer Requests

**❌ Say No To:**

1. **Custom Development Work (unless Enterprise with Contract)**
   - **Criteria:** Request requires custom code, not reusable feature
   - **Examples:**
     - Custom integrations for proprietary systems (unless Enterprise)
     - Custom reporting formats (unless Enterprise)
     - Custom workflows (unless Enterprise)
   - **Rationale:** Custom work doesn't scale, increases support burden
   - **Exception:** Enterprise customers with annual contracts and clear ROI

2. **Features Outside Core Reconciliation Use Case**
   - **Criteria:** Feature doesn't relate to reconciliation, matching, or data normalization
   - **Examples:**
     - Accounting software features
     - Payment processing features
     - Inventory management features
     - CRM features
   - **Rationale:** Scope creep dilutes focus, increases complexity

3. **Support Requests Outside Documented SLAs (unless Paid Upgrade)**
   - **Criteria:** Request exceeds support scope, requires custom work
   - **Examples:**
     - Architecture consulting
     - Performance optimization beyond documentation
     - Training beyond documentation
     - Custom development assistance
   - **Rationale:** Support costs scale with customers, must stay within scope
   - **Exception:** Paid professional services (if offered)

4. **Pricing Discounts Without Clear ROI**
   - **Criteria:** Discount request without clear justification (volume, strategic value)
   - **Examples:**
     - "Startup discount" requests
     - "Non-profit discount" requests
     - Arbitrary discount requests
   - **Rationale:** Discounts reduce revenue, must justify with volume or strategic value
   - **Exception:** Volume discounts for high-usage customers, strategic partnerships

**Decision Process:**
1. Evaluate against criteria above
2. Assess customer LTV and strategic value
3. Consider exception criteria (Enterprise, volume, strategic)
4. Decline politely with clear rationale
5. Offer alternative (upgrade plan, paid services, etc.)

---

### 2.2 Product Decisions

**❌ Say No To:**

1. **Features That Increase Complexity Without Clear Value**
   - **Criteria:** Feature adds complexity but doesn't improve core value proposition
   - **Examples:**
     - Overly complex matching rules
     - Features that require significant configuration
     - Features that increase support burden disproportionately
   - **Rationale:** Complexity increases support burden, reduces adoption

2. **Features That Require Significant Infrastructure Investment Without Customer Demand**
   - **Criteria:** Feature requires >$100K infrastructure investment, no customer demand
   - **Examples:**
     - Multi-region deployment (without customer demand)
     - On-premise deployment (without customer demand)
     - Custom infrastructure (without customer demand)
   - **Rationale:** Infrastructure investments must be justified by customer demand

3. **Features That Compete with Core Value Proposition**
   - **Criteria:** Feature duplicates functionality of core platforms (Stripe, Shopify, etc.)
   - **Examples:**
     - Payment processing features
     - E-commerce platform features
     - Accounting software features
   - **Rationale:** Competing with platforms reduces partnership opportunities

4. **Features That Increase Support Burden Disproportionately**
   - **Criteria:** Feature increases support ticket volume >20% without clear ROI
   - **Examples:**
     - Features requiring manual intervention
     - Features with high error rates
     - Features requiring significant customer education
   - **Rationale:** Support costs scale with customers, must be justified

**Decision Process:**
1. Evaluate against criteria above
2. Estimate development cost and support burden
3. Assess customer demand and ROI
4. Decline if ROI doesn't justify investment
5. Document decision rationale

---

### 2.3 Operational Decisions

**❌ Say No To:**

1. **Infrastructure Investments Without Cost Justification**
   - **Criteria:** Investment doesn't reduce costs or improve scalability
   - **Examples:**
     - Over-provisioning infrastructure
     - Redundant systems without clear benefit
     - Expensive tools without clear ROI
   - **Rationale:** Infrastructure costs reduce margins, must be justified

2. **Support Capacity Expansion Without Customer Demand**
   - **Criteria:** Expanding support team without evidence of demand
   - **Examples:**
     - Hiring support engineers without ticket volume justification
     - Implementing expensive support tools without clear need
   - **Rationale:** Support costs scale with customers, must be justified by demand

3. **Compliance Investments Without Customer Requirements**
   - **Criteria:** Compliance investment without customer demand or legal requirement
   - **Examples:**
     - SOC 2 certification without Enterprise customer demand
     - HIPAA compliance without healthcare customers
     - Regional compliance without regional customers
   - **Rationale:** Compliance investments are expensive, must be justified by customer demand
   - **Exception:** Legal requirements (GDPR, CCPA, etc.)

4. **Marketing Spend Without Proven ROI**
   - **Criteria:** Marketing investment without clear ROI or proven channel
   - **Examples:**
     - Paid advertising without conversion data
     - Conference sponsorships without lead generation
     - Content marketing without traffic/conversion data
   - **Rationale:** Marketing spend must be justified by customer acquisition

**Decision Process:**
1. Evaluate against criteria above
2. Estimate cost and ROI
3. Assess customer demand and strategic value
4. Decline if ROI doesn't justify investment
5. Document decision rationale

---

## 3. What Never to Build

### 3.1 Never Build List

**❌ Never Build:**

1. **Custom Integrations for Free-Tier Customers (unless Strategic)**
   - **Rationale:** Free-tier customers don't justify custom development costs
   - **Exception:** Strategic partnerships or high-value use cases

2. **Features That Require Manual Intervention**
   - **Rationale:** Manual intervention doesn't scale, increases support burden
   - **Examples:**
     - Manual data entry
     - Manual reconciliation
     - Manual approval workflows

3. **Features That Compete with Core Platforms**
   - **Rationale:** Competing with platforms (Stripe, Shopify) reduces partnership opportunities
   - **Examples:**
     - Payment processing
     - E-commerce platform features
     - Accounting software features

4. **Features That Increase Liability**
   - **Rationale:** Financial/legal liability increases risk without clear ROI
   - **Examples:**
     - Financial advice
     - Tax calculation
     - Legal compliance advice
     - Investment recommendations

5. **Features That Require Regulatory Approval (unless Strategic)**
   - **Rationale:** Regulatory approval is expensive and time-consuming
   - **Examples:**
     - Banking features (requires banking license)
     - Insurance features (requires insurance license)
     - Securities trading (requires SEC approval)
   - **Exception:** Strategic initiatives with clear ROI

6. **White-Label Solutions (unless Enterprise with Contract)**
   - **Rationale:** White-label solutions require significant customization, increase support burden
   - **Exception:** Enterprise customers with annual contracts and clear ROI

7. **On-Premise Deployments (unless Enterprise with Contract)**
   - **Rationale:** On-premise deployments require significant infrastructure investment, increase support burden
   - **Exception:** Enterprise customers with annual contracts and clear ROI

8. **Features That Require Significant ML/AI Investment (unless Proven ROI)**
   - **Rationale:** ML/AI investments are expensive, must be justified by proven ROI
   - **Examples:**
     - Custom ML models without clear use case
     - AI features without customer demand
     - ML infrastructure without proven value

**Decision Process:**
1. Check against "Never Build" list
2. If item is on list, decline immediately
3. Document decision rationale
4. Offer alternative if applicable

---

## 4. What Metrics Actually Matter

### 4.1 Customer Metrics

**✅ Metrics That Matter:**

1. **MRR/ARR (Monthly/Annual Recurring Revenue)**
   - **Why:** Revenue growth is primary business metric
   - **Target:** 20%+ MoM growth (early stage), 10%+ MoM growth (growth stage)
   - **Measurement:** Track monthly, report weekly

2. **Churn Rate**
   - **Why:** Churn directly impacts revenue and LTV
   - **Target:** <5% monthly churn (Starter), <3% monthly churn (Growth), <1% monthly churn (Enterprise)
   - **Measurement:** Track monthly, report weekly

3. **LTV/CAC Ratio (Lifetime Value / Customer Acquisition Cost)**
   - **Why:** Unit economics determine business viability
   - **Target:** >3:1 (minimum), >5:1 (good), >10:1 (excellent)
   - **Measurement:** Track quarterly, report monthly

4. **NPS (Net Promoter Score)**
   - **Why:** Customer satisfaction drives retention and referrals
   - **Target:** >50 (good), >70 (excellent)
   - **Measurement:** Track quarterly, survey monthly

5. **Activation Rate**
   - **Why:** Activation indicates product-market fit
   - **Target:** >60% (users creating first job within 7 days)
   - **Measurement:** Track weekly, report monthly

**❌ Metrics That Don't Matter (Yet):**
- Total user count (if not paying)
- GitHub stars (vanity metric)
- Social media followers (vanity metric)
- Blog traffic (unless converting to customers)

---

### 4.2 Operational Metrics

**✅ Metrics That Matter:**

1. **Uptime/SLA**
   - **Why:** Service reliability drives customer trust
   - **Target:** >99.9% uptime (Starter), >99.95% uptime (Growth), >99.99% uptime (Enterprise)
   - **Measurement:** Track daily, report weekly

2. **Support Response Time**
   - **Why:** Support quality drives customer satisfaction
   - **Target:** Meet documented SLAs (24 hours Starter, 4 hours Growth, 1 hour Enterprise)
   - **Measurement:** Track daily, report weekly

3. **Error Rate**
   - **Why:** Product quality drives customer trust
   - **Target:** <1% error rate (API errors, reconciliation failures)
   - **Measurement:** Track daily, report weekly

4. **Support Ticket Volume**
   - **Why:** Support burden impacts costs and scalability
   - **Target:** <5 tickets per customer per month (Starter), <3 tickets per customer per month (Growth)
   - **Measurement:** Track daily, report weekly

**❌ Metrics That Don't Matter (Yet):**
- Server response time (unless impacting customers)
- Database query performance (unless impacting customers)
- Infrastructure costs (unless impacting margins)

---

### 4.3 Financial Metrics

**✅ Metrics That Matter:**

1. **Gross Margin**
   - **Why:** Profitability determines business viability
   - **Target:** >75% (Starter), >80% (Growth), >85% (Enterprise)
   - **Measurement:** Track monthly, report quarterly

2. **Burn Rate**
   - **Why:** Burn rate determines runway
   - **Target:** <$50K/month (early stage), <$100K/month (growth stage)
   - **Measurement:** Track monthly, report monthly

3. **CAC Payback Period**
   - **Why:** CAC payback determines cash flow
   - **Target:** <6 months (good), <3 months (excellent)
   - **Measurement:** Track quarterly, report monthly

4. **Revenue per Customer**
   - **Why:** ARPU determines pricing effectiveness
   - **Target:** >$50/month (Starter), >$100/month (Growth), >$500/month (Enterprise)
   - **Measurement:** Track monthly, report monthly

**❌ Metrics That Don't Matter (Yet):**
- Total revenue (unless profitable)
- Customer count (unless paying)
- Market share (unless profitable)

---

### 4.4 Product Metrics

**✅ Metrics That Matter:**

1. **Time to First Value**
   - **Why:** Onboarding effectiveness drives activation
   - **Target:** <24 hours (good), <1 hour (excellent)
   - **Measurement:** Track weekly, report monthly

2. **Feature Adoption**
   - **Why:** Feature usage indicates value delivery
   - **Target:** >50% adoption for core features
   - **Measurement:** Track weekly, report monthly

3. **API Usage**
   - **Why:** API usage indicates customer engagement
   - **Target:** >100 API calls per customer per month (Starter), >1K API calls per customer per month (Growth)
   - **Measurement:** Track daily, report weekly

4. **Exception Rate**
   - **Why:** Exception rate indicates product quality
   - **Target:** <1% exception rate (reconciliations requiring manual review)
   - **Measurement:** Track daily, report weekly

**❌ Metrics That Don't Matter (Yet):**
- Page views (unless converting to customers)
- Session duration (unless converting to customers)
- Feature requests (unless high-priority)

---

## 5. Decision Process

### 5.1 Standard Decision Process

**For Decisions <$10K:**
1. Evaluate against frameworks above
2. Get team lead approval
3. Document decision rationale
4. Execute

**For Decisions $10K-$50K:**
1. Evaluate against frameworks above
2. Create decision document (cost, ROI, rationale)
3. Get leadership approval
4. Document decision
5. Execute

**For Decisions >$50K:**
1. Evaluate against frameworks above
2. Create comprehensive decision document
3. Present to leadership team
4. Get board approval (if required)
5. Document decision
6. Execute

### 5.2 Exception Process

**For Exceptions to "Never Build" List:**
1. Document exception rationale
2. Get leadership approval
3. Assess ROI and risk
4. Create exception approval document
5. Execute with increased monitoring

---

## 6. Summary

**Key Principles:**
- ✅ Focus on core value proposition (reconciliation)
- ✅ Say yes to features that improve developer experience
- ✅ Say no to scope creep and custom work
- ✅ Never build features that compete with platforms
- ✅ Track metrics that matter (revenue, churn, LTV/CAC)

**Decision Framework Usage:**
- Use frameworks for all product/operational decisions
- Document exceptions and rationale
- Review frameworks quarterly
- Update frameworks based on learnings

---

**Last Updated:** January 2026  
**Next Review:** Quarterly  
**Owner:** Leadership Team
