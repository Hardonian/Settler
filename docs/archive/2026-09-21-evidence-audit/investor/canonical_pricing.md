# Settler — Canonical Pricing Table

**Last Updated:** June 2026
**Status:** This is the single source of truth for all pricing references.
**Supersedes:** All prior pricing references in PRICING.md, ECONOMICS.md, INVESTOR_NARRATIVE.md, INVESTOR_OVERVIEW.md, and GTM_STRATEGY.md.

---

> [!IMPORTANT]
> All Settler documents, pitch materials, and investor communications must reference THIS document for pricing. Do not cite pricing from any other file without confirming it matches this table.

## Pricing Tiers

| Tier             | Monthly Base           | Included Transactions | Overage Rate     | Target Buyer                                                |
| ---------------- | ---------------------- | --------------------- | ---------------- | ----------------------------------------------------------- |
| **Free**         | $0                     | 100/month             | $0.01/txn        | Evaluation, developers testing API                          |
| **Starter**      | $29                    | 1,000/month           | $0.01/txn        | Small businesses, solo founders, side projects              |
| **Growth**       | $99                    | 10,000/month          | $0.01/txn        | Scaling businesses, established startups                    |
| **Professional** | $499                   | 100,000/month         | $0.005/txn       | Mid-market, multi-entity, accounting firms                  |
| **Enterprise**   | Custom ($500–$10,000+) | Custom                | Volume discounts | Large enterprises, high-volume processors, compliance-heavy |

## Monthly Cost Formula

```
Monthly Cost = Base Price + Max(0, (Total Transactions − Included Transactions)) × Overage Rate
```

## Example Calculations

| Scenario              | Tier         | Transactions | Calculation               | Monthly Cost   |
| --------------------- | ------------ | ------------ | ------------------------- | -------------- |
| Developer testing     | Free         | 50           | $0 + (0 × $0.01)          | **$0**         |
| Small e-commerce shop | Starter      | 2,500        | $29 + (1,500 × $0.01)     | **$44**        |
| Growing SaaS company  | Growth       | 25,000       | $99 + (15,000 × $0.01)    | **$249**       |
| Mid-market retailer   | Professional | 250,000      | $499 + (150,000 × $0.005) | **$1,249**     |
| Enterprise processor  | Enterprise   | 1M+          | Custom                    | **Negotiated** |

## Feature Matrix

| Feature                | Free      | Starter | Growth         | Professional | Enterprise      |
| ---------------------- | --------- | ------- | -------------- | ------------ | --------------- |
| Reconciliation engine  | ✅        | ✅      | ✅             | ✅           | ✅              |
| Proofpack export       | ❌        | ✅      | ✅             | ✅           | ✅              |
| Exception workflow     | Basic     | ✅      | ✅             | ✅           | ✅              |
| API access             | Read-only | ✅      | ✅             | ✅           | ✅              |
| Reconciliation history | 30 days   | 90 days | 1 year         | 2 years      | Unlimited       |
| Adapters               | 2         | 5       | All            | All          | All + Custom    |
| Daily API calls        | 100       | 1,000   | 10,000         | 100,000      | Unlimited       |
| Support                | Community | Email   | Priority email | Dedicated    | Dedicated + SLA |
| Multi-workspace        | ❌        | ❌      | ✅             | ✅           | ✅              |
| SSO / SAML             | ❌        | ❌      | ❌             | ✅           | ✅              |
| On-premise option      | ❌        | ❌      | ❌             | ❌           | ✅              |
| Custom integrations    | ❌        | ❌      | ❌             | ❌           | ✅              |

## Volume Discounts (Enterprise)

| Monthly Volume         | Discount             |
| ---------------------- | -------------------- |
| 100K–500K transactions | 20% off overage rate |
| 500K–1M transactions   | 30% off overage rate |
| 1M+ transactions       | 40% off overage rate |

## ROI Comparison

| Alternative                                | Typical Cost                                  | Settler Cost (Growth) | Savings               |
| ------------------------------------------ | --------------------------------------------- | --------------------- | --------------------- |
| Manual reconciliation (20 hrs/mo × $50/hr) | $1,000/month                                  | $99–$249/month        | **75–90%**            |
| Custom development                         | $50K–$200K initial + $10K–$50K/yr maintenance | $1,188–$2,988/year    | **90%+ over 3 years** |
| Enterprise solution (BlackLine, FloQast)   | $6,400–$28,000+/year                          | $1,188–$2,988/year    | **60–90%**            |

## Billing Mechanics

- **Payment:** Credit card via Stripe Checkout (all tiers). Invoice/ACH available for Enterprise.
- **Billing cycle:** Monthly. Annual available with discount (contact sales).
- **Metering:** All transactions tracked in real-time via `usage_events` table.
- **Overage:** Charged at end of billing period. Not real-time billing.
- **Upgrades:** Take effect immediately. Prorated.
- **Downgrades:** Take effect at next billing period.
- **Refunds:** Prorated for unused portion of monthly subscription.
- **Price protection:** 12-month price lock for annual contracts. 30-day notice for price changes.

## Implementation References

| Component              | Location                                           |
| ---------------------- | -------------------------------------------------- |
| Pricing config         | `config/pricing-simple.ts`                         |
| Stripe billing service | `packages/web/src/domain/billing/stripeService.ts` |
| Subscription access    | `packages/web/src/lib/subscription-access.ts`      |
| Webhook handler        | `packages/web/src/app/api/stripe/webhook/route.ts` |
| Customer portal        | `/api/stripe/portal`                               |
| Usage tracking         | `usage_events` table                               |

---

## Known Inconsistencies Resolved by This Document

| Document                     | Previous Claim                | Canonical Value                |
| ---------------------------- | ----------------------------- | ------------------------------ |
| `docs/PRICING.md`            | Free/$29/$99/Enterprise       | Free/$29/$99/$499/Enterprise   |
| `docs/ECONOMICS.md`          | Starter $99/Professional $499 | See canonical table above      |
| `INVESTOR_OVERVIEW.md`       | "$99/mo base + $0.01 per txn" | $99 is Growth tier, not base   |
| `docs/INVESTOR_NARRATIVE.md` | Starter $99/Growth $299       | Starter $29/Growth $99         |
| `GTM_STRATEGY.md`            | Developer free/Growth $99     | Free tier/Growth $99 (aligned) |

> Any future pricing change must update THIS document first, then propagate to all other references.
