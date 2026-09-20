# Pricing Documentation - Settler Enterprise

**Last Updated:** September 2026  
**Canonical Source of Truth:** `packages/types/src/commercial-spine.ts` (`PLAN_SPINE`)

---

## Pricing Model

Settler uses a **predictable tiered subscription model with metered overage and exception supervision**.

**Core Principle:** Transparent usage scaling with generous included volume and deterministically verifiable outcomes.

---

## Pricing Tiers (Canonical Commercial Spine)

### Starter Tier

- **Base Price:** $0/month (Free for validation & small teams)
- **Included Reconciliations:** 10,000 transactions/month
- **Reconciliation Overage:** $0.01 per transaction over 10,000
- **Included Exception Rate:** 1.0% of total volume
- **Exception Supervision Overage:** $0.10 per exception exceeding 1.0% threshold
- **Retention:** 7-day audit logs
- **Connectors:** 2 active platform adapters
- **Support:** Community & GitHub Discussions

### Pro Tier

- **Base Price:** $99/month
- **Included Reconciliations:** 100,000 transactions/month
- **Reconciliation Overage:** $0.01 per transaction over 100,000
- **Included Exception Rate:** 1.0% of total volume
- **Exception Supervision Overage:** $0.10 per exception exceeding 1.0% threshold
- **Retention:** 30-day audit logs
- **Connectors:** Unlimited platform adapters
- **Support:** Email support with 24-hour SLA

### Scale Tier

- **Base Price:** $399/month
- **Included Reconciliations:** 1,000,000 transactions/month
- **Reconciliation Overage:** $0.01 per transaction over 1,000,000
- **Included Exception Rate:** 1.0% of total volume
- **Exception Supervision Overage:** $0.10 per exception exceeding 1.0% threshold
- **Retention:** 90-day audit logs
- **Connectors:** Unlimited platform adapters
- **Support:** Priority support with dedicated Slack channel & 4-hour SLA

### Enterprise Tier

- **Base Price:** Custom annual contract (typically $25K–$250K+/year)
- **Included Reconciliations:** Custom high-volume bands (multi-million/month)
- **Reconciliation Overage:** Volume-tiered (down to $0.008 per transaction)
- **Exception Supervision:** Custom thresholds (down to $0.08 per exception)
- **Deployment:** Dedicated VPC, Single-Tenant AWS/GCP, or Air-Gapped On-Premise
- **Features:** Full TigerBeetle financial ledger, custom ERP adapters (SAP S/4HANA, NetSuite RFC 6962), SOX 404 maker-checker queues, cryptographic proofpack export, 24/7 dedicated enterprise SLA

---

## Pricing Calculation

### Formula

```
Monthly Cost = Base Price + (Max(0, Volume - IncludedVolume) × $0.01) + (Max(0, Exceptions - IncludedExceptions) × $0.10)
```

Where:

- `IncludedExceptions = TotalTransactions × IncludedExceptionRate (1.0%)`

### Calculation Examples

**Starter Tier ($0/mo):**

- 8,000 transactions, 40 exceptions: **$0.00** (within 10,000 limit)
- 15,000 transactions, 100 exceptions:
  - Base: $0
  - Volume overage: (15,000 - 10,000) × $0.01 = **$50.00**
  - Included exceptions: 15,000 × 0.01 = 150. (100 <= 150, so $0 exception fee)
  - Total: **$50.00**

**Pro Tier ($99/mo):**

- 80,000 transactions, 500 exceptions: **$99.00** (within 100,000 limit)
- 150,000 transactions, 2,000 exceptions:
  - Base: $99.00
  - Volume overage: (150,000 - 100,000) × $0.01 = **$500.00**
  - Included exceptions: 150,000 × 0.01 = 1,500. Excess = 500 × $0.10 = **$50.00**
  - Total: **$649.00**

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

- **Starter:** 10,000 reconciliations/month included, $0.01/overage
- **Pro:** 100,000 reconciliations/month included, $0.01/overage
- **Scale:** 1,000,000 reconciliations/month included, $0.01/overage
- **Enterprise:** Custom volume bands with high-scale commitments

### Feature Limits

**Starter Tier:**

- Core reconciliation engine & deterministic matching
- 2 verified platform connectors
- 7-day audit log retention
- Community support

**Pro Tier:**

- Unlimited platform connectors (Stripe, Shopify, PayPal, QuickBooks, Xero, etc.)
- 30-day audit log retention
- Advanced anomaly alerts & reconciliation reporting
- Email support with 24-hour SLA

**Scale Tier:**

- High-throughput processing pipelines
- 90-day audit log retention
- Automated exception adjudication workflows
- Priority support with dedicated Slack channel & 4-hour SLA

**Enterprise Tier:**

- All features plus dedicated TigerBeetle double-entry ledgering
- Custom ERP integrations (SAP S/4HANA, NetSuite journal sync)
- SOX 404 maker-checker approval matrices
- Single-tenant VPC or on-premise air-gapped deployment
- 99.99% uptime SLA with 24/7 dedicated engineering support

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
