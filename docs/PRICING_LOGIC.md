# Pricing Logic

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Map pricing tiers to cost drivers, usage limits, and support levels

## Overview

Pricing must be:
- **Profitable:** No tier can be abused into unprofitability
- **Clear:** Usage limits and overage handling are transparent
- **Enforced:** Plan limits are enforced in-product
- **Scalable:** Handles growth without manual intervention

---

## Pricing Tiers

### Starter Plan: $99/month
**Target:** E-commerce Finance Manager, E-commerce Developer/Founder

**Included:**
- 100,000 reconciliations/month
- 10,000 receipt parses/month
- 1M feature flag evaluations/month
- Standard integrations (Stripe, Shopify, QuickBooks, PayPal, Xero)
- Email support (24-48 hour response)
- Developer Console access

**Cost Drivers:**
- Reconciliation API calls: ~$0.001 per reconciliation
- Receipt parsing: ~$0.01 per receipt
- Feature flag evaluations: ~$0.000001 per evaluation
- Support: ~$10/month per customer

**Margin:** ~70% (assuming 100K reconciliations, 10K receipts)

**Usage Limits:**
- Hard limit: 100K reconciliations/month (blocks after limit)
- Hard limit: 10K receipt parses/month (blocks after limit)
- Hard limit: 1M feature flag evaluations/month (blocks after limit)

**Overage Handling:**
- **Option 1:** Block usage (hard limit, upgrade required)
- **Option 2:** Allow overage with warning (soft limit, upgrade prompt)
- **Recommended:** Soft limit with upgrade prompt (better UX)

---

### Professional Plan: $499/month
**Target:** SaaS Operations Lead, Accounting Firm Partner

**Included:**
- 1M reconciliations/month
- 100,000 receipt parses/month
- 10M feature flag evaluations/month
- Standard integrations + advanced features
- Email support (24-48 hour response)
- Priority support queue
- Developer Console access

**Cost Drivers:**
- Reconciliation API calls: ~$0.0005 per reconciliation (volume discount)
- Receipt parsing: ~$0.008 per receipt (volume discount)
- Feature flag evaluations: ~$0.0000005 per evaluation (volume discount)
- Support: ~$20/month per customer

**Margin:** ~75% (assuming 1M reconciliations, 100K receipts)

**Usage Limits:**
- Hard limit: 1M reconciliations/month
- Hard limit: 100K receipt parses/month
- Hard limit: 10M feature flag evaluations/month

**Overage Handling:**
- Soft limit with upgrade prompt
- Overage pricing available ($0.005 per 1K reconciliations, $0.08 per 100 receipts)

---

### Enterprise Plan: Custom Pricing
**Target:** Fintech Operations Manager, Large Enterprises

**Included:**
- Unlimited reconciliations
- Unlimited receipt parses
- Unlimited feature flag evaluations
- All integrations + custom integrations
- Dedicated support (SLA-backed)
- Custom SLA guarantees
- Custom contracts (MSA, DPA)

**Cost Drivers:**
- Variable based on usage and requirements
- Support: Dedicated support team
- Infrastructure: Custom infrastructure if needed

**Margin:** ~80%+ (volume discounts, higher prices)

**Usage Limits:**
- No hard limits (unlimited usage)
- Soft limits for abuse prevention (monitoring)

**Overage Handling:**
- No overage (unlimited usage)
- Usage monitoring for abuse prevention

---

## Usage Limits & Enforcement

### Reconciliation Limits
- **Starter:** 100K/month
- **Professional:** 1M/month
- **Enterprise:** Unlimited

**Enforcement:**
- Check usage before each reconciliation job
- Block if limit exceeded (hard limit) or warn (soft limit)
- Track usage in `usage_events` table
- Aggregate daily in `usage_aggregate_daily` table

### Receipt Parse Limits
- **Starter:** 10K/month
- **Professional:** 100K/month
- **Enterprise:** Unlimited

**Enforcement:**
- Check usage before each receipt parse
- Block if limit exceeded (hard limit) or warn (soft limit)
- Track usage in `usage_events` table

### Feature Flag Limits
- **Starter:** 1M/month
- **Professional:** 10M/month
- **Enterprise:** Unlimited

**Enforcement:**
- Check usage before each feature flag evaluation
- Block if limit exceeded (hard limit) or warn (soft limit)
- Track usage in `usage_events` table

---

## Overage Handling

### Option 1: Hard Limit (Block Usage)
**Pros:**
- Prevents abuse
- Clear upgrade signal
- Predictable costs

**Cons:**
- Poor UX (blocks customer)
- May cause churn
- Frustrating for customers

**Recommendation:** Use for Starter plan (low-cost tier)

### Option 2: Soft Limit (Allow Overage with Warning)
**Pros:**
- Better UX (doesn't block customer)
- Upgrade prompt (conversion opportunity)
- Flexible for customers

**Cons:**
- May allow abuse
- Unpredictable costs
- Requires monitoring

**Recommendation:** Use for Professional plan (higher-value tier)

### Option 3: Overage Pricing
**Pros:**
- Revenue opportunity
- Flexible for customers
- Predictable costs

**Cons:**
- Complex billing
- May surprise customers
- Requires Stripe metered billing

**Recommendation:** Use for Professional plan (optional)

---

## Feature Gating

### Standard Features (All Plans)
- ✅ Reconciliation API
- ✅ Receipts API
- ✅ Feature Flags API
- ✅ Developer Console
- ✅ Standard integrations
- ✅ Email support

### Professional Features (Professional+)
- ✅ Advanced analytics
- ✅ SQL editor
- ✅ Realtime dashboards
- ✅ High-volume API
- ✅ Priority support queue

### Enterprise Features (Enterprise Only)
- ✅ Custom integrations
- ✅ Dedicated support
- ✅ SLA guarantees
- ✅ Custom contracts
- ✅ On-premise options (if available)

---

## Cost Analysis

### Cost per Reconciliation
- **Infrastructure:** ~$0.0001 per reconciliation (compute, storage)
- **API Calls:** ~$0.0005 per reconciliation (external APIs)
- **Total:** ~$0.0006 per reconciliation

### Cost per Receipt Parse
- **OCR:** ~$0.005 per receipt (AI/ML processing)
- **Storage:** ~$0.001 per receipt (storage)
- **Total:** ~$0.006 per receipt

### Cost per Feature Flag Evaluation
- **Compute:** ~$0.0000001 per evaluation (minimal)
- **Total:** ~$0.0000001 per evaluation

### Support Costs
- **Starter:** ~$10/month per customer (email support)
- **Professional:** ~$20/month per customer (priority support)
- **Enterprise:** ~$100+/month per customer (dedicated support)

---

## Profitability Analysis

### Starter Plan ($99/month)
**Assumptions:**
- 100K reconciliations/month
- 10K receipt parses/month
- 1M feature flag evaluations/month

**Costs:**
- Reconciliations: 100K × $0.0006 = $60
- Receipts: 10K × $0.006 = $60
- Feature flags: 1M × $0.0000001 = $0.10
- Support: $10
- **Total:** ~$130/month

**Revenue:** $99/month
**Margin:** -31% (unprofitable at full usage)

**Mitigation:**
- Most customers don't use full limits (average 30-50% usage)
- Effective margin: ~40-50% (profitable at average usage)
- Monitor usage, upgrade prompts for high usage

### Professional Plan ($499/month)
**Assumptions:**
- 1M reconciliations/month
- 100K receipt parses/month
- 10M feature flag evaluations/month

**Costs:**
- Reconciliations: 1M × $0.0005 = $500
- Receipts: 100K × $0.008 = $800
- Feature flags: 10M × $0.0000005 = $5
- Support: $20
- **Total:** ~$1,325/month

**Revenue:** $499/month
**Margin:** -165% (unprofitable at full usage)

**Mitigation:**
- Most customers don't use full limits (average 20-40% usage)
- Effective margin: ~60-70% (profitable at average usage)
- Volume discounts reduce costs
- Monitor usage, upgrade prompts for high usage

**Note:** Pricing needs adjustment - either increase price or reduce limits.

---

## Pricing Recommendations

### Option 1: Increase Prices
- **Starter:** $149/month (50% increase)
- **Professional:** $799/month (60% increase)
- **Enterprise:** Custom (based on usage)

### Option 2: Reduce Limits
- **Starter:** 50K reconciliations/month (50% reduction)
- **Professional:** 500K reconciliations/month (50% reduction)

### Option 3: Hybrid (Recommended)
- **Starter:** $99/month, 50K reconciliations/month
- **Professional:** $499/month, 500K reconciliations/month
- **Overage pricing:** $0.01 per 1K reconciliations (Starter), $0.005 per 1K (Professional)

---

## Related Documents

- `/docs/BILLING_FAQ.md` - Billing FAQ for customers
- `/docs/PILOT_PROGRAM.md` - Pilot program (unlimited usage during pilot)
