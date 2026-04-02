# Monthly Close Procedures

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Close Calendar

| Day   | Activity                   |
| ----- | -------------------------- |
| Day 1 | Month close begins         |
| Day 2 | Revenue reconciliation     |
| Day 3 | Cost reconciliation        |
| Day 4 | Margin calculation         |
| Day 5 | Financial summary complete |

---

## Day 1: Close Begins

### Steps

1. **Close Stripe billing period**
   - Verify all charges processed
   - Check for failed payments
   - Review any credits or refunds

2. **Export data from:**
   - Stripe Dashboard (revenue)
   - AWS Console (infrastructure costs)
   - Bank statements
   - Payment processor reports

3. **Create close folder**
   ```
   finance/close/YYYY-MM/
   ```

---

## Day 2: Revenue Reconciliation

### MRR Calculation

```
Starting MRR
+ New MRR (new customers)
- Churned MRR (cancellations)
+/- Expansion MRR (upgrades/downgrades)
= Net New MRR
= Ending MRR
```

### ARR Calculation

```
Ending MRR × 12 = ARR
```

### By Tier Breakdown

| Tier       | Customers | MRR    | % of Total |
| ---------- | --------- | ------ | ---------- |
| Starter    | X         | $X     | X%         |
| Growth     | X         | $X     | X%         |
| Scale      | X         | $X     | X%         |
| Enterprise | X         | $X     | X%         |
| **Total**  | **X**     | **$X** | **100%**   |

### Overage Revenue

- Total overage charges for month
- Number of customers with overages
- Revenue by tier

---

## Day 3: Cost Reconciliation

### Infrastructure Costs

- AWS/EC2 costs
- Database costs (Supabase)
- Stripe fees
- Email service costs
- Monitoring costs

### COGS Calculation

```
Infrastructure costs
+ Stripe fees
+ Support costs (estimated)
= Total COGS
```

### Gross Margin

```
Revenue - COGS
Gross Margin % = (Revenue - COGS) / Revenue × 100
Target: >80%
```

---

## Day 4: Margin Analysis

### Target Margins by Tier

| Tier        | Target Margin |
| ----------- | ------------- |
| Starter     | 75%           |
| Growth      | 82%           |
| Scale       | 85%           |
| Enterprise  | 80%           |
| **Overall** | **>80%**      |

### Variance Analysis

- Any tier below target?
- One-time costs?
- Investment mode acceptable?

---

## Day 5: Financial Summary

### Monthly Report Components

1. **Revenue Summary**
   - MRR, ARR
   - New, churned, net new
   - By tier breakdown
   - Overage revenue

2. **Cost Summary**
   - Infrastructure
   - Stripe fees
   - Total COGS
   - Gross margin %

3. **Customer Metrics**
   - Total customers
   - Active customers
   - Trial conversions
   - Churn rate

4. **Key Variances**
   - Budget vs actual
   - Month over month changes
   - Trend analysis

---

## Templates

### MRR Movement Report

```markdown
# MRR Movement Report - [Month] [Year]

## Starting MRR

$XXX,XXX

## New MRR

| Tier       | Customers | MRR      |
| ---------- | --------- | -------- |
| Starter    | X         | $XXX     |
| Growth     | X         | $XXX     |
| Scale      | X         | $XXX     |
| Enterprise | X         | $XXX     |
| **Total**  | **X**     | **$XXX** |

## Churned MRR

| Tier          | Customers | MRR |
| ------------- | --------- | --- |
| [same format] |           |     |

## Expansion/Contraction

| Tier          | Upgrades | Downgrades | Net |
| ------------- | -------- | ---------- | --- |
| [same format] |          |            |

## Ending MRR

$XXX,XXX

## Net New MRR

$XXX (or -$XXX for churn)

## YoY Growth

XX%

## Comments

[Notes on significant events]
```

---

## Key Metrics Tracking

### Weekly Track (in running month)

- MRR as of week end
- Trials started
- Conversions
- Churned (watch for pattern)

### Monthly Track

- Full P&L
- Cohort retention
- Unit economics update
- CAC tracking

---

## Financial Close Checklist

- [ ] Day 1: Export all data sources
- [ ] Day 2: Calculate MRR, ARR, by tier
- [ ] Day 2: Reconcile Stripe to records
- [ ] Day 3: Reconcile costs
- [ ] Day 3: Calculate COGS
- [ ] Day 4: Calculate margins
- [ ] Day 4: Variance analysis
- [ ] Day 5: Complete financial summary
- [ ] Day 5: Review with founder
- [ ] Day 5: File close folder

---

## Related Documents

| Document                           | Purpose                  |
| ---------------------------------- | ------------------------ |
| `COST_BASELINES.md`                | Cost structure reference |
| `../monetization/REVENUE_MODEL.md` | Revenue reference        |
| `../monetization/BILLING_OPS.md`   | Billing operations       |
