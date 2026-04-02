# Cost Baselines

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Cost Structure Overview

### Major Cost Categories

| Category       | % of Costs | Variable?           |
| -------------- | ---------- | ------------------- |
| Infrastructure | 60%        | Yes (usage-based)   |
| Stripe Fees    | 15%        | Yes (revenue-based) |
| Support        | 15%        | No (fixed)          |
| Other          | 10%        | Mixed               |

---

## Infrastructure Costs

### AWS EC2

| Usage         | Monthly Cost |
| ------------- | ------------ |
| Development   | $50-100      |
| Staging       | $50-100      |
| Production    | $200-500     |
| **Total EC2** | **$300-700** |

### Supabase (PostgreSQL)

| Usage              | Monthly Cost |
| ------------------ | ------------ |
| Development        | $25          |
| Production         | $75-200      |
| **Total Supabase** | **$100-225** |

### Storage (S3)

| Usage        | Monthly Cost |
| ------------ | ------------ |
| Per GB       | $0.023       |
| 100 GB/month | $2.30        |
| 1 TB/month   | $23          |
| **Estimate** | **$10-50**   |

### Data Transfer

| Usage        | Monthly Cost |
| ------------ | ------------ |
| Per GB       | $0.09        |
| 100 GB/month | $9           |
| **Estimate** | **$5-20**    |

### Monitoring (Datadog/PagerDuty)

| Service              | Monthly Cost |
| -------------------- | ------------ |
| Datadog              | $50-200      |
| PagerDuty            | $30-100      |
| **Total Monitoring** | **$80-300**  |

### Total Infrastructure

```
Minimum: $500/month
Typical: $800-1,500/month
Peak:    $2,000+/month
```

---

## Stripe Fees

### Standard Fees

| Fee Type    | Rate          |
| ----------- | ------------- |
| Credit card | 2.9% + $0.30  |
| ACH         | 0.8% (max $5) |

### Fee Calculation

```
Total Revenue × 2.9% + $0.30 per transaction
Typical: 3-4% of revenue
```

### Fee Optimization

- ACH for large Enterprise payments ($500+)
- Annual billing reduces transaction frequency
- Enterprise: Negotiate custom rates at >$10K MRR

---

## Support Costs

### Self-Support (Current)

| Resource            | Monthly Cost      |
| ------------------- | ----------------- |
| Founder time (est.) | $0 (founder cost) |
| Documentation       | $0                |
| Community           | $0                |
| **Total**           | **$0**            |

### Future Support Structure

| Tier       | Model        | Cost          |
| ---------- | ------------ | ------------- |
| OSS        | Community    | $0            |
| Starter    | Email        | $50/customer  |
| Growth+    | Email + Chat | $100/customer |
| Enterprise | Dedicated    | $500/customer |

---

## Cost Baselines by Tier

### Per Customer Costs

| Tier       | Infrastructure | Support | Stripe Fees | Total  |
| ---------- | -------------- | ------- | ----------- | ------ |
| Free       | $0.50          | $0      | $0          | $0.50  |
| Starter    | $1.00          | $0.50   | $1.45       | $2.95  |
| Growth     | $2.00          | $1.00   | $4.45       | $7.45  |
| Scale      | $5.00          | $2.00   | $11.45      | $18.45 |
| Enterprise | $20.00         | $5.00   | $30.00      | $55.00 |

### Margin by Tier

| Tier       | Price  | Cost   | Margin |
| ---------- | ------ | ------ | ------ |
| Free       | $0     | $0.50  | N/A    |
| Starter    | $29    | $2.95  | 90%    |
| Growth     | $99    | $7.45  | 92%    |
| Scale      | $299   | $18.45 | 94%    |
| Enterprise | $2,000 | $55.00 | 97%    |

---

## Gross Margin Targets

### Monthly Targets

| Month   | Target Margin |
| ------- | ------------- |
| Q1 2026 | 75%           |
| Q2 2026 | 78%           |
| Q3 2026 | 80%           |
| Q4 2026 | 82%           |
| 2027+   | >85%          |

### Why Margins Improve Over Time

1. Fixed costs spread over more customers
2. Economies of scale on infrastructure
3. Automation reduces support costs
4. Enterprise mix increases

---

## Cost Optimization Levers

### Quick Wins

- [ ] Reserved instances for production
- [ ] S3 lifecycle policies
- [ ] Database connection pooling
- [ ] CDN for static assets

### Medium Term

- [ ] Multi-region optimization
- [ ] Auto-scaling policies
- [ ] Enterprise negotiation (Stripe fees)
- [ ] Support ticket automation

### Long Term

- [ ] Custom infrastructure (vs managed)
- [ ] Hybrid deployment options
- [ ] Enterprise cost recovery

---

## Budget vs Actual Tracking

### Monthly Budget Template

```markdown
# Budget vs Actual - [Month] [Year]

## Revenue

| Category   | Budget | Actual | Variance |
| ---------- | ------ | ------ | -------- |
| MRR        | $X     | $X     | X%       |
| Overage    | $X     | $X     | X%       |
| Enterprise | $X     | $X     | X%       |
| **Total**  | **$X** | **$X** | **X%**   |

## Costs

| Category       | Budget | Actual | Variance |
| -------------- | ------ | ------ | -------- |
| Infrastructure | $X     | $X     | X%       |
| Stripe Fees    | $X     | $X     | X%       |
| Support        | $X     | $X     | X%       |
| Other          | $X     | $X     | X%       |
| **Total**      | **$X** | **$X** | **X%**   |

## P&L

| Line           | Budget | Actual | Variance |
| -------------- | ------ | ------ | -------- |
| Revenue        | $X     | $X     | X%       |
| COGS           | $X     | $X     | X%       |
| Gross Profit   | $X     | $X     | X%       |
| Gross Margin % | XX%    | XX%    | X%       |

## Comments

[Significant variances explained]
```

---

## Related Documents

| Document                           | Purpose                  |
| ---------------------------------- | ------------------------ |
| `MONTHLY_CLOSE.md`                 | Monthly close procedures |
| `../monetization/REVENUE_MODEL.md` | Revenue reference        |
| `../monetization/BILLING_OPS.md`   | Billing operations       |
