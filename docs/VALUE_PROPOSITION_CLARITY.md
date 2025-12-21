# Settler.dev — Value Proposition Clarity

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Clear definitions of what customers are buying and how pricing works

---

## What is a Reconciliation?

### Definition

**One reconciliation = matching one source transaction with one target transaction.**

### Examples

**Example 1: E-commerce Order Reconciliation**
- **Source:** Shopify order #12345 for $100.00
- **Target:** Stripe payment charge_abc123 for $100.00
- **Result:** 1 reconciliation (matched)

**Example 2: SaaS Subscription Reconciliation**
- **Source:** Stripe subscription invoice_xyz789 for $49.00/month
- **Target:** QuickBooks invoice QB-2024-001 for $49.00
- **Result:** 1 reconciliation (matched)

**Example 3: Multi-Transaction Reconciliation**
- **Source:** Shopify order #12345 for $100.00
- **Target:** Stripe payment charge_abc123 for $100.00
- **Source:** Shopify order #12346 for $50.00
- **Target:** Stripe payment charge_def456 for $50.00
- **Result:** 2 reconciliations (both matched)

### What Counts as a Reconciliation?

✅ **Counts:**
- Matching one source transaction to one target transaction
- Automatic matching via matching rules
- Manual matching via exception review
- Successful reconciliation (matched or unmatched)

❌ **Does NOT Count:**
- Failed reconciliation attempts (API errors, invalid data)
- Test reconciliations (if marked as test)
- Reconciliation jobs that don't process any transactions
- API calls that don't result in reconciliation operations

### How Reconciliations Are Tracked

Reconciliations are tracked per reconciliation job run:
- Each transaction pair processed = 1 reconciliation
- Unmatched transactions still count as reconciliations (they were processed)
- Exception reviews count as reconciliations (they were processed)

---

## Exception Supervision Model

### What is an Exception?

**An exception is a reconciliation that requires manual review or intervention.**

### When Do Exceptions Occur?

Exceptions occur when:
1. **Automatic matching fails** — Transactions don't match automatically
2. **Data quality issues** — Missing or invalid data prevents matching
3. **Matching rule conflicts** — Multiple potential matches found
4. **Amount discrepancies** — Amounts don't match exactly (beyond tolerance)
5. **Date discrepancies** — Dates don't match (beyond tolerance)

### Exception Supervision Model

**Included Exception Rate:** 1% of reconciliation volume

**Example:**
- **Starter Plan:** 10,000 reconciliations/month
- **Included Exceptions:** 1% = 100 exceptions/month (auto-explained)
- **Overage:** $0.10 per exception requiring review beyond 100

**How It Works:**
1. **Automatic Exception Handling:** First 1% of exceptions are automatically explained/resolved
2. **Manual Review Required:** Exceptions beyond 1% require manual review
3. **Pricing:** $0.10 per exception requiring manual review

### Exception Pricing Examples

**Example 1: Starter Plan (10,000 reconciliations/month)**
- **Included:** 100 exceptions (1% of 10,000)
- **Actual Exceptions:** 150 exceptions
- **Overage:** 50 exceptions × $0.10 = $5.00
- **Total Cost:** $29 (base) + $5.00 (exceptions) = $34.00/month

**Example 2: Growth Plan (100,000 reconciliations/month)**
- **Included:** 1,000 exceptions (1% of 100,000)
- **Actual Exceptions:** 800 exceptions
- **Overage:** $0 (within included rate)
- **Total Cost:** $99/month

**Example 3: Scale Plan (1,000,000 reconciliations/month)**
- **Included:** 10,000 exceptions (1% of 1,000,000)
- **Actual Exceptions:** 15,000 exceptions
- **Overage:** 5,000 exceptions × $0.10 = $500.00
- **Total Cost:** $299 (base) + $500.00 (exceptions) = $799.00/month

---

## Pricing Model Explained

### Base Subscription Pricing

| Tier | Monthly Price | Included Reconciliations | Overage Price |
|------|---------------|--------------------------|---------------|
| Free | $0 | 1,000 | $0.01 per reconciliation |
| Starter | $29 | 10,000 | $0.01 per reconciliation |
| Growth | $99 | 100,000 | $0.01 per reconciliation |
| Scale | $299 | 1,000,000 | $0.01 per reconciliation |
| Enterprise | Custom | Unlimited | Custom |

### Overage Pricing

**Reconciliation Overage:**
- **Price:** $0.01 per reconciliation beyond included volume
- **Automatic:** Charges added to monthly bill
- **No Service Interruption:** Service continues, overage billed

**Exception Overage:**
- **Price:** $0.10 per exception requiring review beyond included rate (1%)
- **Included Rate:** 1% of reconciliation volume
- **Automatic:** Charges added to monthly bill

### Total Cost Calculation

**Total Monthly Cost = Base Price + Reconciliation Overage + Exception Overage**

**Example: Starter Plan**
- **Base Price:** $29/month
- **Reconciliations:** 12,000 (2,000 over limit)
- **Reconciliation Overage:** 2,000 × $0.01 = $20.00
- **Exceptions:** 150 (50 over 1% included rate)
- **Exception Overage:** 50 × $0.10 = $5.00
- **Total Cost:** $29 + $20.00 + $5.00 = $54.00/month

---

## Feature Differentiation

### All Plans Include

✅ **Core Features:**
- Reconciliation engine
- Matching rules (exact, fuzzy, custom)
- Webhooks
- API access
- Basic reporting (JSON export)

✅ **All Adapters:**
- Stripe, Shopify, QuickBooks, Xero, PayPal, Square, etc.
- No adapter restrictions (except Free tier: 2 adapters)

### Plan Differences

**Free Tier:**
- 1,000 reconciliations/month
- 2 adapters
- 7 days log retention
- Community support
- JSON export only

**Starter Tier:**
- 10,000 reconciliations/month
- 5 adapters
- 30 days log retention
- Email support (24-hour response, best-effort)
- JSON + CSV export
- Scheduled jobs

**Growth Tier:**
- 100,000 reconciliations/month
- 15 adapters
- 90 days log retention
- Priority email support (4-hour response)
- JSON + CSV + PDF export
- Scheduled jobs
- Advanced matching rules
- Multi-currency support
- Custom webhooks

**Scale Tier:**
- 1,000,000 reconciliations/month
- Unlimited adapters
- 1 year log retention
- Priority support (1-hour SLA)
- All export formats + white-label reports
- Scheduled jobs
- Advanced matching rules
- Multi-currency support
- Custom webhooks
- Multi-entity support
- Dedicated infrastructure
- 1 free custom adapter

**Enterprise Tier:**
- Unlimited reconciliations
- Unlimited adapters
- Custom log retention (up to 7 years)
- Dedicated account manager (1-hour SLA)
- All export formats + custom reports
- SSO (SAML, OIDC)
- SOC 2 Type II
- PCI-DSS Level 1
- HIPAA-Ready (on-demand)
- Custom SLAs (99.99% uptime)
- VPC peering
- Private endpoints
- Unlimited custom adapters

---

## Common Questions

### Q: What if I exceed my reconciliation limit?

**A:** You're automatically charged $0.01 per reconciliation over your limit. No service interruption. You'll receive a notification when you're approaching your limit.

### Q: What if I have more exceptions than the included rate?

**A:** You're automatically charged $0.10 per exception requiring review beyond the included rate (1% of reconciliation volume). Exceptions within the included rate are automatically explained/resolved.

### Q: Can I upgrade/downgrade anytime?

**A:** Yes! Upgrades are immediate. Downgrades take effect at the end of your billing cycle.

### Q: What happens to my data if I downgrade?

**A:** Your data is retained according to your new plan's log retention period. Data beyond the retention period is archived (not deleted) and can be restored if you upgrade.

### Q: Do you offer discounts for annual billing?

**A:** Yes! Save 17% with annual billing (equivalent to 2 months free).

### Q: What's the difference between reconciliation volume and API calls?

**A:** Reconciliation volume counts actual reconciliation operations (matching transactions). API calls count API requests (which may or may not result in reconciliations). API calls are rate-limited but not billed separately.

### Q: How do I track my usage?

**A:** Usage is tracked in real-time and displayed in your dashboard. You'll receive notifications when approaching limits.

---

## Pricing Calculator

### Estimate Your Monthly Cost

**Step 1: Choose Your Plan**
- Free: $0/month (1,000 reconciliations)
- Starter: $29/month (10,000 reconciliations)
- Growth: $99/month (100,000 reconciliations)
- Scale: $299/month (1,000,000 reconciliations)

**Step 2: Estimate Reconciliation Volume**
- How many transactions do you process per month?
- How many platforms do you reconcile between?
- Example: 5,000 orders/month × 2 platforms = 10,000 reconciliations/month

**Step 3: Estimate Exception Rate**
- Typical exception rate: 1-5% of reconciliation volume
- If your exception rate is >1%, calculate overage:
  - Exceptions beyond 1% × $0.10 = Exception overage

**Step 4: Calculate Total Cost**
- Base Price + Reconciliation Overage + Exception Overage = Total Cost

**Example Calculation:**
- **Plan:** Growth ($99/month)
- **Reconciliations:** 120,000/month (20,000 over limit)
- **Reconciliation Overage:** 20,000 × $0.01 = $200.00
- **Exception Rate:** 2% (2,400 exceptions)
- **Included Exceptions:** 1% (1,200 exceptions)
- **Exception Overage:** 1,200 × $0.10 = $120.00
- **Total Cost:** $99 + $200.00 + $120.00 = $419.00/month

---

## Summary

**Key Takeaways:**
1. **One reconciliation = matching one source transaction to one target transaction**
2. **Exception supervision model:** 1% exception rate included, $0.10 per exception requiring review
3. **Overage pricing:** $0.01 per reconciliation, $0.10 per exception (beyond included rate)
4. **All plans include core features** — differences are volume limits, support, and advanced features
5. **Upgrade/downgrade anytime** — no long-term contracts (except Enterprise)

**For More Information:**
- [Pricing Page](../internal/business/01-business-model-market-story/pricing-page.md)
- [Support Model](../SUPPORT_MODEL.md)
- [API Documentation](../api.md)

---

**Last Updated:** January 2026  
**Owner:** Product/Marketing Team
