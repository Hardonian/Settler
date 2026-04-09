# Unit Economics - Settler Enterprise

**Last Updated:** December 2024

---

## Overview

Settler's unit economics are designed for sustainable, scalable growth with strong margins and efficient customer acquisition.

---

## Cost Structure

### Infrastructure Costs (15% of Revenue)

**Database (Supabase):**

- Base: $25/month (Pro plan)
- Usage: ~$0.10 per 1M queries
- Estimated: $100-500/month at scale

**Cache (Upstash Redis):**

- Base: $0 (free tier)
- Usage: ~$0.20 per 100K commands
- Estimated: $50-200/month at scale

**Hosting (Vercel):**

- Base: $20/month (Pro plan)
- Usage: ~$0.40 per 1M function invocations
- Estimated: $200-1000/month at scale

**Total Infrastructure:** ~15% of revenue

### Engineering Costs (Variable)

**Team:**

- Year 1: 1-2 engineers
- Year 3: 5-10 engineers
- Year 5: 20-30 engineers

**Cost per Engineer:** $150K-200K/year (including overhead)

### Sales & Marketing Costs (Variable)

**Year 1:**

- 1-2 sales reps: $100K-150K/year each
- Marketing: $50K-100K/year
- Total: $250K-400K/year

**Year 3:**

- 5-10 sales reps
- Marketing: $500K-1M/year
- Total: $1.5M-3M/year

### Operations Costs (Fixed)

**Tools & Services:**

- Monitoring (Sentry): $50-200/month
- Analytics: $100-500/month
- Other tools: $200-500/month
- Total: $350-1200/month

---

## Revenue Model

### Pricing Structure

**Free Tier:**

- Base: $0/month
- Usage: $0.01 per transaction over 100
- Average revenue: $0-10/month

**Starter Tier:**

- Base: $29/month
- Usage: $0.01 per transaction over 1,000
- Average revenue: $29-100/month
- Average: $50/month

**Growth Tier:**

- Base: $99/month
- Usage: $0.01 per transaction over 10,000
- Average revenue: $99-500/month
- Average: $200/month

**Enterprise Tier:**

- Base: $500-10,000+/month
- Usage: Volume discounts
- Average revenue: $2,000-10,000/month
- Average: $5,000/month

### Revenue Mix (Year 1)

**Target Distribution:**

- Free: 50% of customers, 5% of revenue
- Starter: 40% of customers, 40% of revenue
- Growth: 8% of customers, 35% of revenue
- Enterprise: 2% of customers, 20% of revenue

**Average Revenue Per User (ARPU):**

- Calculation: Weighted average
- Year 1 Target: $83/month
- Year 3 Target: $100/month
- Year 5 Target: $120/month

---

## Unit Economics

### Customer Acquisition Cost (CAC)

**Calculation:** Sales & Marketing Spend / New Customers

**Year 1:**

- Sales & Marketing: $300K/year
- New Customers: 1,000/year
- CAC: $300

**Year 3:**

- Sales & Marketing: $2M/year
- New Customers: 10,000/year
- CAC: $200

**Year 5:**

- Sales & Marketing: $10M/year
- New Customers: 50,000/year
- CAC: $200

**Target:** <$300 (Year 1), <$200 (Year 3+)

### Customer Lifetime Value (LTV)

**Calculation:** ARPU × Average Lifetime (months)

**Assumptions:**

- ARPU: $83/month (Year 1)
- Average Lifetime: 20 months (5% monthly churn)
- LTV: $83 × 20 = $1,660

**Year 3:**

- ARPU: $100/month
- Average Lifetime: 33 months (3% monthly churn)
- LTV: $100 × 33 = $3,300

**Year 5:**

- ARPU: $120/month
- Average Lifetime: 50 months (2% monthly churn)
- LTV: $120 × 50 = $6,000

### LTV/CAC Ratio

**Year 1:**

- LTV: $1,660
- CAC: $300
- Ratio: 5.5:1 ✅

**Year 3:**

- LTV: $3,300
- CAC: $200
- Ratio: 16.5:1 ✅

**Year 5:**

- LTV: $6,000
- CAC: $200
- Ratio: 30:1 ✅

**Target:** 5:1+ (excellent unit economics)

### CAC Payback Period

**Calculation:** CAC / (ARPU × Gross Margin)

**Year 1:**

- CAC: $300
- ARPU: $83/month
- Gross Margin: 85%
- Monthly Contribution: $83 × 0.85 = $70.55
- Payback: $300 / $70.55 = 4.3 months ✅

**Year 3:**

- CAC: $200
- ARPU: $100/month
- Gross Margin: 85%
- Monthly Contribution: $100 × 0.85 = $85
- Payback: $200 / $85 = 2.4 months ✅

**Target:** <3 months (strong unit economics)

---

## Gross Margins

### Gross Margin Calculation

**Revenue:** 100%
**Cost of Goods Sold (COGS):** 15%

- Infrastructure: 15%
- Support: 0% (scales with revenue)

**Gross Margin:** 85%

**Breakdown:**

- Infrastructure: 15%
- Engineering: 0% (not COGS)
- Sales & Marketing: 0% (not COGS)
- Operations: 0% (not COGS)

**Target:** 85%+ (excellent margins)

---

## Churn Analysis

### Monthly Churn Rate

**Year 1 Target:** <5% monthly
**Year 3 Target:** <3% monthly
**Year 5 Target:** <2% monthly

**Churn Drivers:**

- Product fit: Low (workflow lock-in)
- Price sensitivity: Low (low price point)
- Competition: Medium (first-mover advantage)
- Support: Low (good support)

**Retention Strategies:**

- Workflow lock-in (reconciliation becomes core infrastructure)
- Data network effects (more integrations = more value)
- Compliance evidence (audit trails become competitive moat)
- Developer experience (best-in-class DX creates switching costs)

---

## Revenue Projections

### Year 1

**Assumptions:**

- Starting customers: 0
- New customers: 1,000
- ARPU: $83/month
- Churn: 5% monthly
- Ending customers: ~600

**Revenue:**

- Starting MRR: $0
- New MRR: 1,000 × $83 = $83K
- Churned MRR: ~$25K
- Ending MRR: ~$58K
- **ARR: ~$700K**

**Target:** $1M ARR

### Year 3

**Assumptions:**

- Starting customers: 600
- New customers: 10,000
- ARPU: $100/month
- Churn: 3% monthly
- Ending customers: ~7,000

**Revenue:**

- Starting MRR: $58K
- New MRR: 10,000 × $100 = $1M
- Churned MRR: ~$200K
- Ending MRR: ~$858K
- **ARR: ~$10M**

**Target:** $10M ARR

### Year 5

**Assumptions:**

- Starting customers: 7,000
- New customers: 50,000
- ARPU: $120/month
- Churn: 2% monthly
- Ending customers: ~40,000

**Revenue:**

- Starting MRR: $858K
- New MRR: 50,000 × $120 = $6M
- Churned MRR: ~$1.2M
- Ending MRR: ~$5.7M
- **ARR: ~$68M**

**Target:** $50M ARR

---

## Profitability Analysis

### Break-Even Analysis

**Year 1:**

- Revenue: $700K ARR
- COGS: $105K (15%)
- Gross Profit: $595K
- Operating Expenses: $500K
- **Net Profit: $95K** ✅

**Year 3:**

- Revenue: $10M ARR
- COGS: $1.5M (15%)
- Gross Profit: $8.5M
- Operating Expenses: $5M
- **Net Profit: $3.5M** ✅

**Year 5:**

- Revenue: $68M ARR
- COGS: $10.2M (15%)
- Gross Profit: $57.8M
- Operating Expenses: $30M
- **Net Profit: $27.8M** ✅
- **EBITDA Margin: 41%** ✅

---

## Key Metrics Summary

### Unit Economics (Year 1)

- **ARPU:** $83/month
- **CAC:** $300
- **LTV:** $1,660
- **LTV/CAC:** 5.5:1 ✅
- **CAC Payback:** 4.3 months ✅
- **Gross Margin:** 85% ✅
- **Churn:** <5% monthly ✅

### Growth Metrics

- **MRR Growth:** 20%+ monthly
- **Customer Growth:** 1,000/year (Year 1)
- **Revenue Growth:** 20%+ monthly

### Efficiency Metrics

- **Magic Number:** >0.75 (efficient growth)
- **Rule of 40:** >40% (balanced growth and profitability)
- **Burn Multiple:** <1.0 (efficient capital usage)

---

## Sensitivity Analysis

### Key Variables

**ARPU Impact:**

- +10% ARPU → +10% LTV → +10% profitability

**Churn Impact:**

- -1% churn → +20% LTV → +20% profitability

**CAC Impact:**

- -10% CAC → +10% profitability

**Gross Margin Impact:**

- -5% margin → -5% profitability

---

## Conclusion

Settler's unit economics are **strong and scalable**:

✅ **Excellent LTV/CAC:** 5.5:1+  
✅ **Fast Payback:** <5 months  
✅ **High Margins:** 85%+ gross margin  
✅ **Low Churn:** <5% monthly  
✅ **Profitable:** Break-even in Year 1

**Investment Thesis:** Strong unit economics support sustainable, scalable growth with efficient capital usage.

---

**Last Updated:** December 2024  
**Next Review:** Quarterly
