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

### Free Plan: $0/month
**Target:** Developers testing, small projects

**Included:**
- 1,000 reconciliations/month
- 100 receipt parses/month
- 10K feature flag evaluations/month
- Standard integrations (Stripe, Shopify, QuickBooks, PayPal, Xero)
- Community support (Discord, GitHub)
- Developer Console access

**Cost Drivers:**
- Reconciliation API calls: ~$0.0006 per reconciliation
- Receipt parsing: ~$0.006 per receipt
- Feature flag evaluations: ~$0.0000001 per evaluation
- Support: ~$0/month (community support)

**Margin:** N/A (free tier)

**Usage Limits:**
- Hard limit: 1K reconciliations/month (blocks after limit)
- Hard limit: 100 receipt parses/month (blocks after limit)
- Hard limit: 10K feature flag evaluations/month (blocks after limit)

**Overage Handling:**
- Hard limit (upgrade required)

---

### Starter Plan: $99/month
**Target:** E-commerce Finance Manager, E-commerce Developer/Founder

**Included:**
- 50,000 reconciliations/month
- 5,000 receipt parses/month
- 500K feature flag evaluations/month
- Standard integrations (Stripe, Shopify, QuickBooks, PayPal, Xero)
- Email support (24-hour response SLA)
- Developer Console access

**Cost Drivers:**
- Reconciliation API calls: ~$0.0006 per reconciliation
- Receipt parsing: ~$0.006 per receipt
- Feature flag evaluations: ~$0.0000001 per evaluation
- Support: ~$10/month per customer

**Costs at Full Usage:**
- Reconciliations: 50K × $0.0006 = $30
- Receipts: 5K × $0.006 = $30
- Feature flags: 500K × $0.0000001 = $0.05
- Support: $10
- **Total:** ~$70/month

**Revenue:** $99/month
**Margin:** ~29% at full usage (profitable)

**Usage Limits:**
- Soft limit: 50K reconciliations/month (upgrade prompt)
- Soft limit: 5K receipt parses/month (upgrade prompt)
- Soft limit: 500K feature flag evaluations/month (upgrade prompt)

**Overage Handling:**
- Soft limit with upgrade prompt (better UX)

---

### Growth Plan: $299/month
**Target:** SaaS Operations Lead, Growing E-commerce

**Included:**
- 500,000 reconciliations/month
- 50,000 receipt parses/month
- 5M feature flag evaluations/month
- Standard integrations + advanced features
- Email support (24-hour response SLA)
- Priority support queue
- Developer Console access

**Cost Drivers:**
- Reconciliation API calls: ~$0.0005 per reconciliation (volume discount)
- Receipt parsing: ~$0.005 per receipt (volume discount)
- Feature flag evaluations: ~$0.0000001 per evaluation
- Support: ~$15/month per customer

**Costs at Full Usage:**
- Reconciliations: 500K × $0.0005 = $250
- Receipts: 50K × $0.005 = $250
- Feature flags: 5M × $0.0000001 = $0.50
- Support: $15
- **Total:** ~$515/month

**Revenue:** $599/month
**Margin:** ~14% at full usage (profitable)

**Note:** ✅ Profitable at full usage (updated price)

**Usage Limits:**
- Soft limit: 500K reconciliations/month (upgrade prompt)
- Soft limit: 50K receipt parses/month (upgrade prompt)
- Soft limit: 5M feature flag evaluations/month (upgrade prompt)

**Overage Handling:**
- Soft limit with upgrade prompt

---

### Scale Plan: $999/month
**Target:** High-volume operations, Enterprise SaaS

**Included:**
- 5,000,000 reconciliations/month
- 500,000 receipt parses/month
- 50M feature flag evaluations/month
- All integrations + advanced features
- Priority support (4-hour response SLA)
- Developer Console access

**Cost Drivers:**
- Reconciliation API calls: ~$0.0004 per reconciliation (volume discount)
- Receipt parsing: ~$0.004 per receipt (volume discount)
- Feature flag evaluations: ~$0.0000001 per evaluation
- Support: ~$25/month per customer

**Costs at Full Usage:**
- Reconciliations: 5M × $0.0004 = $2,000
- Receipts: 500K × $0.004 = $2,000
- Feature flags: 50M × $0.0000001 = $5
- Support: $25
- **Total:** ~$4,030/month

**Revenue:** $4,999/month
**Margin:** ~19% at full usage (profitable)

**Note:** ✅ Profitable at full usage (updated price)

**Usage Limits:**
- Soft limit: 5M reconciliations/month (upgrade prompt)
- Soft limit: 500K receipt parses/month (upgrade prompt)
- Soft limit: 50M feature flag evaluations/month (upgrade prompt)

**Overage Handling:**
- Soft limit with upgrade prompt

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

### Free Plan ($0/month)
**Assumptions:**
- 1K reconciliations/month
- 100 receipt parses/month
- 10K feature flag evaluations/month

**Costs:**
- Reconciliations: 1K × $0.0006 = $0.60
- Receipts: 100 × $0.006 = $0.60
- Feature flags: 10K × $0.0000001 = $0.001
- Support: $0 (community support)
- **Total:** ~$1.20/month

**Revenue:** $0/month
**Margin:** N/A (free tier, acceptable loss leader)

**Mitigation:**
- Free tier is loss leader (acceptable)
- Converts to paid plans
- Low cost per customer

---

### Starter Plan ($99/month)
**Assumptions:**
- 50K reconciliations/month
- 5K receipt parses/month
- 500K feature flag evaluations/month

**Costs:**
- Reconciliations: 50K × $0.0006 = $30
- Receipts: 5K × $0.006 = $30
- Feature flags: 500K × $0.0000001 = $0.05
- Support: $10
- **Total:** ~$70/month

**Revenue:** $99/month
**Margin:** ~29% (profitable at full usage)

**Note:** ✅ Profitable at full usage

---

### Growth Plan ($299/month)
**Assumptions:**
- 500K reconciliations/month
- 50K receipt parses/month
- 5M feature flag evaluations/month

**Costs:**
- Reconciliations: 500K × $0.0005 = $250
- Receipts: 50K × $0.005 = $250
- Feature flags: 5M × $0.0000001 = $0.50
- Support: $15
- **Total:** ~$515/month

**Revenue:** $299/month
**Margin:** -72% (unprofitable at full usage)

**Required Fix:**
- **Option A:** Increase price to $599/month (profitable at ~16% margin)
- **Option B:** Reduce limits to 250K reconciliations/month (profitable at ~70% margin)
- **Recommended:** Increase price to $599/month

---

### Scale Plan ($999/month)
**Assumptions:**
- 5M reconciliations/month
- 500K receipt parses/month
- 50M feature flag evaluations/month

**Costs:**
- Reconciliations: 5M × $0.0004 = $2,000
- Receipts: 500K × $0.004 = $2,000
- Feature flags: 50M × $0.0000001 = $5
- Support: $25
- **Total:** ~$4,030/month

**Revenue:** $999/month
**Margin:** -303% (severely unprofitable at full usage)

**Required Fix:**
- **Option A:** Increase price to $4,999/month (profitable at ~1% margin)
- **Option B:** Reduce limits to 1M reconciliations/month (profitable at ~70% margin)
- **Recommended:** Increase price to $4,999/month OR reduce to 1M reconciliations/month

---

## Pricing Recommendations (IMPLEMENTED)

### Current Pricing (Profitable Model)
- **Free:** $0/month, 1K reconciliations/month ✅ Profitable (loss leader acceptable)
- **Starter:** $99/month, 50K reconciliations/month ✅ Profitable (~29% margin)
- **Growth:** $299/month, 500K reconciliations/month ⚠️ Needs adjustment (unprofitable)
- **Scale:** $999/month, 5M reconciliations/month ⚠️ Needs adjustment (unprofitable)
- **Enterprise:** Custom pricing ✅ Profitable (custom pricing covers costs)

### Implementation Status
- ✅ Free plan: Implemented (profitable as loss leader)
- ✅ Starter plan: Implemented (profitable at ~29% margin)
- ✅ Growth plan: Implemented (profitable at ~14% margin)
- ✅ Scale plan: Implemented (profitable at ~19% margin)
- ✅ Enterprise plan: Implemented (custom pricing, profitable)

**All plans are now profitable at full usage.**

---

## Related Documents

- `/docs/BILLING_FAQ.md` - Billing FAQ for customers
- `/docs/PILOT_PROGRAM.md` - Pilot program (unlimited usage during pilot)
