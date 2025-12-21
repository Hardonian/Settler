# Unit Economics Tracking

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active  
**Purpose:** Track and monitor unit economics for business viability

---

## Overview

This document defines **unit economics metrics** and tracking processes for Settler.dev. These metrics are critical for business viability and investor readiness.

**Philosophy:** Unit economics determine business viability. Track them religiously.

---

## Key Metrics

### LTV/CAC Ratio

**Definition:** Lifetime Value / Customer Acquisition Cost

**Target:** > 3:1

**Calculation:**
- **LTV:** Average revenue per customer × Average customer lifetime (months)
- **CAC:** Total sales & marketing spend / Number of customers acquired

**Tracking:**
- Calculate monthly
- Track by acquisition channel
- Monitor trends

**Action:**
- If LTV/CAC < 3:1, optimize acquisition costs or increase pricing
- If LTV/CAC > 5:1, consider increasing acquisition spend

---

### Payback Period

**Definition:** Time to recover customer acquisition cost

**Target:** < 12 months

**Calculation:**
- **Payback Period:** CAC / (Average monthly revenue per customer × Gross margin %)

**Tracking:**
- Calculate monthly
- Track by acquisition channel
- Monitor trends

**Action:**
- If payback period > 12 months, optimize pricing or reduce CAC
- If payback period < 6 months, consider increasing acquisition spend

---

### Gross Margin

**Definition:** (Revenue - Cost of Goods Sold) / Revenue

**Target:** > 70%

**Calculation:**
- **Revenue:** Monthly recurring revenue (MRR)
- **COGS:** Infrastructure costs + Support costs + Payment processing fees

**Tracking:**
- Calculate monthly
- Track by customer segment
- Monitor trends

**Action:**
- If gross margin < 70%, optimize costs or increase pricing
- If gross margin > 80%, consider investing in growth

---

## Cost Breakdown

### Cost of Goods Sold (COGS)

**Infrastructure Costs:**
- Compute (servers, containers)
- Storage (database, files)
- Network (bandwidth, CDN)
- Third-party services (Supabase, Stripe)

**Support Costs:**
- Support team salaries
- Support tools (help desk, chat)
- Training and documentation

**Payment Processing:**
- Stripe fees (2.9% + $0.30 per transaction)
- Payment gateway fees

**Tracking:**
- Track monthly
- Allocate costs per customer
- Monitor trends

---

### Customer Acquisition Cost (CAC)

**Sales & Marketing Costs:**
- Marketing spend (ads, content, SEO)
- Sales team salaries
- Sales tools (CRM, email)
- Events and conferences

**Tracking:**
- Track monthly
- Track by acquisition channel
- Monitor trends

---

## Revenue Metrics

### Average Revenue Per User (ARPU)

**Definition:** Total MRR / Number of active customers

**Target:** Increase over time

**Tracking:**
- Calculate monthly
- Track by customer segment
- Monitor trends

**Action:**
- If ARPU decreasing, optimize pricing or upsell
- If ARPU increasing, consider expanding to new segments

---

### Monthly Recurring Revenue (MRR)

**Definition:** Sum of all monthly subscription revenue

**Target:** Increase month-over-month

**Tracking:**
- Calculate monthly
- Track by plan tier
- Monitor trends

**Action:**
- Track MRR growth rate
- Monitor churn impact on MRR
- Optimize pricing to increase MRR

---

### Customer Lifetime Value (LTV)

**Definition:** ARPU × Average customer lifetime (months)

**Target:** > 3× CAC

**Tracking:**
- Calculate monthly
- Track by customer segment
- Monitor trends

**Action:**
- If LTV < 3× CAC, optimize pricing or reduce churn
- If LTV > 5× CAC, consider increasing acquisition spend

---

## Usage Metrics

### Usage vs. Limits

**Definition:** Actual usage / Plan limit

**Target:** 30-50% usage

**Tracking:**
- Calculate monthly per customer
- Track by plan tier
- Monitor trends

**Action:**
- If usage > 80%, prompt upgrade
- If usage < 10%, consider plan downgrade
- Optimize limits based on usage patterns

---

### Cost per Reconciliation

**Definition:** Infrastructure cost / Number of reconciliations

**Target:** < $0.0006 per reconciliation

**Tracking:**
- Calculate monthly
- Track by customer segment
- Monitor trends

**Action:**
- If cost per reconciliation increasing, optimize infrastructure
- If cost per reconciliation decreasing, consider reducing prices

---

## Churn Metrics

### Monthly Churn Rate

**Definition:** Customers lost / Total customers at start of month

**Target:** < 5% monthly

**Tracking:**
- Calculate monthly
- Track by customer segment
- Monitor trends

**Action:**
- If churn > 5%, investigate causes and improve product/support
- If churn < 2%, consider increasing pricing

---

### Revenue Churn

**Definition:** MRR lost from churned customers / Total MRR at start of month

**Target:** < 5% monthly

**Tracking:**
- Calculate monthly
- Track by customer segment
- Monitor trends

**Action:**
- If revenue churn > 5%, investigate causes and improve product/support
- If revenue churn < 2%, consider increasing pricing

---

## Tracking Dashboard

### Monthly Dashboard

**Metrics:**
- LTV/CAC ratio
- Payback period
- Gross margin
- ARPU
- MRR
- LTV
- Churn rate
- Revenue churn

**Visualization:**
- Charts showing trends
- Comparison to targets
- Segment breakdowns

**Access:**
- Business team
- Finance team
- Executive team

---

## Reporting Schedule

### Weekly
- MRR growth
- Churn rate
- Usage metrics

### Monthly
- Full unit economics report
- LTV/CAC ratio
- Payback period
- Gross margin
- ARPU
- LTV

### Quarterly
- Comprehensive business review
- Investor-ready metrics
- Strategic recommendations

---

## Action Items

### Immediate (Week 1)
- [ ] Set up unit economics tracking dashboard
- [ ] Define cost allocation methodology
- [ ] Start tracking LTV/CAC ratio

### Short-term (Month 1)
- [ ] Calculate baseline unit economics
- [ ] Set targets for each metric
- [ ] Create monthly reporting process

### Long-term (Quarter 1)
- [ ] Optimize unit economics based on data
- [ ] Improve LTV/CAC ratio
- [ ] Reduce payback period

---

## Related Documents

- `DECISION_FRAMEWORKS.md` - Decision frameworks
- `PRICING_LOGIC.md` - Pricing logic
- `BUSINESS_READINESS_ASSESSMENT.md` - Business readiness assessment

---

**Document Status:** Active  
**Last Updated:** January 2026  
**Next Review:** Monthly (update metrics and targets)
