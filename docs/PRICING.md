# Pricing Documentation - Settler Enterprise

**Last Updated:** December 2024

---

## Pricing Model

Settler uses a **usage-based pricing model** with a simple base fee plus per-transaction pricing.

**Core Value:** "$0.01 per transaction"

---

## Pricing Tiers

### Free Tier

- **Base Price:** $0/month
- **Included Transactions:** 100 transactions/month
- **Overage Pricing:** $0.01 per transaction over 100
- **Use Case:** Testing, small projects, evaluation

**Limitations:**
- 100 transactions/month included
- Basic features only
- Community support

### Starter Tier

- **Base Price:** $29/month
- **Included Transactions:** 1,000 transactions/month
- **Overage Pricing:** $0.01 per transaction over 1,000
- **Use Case:** Small businesses, startups, side projects

**Example:** 2,500 transactions/month = $29 + (1,500 × $0.01) = $44/month

**Features:**
- All Free tier features
- Priority support
- API access
- Developer console

### Growth Tier

- **Base Price:** $99/month
- **Included Transactions:** 10,000 transactions/month
- **Overage Pricing:** $0.01 per transaction over 10,000
- **Use Case:** Growing businesses, established fintechs

**Example:** 25,000 transactions/month = $99 + (15,000 × $0.01) = $249/month

**Features:**
- All Starter tier features
- Advanced analytics
- Custom integrations
- SLA guarantee

### Enterprise Tier

- **Base Price:** Custom (typically $500-$10,000+/month)
- **Included Transactions:** Custom (typically 100K+)
- **Overage Pricing:** Volume discounts available
- **Use Case:** Large enterprises, high-volume processors

**Features:**
- All Growth tier features
- Dedicated support
- Custom SLA
- SSO/SAML
- Custom integrations
- On-premise options (available)

---

## Pricing Calculation

### Formula

```
Monthly Cost = Base Price + (Overage Transactions × $0.01)
```

Where:
- **Overage Transactions** = Max(0, Total Transactions - Included Transactions)

### Examples

**Free Tier:**
- 50 transactions: $0 + (0 × $0.01) = **$0**
- 150 transactions: $0 + (50 × $0.01) = **$0.50**

**Starter Tier:**
- 500 transactions: $29 + (0 × $0.01) = **$29**
- 2,500 transactions: $29 + (1,500 × $0.01) = **$44**
- 5,000 transactions: $29 + (4,000 × $0.01) = **$69**

**Growth Tier:**
- 5,000 transactions: $99 + (0 × $0.01) = **$99**
- 25,000 transactions: $99 + (15,000 × $0.01) = **$249**
- 50,000 transactions: $99 + (40,000 × $0.01) = **$499**

---

## Pricing Enforcement

### Implementation

**Location:** `config/pricing-simple.ts`

**Key Functions:**
- `calculateMonthlyCost(planId, transactionCount)` - Calculate monthly cost
- `exceedsPlanLimit(planId, transactionCount)` - Check if limit exceeded
- `getPlan(planId)` - Get plan details

### Enforcement Points

1. **API Routes:** Check subscription tier before processing
2. **Usage Tracking:** Track all transactions via `usage_events` table
3. **Billing:** Stripe integration for automatic billing
4. **Limits:** Enforced at API level, not just billing

**Code References:**
- Subscription access: `packages/web/src/lib/subscription-access.ts`
- Billing service: `packages/web/src/domain/billing/stripeService.ts`
- Usage tracking: `usage_events` table

---

## Usage Limits

### Transaction Limits

- **Free:** 100 transactions/month (hard limit)
- **Starter:** 1,000 included, unlimited overage
- **Growth:** 10,000 included, unlimited overage
- **Enterprise:** Custom limits

### Feature Limits

**Free Tier:**
- Basic reconciliation only
- Limited API calls (100/day)
- Community support

**Starter Tier:**
- Full reconciliation features
- 1,000 API calls/day
- Email support

**Growth Tier:**
- All features
- 10,000 API calls/day
- Priority support
- SLA guarantee

**Enterprise Tier:**
- All features
- Unlimited API calls
- Dedicated support
- Custom SLA

---

## Billing & Payment

### Payment Methods

- **Credit Card:** Stripe Checkout
- **Invoice:** Available for Enterprise
- **ACH:** Available for Enterprise

### Billing Cycle

- **Monthly:** Standard billing cycle
- **Annual:** Available with discount (contact sales)
- **Enterprise:** Custom billing terms

### Billing Process

1. **Usage Tracking:** All transactions tracked in real-time
2. **Monthly Calculation:** Cost calculated at month end
3. **Invoice Generation:** Automatic invoice generation
4. **Payment Processing:** Stripe handles payment
5. **Receipts:** Automatic receipt emails

**Implementation:**
- Stripe integration: `packages/web/src/domain/billing/stripeService.ts`
- Webhook handler: `packages/web/src/app/api/stripe/webhook/route.ts`
- Customer portal: `/api/stripe/portal`

---

## Pricing Comparison

### vs. Manual Reconciliation

- **Manual Cost:** $50-200/hour × 10-40 hours/month = $500-$8,000/month
- **Settler Cost:** $29-$99/month + usage
- **Savings:** 90%+ cost reduction

### vs. Enterprise Solutions

- **Enterprise Cost:** $1,000-$10,000+/month
- **Settler Cost:** $29-$99/month + usage
- **Savings:** 90%+ cost reduction

### vs. DIY Development

- **Development Cost:** $50,000-$200,000+ initial + $10,000-$50,000/year maintenance
- **Settler Cost:** $29-$99/month + usage
- **ROI:** Payback in months, not years

---

## Volume Discounts

### Enterprise Discounts

- **100K+ transactions/month:** 20% discount
- **500K+ transactions/month:** 30% discount
- **1M+ transactions/month:** 40% discount
- **Custom:** Negotiated pricing available

**Contact:** [sales@settler.dev] for volume pricing

---

## Pricing FAQ

### Q: What counts as a transaction?

A: A transaction is a single reconciliation operation (matching one source transaction to one or more target transactions).

### Q: Do failed transactions count?

A: No, only successful reconciliation operations count toward usage.

### Q: Can I change plans?

A: Yes, you can upgrade or downgrade at any time. Changes take effect immediately.

### Q: What happens if I exceed my limit?

A: Free tier: Service stops. Paid tiers: Overage billing applies.

### Q: Are there setup fees?

A: No, no setup fees for any tier.

### Q: Do you offer refunds?

A: We offer prorated refunds for unused portions of monthly subscriptions.

### Q: Can I get a custom plan?

A: Yes, contact [sales@settler.dev] for custom pricing.

---

## Pricing Updates

**Current Pricing:** Effective December 2024

**Price Changes:** We will notify customers 30 days in advance of any price changes.

**Grandfathering:** Existing customers are grandfathered at their current pricing for 12 months after price changes.

---

## Contact

**Sales:** [sales@settler.dev]  
**Billing:** [billing@settler.dev]  
**Support:** [support@settler.dev]

---

**Last Updated:** December 2024
