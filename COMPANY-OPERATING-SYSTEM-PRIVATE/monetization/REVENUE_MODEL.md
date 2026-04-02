# Revenue Model

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## How We Make Money

### Revenue Streams

| Stream                   | Percentage | Description                      |
| ------------------------ | ---------- | -------------------------------- |
| **Subscriptions**        | 80%        | Monthly/annual recurring revenue |
| **Overage Fees**         | 15%        | Usage beyond plan limits         |
| **Enterprise Contracts** | 5%         | Custom pricing, custom SLAs      |

### Revenue Distribution by Tier

| Tier       | % of Customers | % of Revenue |
| ---------- | -------------- | ------------ |
| Free       | 70%            | 0%           |
| Starter    | 15%            | 15%          |
| Growth     | 10%            | 35%          |
| Scale      | 4%             | 40%          |
| Enterprise | 1%             | 10%          |

---

## Subscription Revenue (80%)

### Monthly Subscriptions

- Billed in advance
- Auto-renews monthly
- Cancel anytime (effective end of billing period)

### Annual Subscriptions

- Billed annually (save 17%)
- Prepayment required
- Auto-renews annually

### Revenue Recognition

- Monthly: Recognized monthly
- Annual: Deferred, recognized over contract term

---

## Overage Fees (15%)

### Overage Calculation

- $0.01 per reconciliation over plan limit
- Calculated monthly
- Automatically billed to payment method

### Overage Cap

- No cap on overage charges
- Customer can upgrade plan to avoid overages
- Warning at 80% of plan limit (email notification)

### Overage Communication

- Dashboard notification at 80%
- Email at 90%
- Email at 100% + overage begins
- Weekly summary of overage charges

---

## Enterprise Contracts (5%)

### Contract Structure

- Custom pricing based on value
- Annual or multi-year terms
- Negotiated SLAs
- Custom integrations if needed

### Typical Enterprise Pricing

| Scenario         | Price Range           |
| ---------------- | --------------------- |
| SMB Enterprise   | $1,000-$3,000/month   |
| Mid-Market       | $3,000-$6,000/month   |
| Large Enterprise | $6,000-$10,000+/month |

### Enterprise Contract Terms

- Net-30 payment standard
- Net-60 available for large contracts
- Prepay discounts available
- Custom SLA terms

---

## Unit Economics

### Customer Acquisition Cost (CAC)

- **Target:** $300
- **Payback Period:** 6 months

### Customer Lifetime Value (LTV)

- **Average LTV:** $3,600
- **Average Lifetime:** 3 years
- **Churn Assumption:** 5% monthly

### LTV:CAC Ratio

- **Target:** 12x
- **Healthy Range:** 8-15x

---

## Revenue Targets

### Year 1 (2026)

| Metric          | Target   |
| --------------- | -------- |
| MRR (End of Q1) | $10,000  |
| MRR (End of Q2) | $25,000  |
| MRR (End of Q3) | $40,000  |
| MRR (End of Q4) | $50,000  |
| ARR (Year End)  | $600,000 |

### Customer Targets

| Tier       | Q1  | Q2    | Q3    | Q4    |
| ---------- | --- | ----- | ----- | ----- |
| Free       | 500 | 1,000 | 2,000 | 3,000 |
| Starter    | 100 | 200   | 350   | 500   |
| Growth     | 25  | 50    | 100   | 150   |
| Scale      | 10  | 25    | 40    | 50    |
| Enterprise | 1   | 2     | 3     | 5     |

---

## Gross Margin Targets

| Category                     | Target Margin    |
| ---------------------------- | ---------------- |
| Infrastructure (AWS, Stripe) | 90% gross margin |
| Support                      | 70% gross margin |
| Enterprise sales             | 60% gross margin |
| **Overall target**           | **>80%**         |

---

## Revenue Recognition Policy

### Standard Subscriptions

- Revenue recognized ratably over subscription period
- Monthly subscriptions: 1/12 of annual revenue per month
- Annual subscriptions: 1/12 of contract value per month

### Overage Revenue

- Recognized in period incurred
- Estimated based on historical data

### Enterprise Contracts

- Recognized ratably over contract term
- Milestone-based contracts: Recognized at milestone completion

---

## Billing Infrastructure

### Stripe Configuration

- See `BILLING_OPS.md` for setup details
- All billing through Stripe
- Automatic invoicing
- Failed payment retry logic

### Payment Methods

- Credit card (default)
- ACH bank transfer (US, $500+)
- Wire transfer (Enterprise only)

---

## Financial Reporting

### Weekly Metrics

- New MRR
- Churned MRR
- Net New MRR
- Overage revenue

### Monthly Metrics

- ARR
- Gross margin
- Customer count by tier
- Revenue by tier
- Average revenue per user (ARPU)

### Quarterly Metrics

- LTV:CAC ratio
- Payback period
- Customer cohort analysis
- Revenue concentration risk

---

## Related Documents

| Document                             | Purpose            |
| ------------------------------------ | ------------------ |
| `BILLING_OPS.md`                     | Billing operations |
| `../finance/MONTHLY_CLOSE.md`        | Financial close    |
| `../finance/COST_BASELINES.md`       | Cost structure     |
| `../pricing/00_PRICING_CANONICAL.md` | Pricing reference  |
