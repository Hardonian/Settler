# Billing FAQ

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Answer common billing questions from customers

## Overview

This FAQ answers common questions about:

- Pricing and plans
- Usage limits and overages
- Billing and payments
- Upgrades and downgrades
- Refunds and cancellations

---

## Pricing & Plans

### What plans are available?

**Answer:** Settler offers three plans:

1. **Starter:** $99/month
   - 100,000 reconciliations/month
   - 10,000 receipt parses/month
   - 1M feature flag evaluations/month
   - Email support

2. **Professional:** $499/month
   - 1M reconciliations/month
   - 100,000 receipt parses/month
   - 10M feature flag evaluations/month
   - Priority support

3. **Enterprise:** Custom pricing
   - Unlimited usage
   - Dedicated support
   - SLA guarantees
   - Custom contracts

---

### Can I try before I buy?

**Answer:** Yes. Settler offers a 14-day free trial with full access to all features. No credit card required.

**Trial Includes:**

- Full API access
- Unlimited usage during trial
- All standard integrations
- Developer Console access
- Email support

**After Trial:**

- Upgrade to a paid plan to continue
- Or let trial expire (access revoked after 7-day grace period)

---

### What happens if I exceed my usage limits?

**Answer:** Depends on your plan:

**Starter Plan:**

- Hard limit: Usage blocked after limit
- Upgrade prompt: Upgrade to Professional for higher limits

**Professional Plan:**

- Soft limit: Usage allowed with warning
- Upgrade prompt: Upgrade to Enterprise for unlimited usage
- Overage pricing: Optional ($0.005 per 1K reconciliations)

**Enterprise Plan:**

- Unlimited usage: No limits
- Usage monitoring: Abuse prevention only

---

### Can I change plans?

**Answer:** Yes. You can upgrade or downgrade at any time.

**Upgrades:**

- Immediate: Access to higher limits
- Prorated billing: Pay difference for remaining period

**Downgrades:**

- End of period: Downgrade takes effect at end of billing period
- Usage limits: Reduced limits apply after downgrade

---

## Usage & Limits

### How is usage tracked?

**Answer:** Usage is tracked automatically:

- **Reconciliations:** Each reconciliation job counts toward limit
- **Receipt Parses:** Each receipt parse counts toward limit
- **Feature Flags:** Each evaluation counts toward limit

**Tracking:**

- Real-time: Usage tracked in real-time
- Dashboard: View usage in Developer Console
- Alerts: Email alerts when approaching limits

---

### What counts as a reconciliation?

**Answer:** A reconciliation is one reconciliation job that processes transactions:

- **Single Job:** One reconciliation job = one reconciliation
- **Transactions:** Job processes multiple transactions (counted separately)
- **API Calls:** Each API call to reconciliation endpoint counts

**Example:**

- Job processes 1,000 transactions = 1 reconciliation (not 1,000)

---

### What counts as a receipt parse?

**Answer:** A receipt parse is one receipt processed:

- **Single Receipt:** One receipt image/PDF = one parse
- **Bulk Upload:** Each receipt in bulk upload counts separately
- **API Calls:** Each API call to receipts endpoint counts

---

### What counts as a feature flag evaluation?

**Answer:** A feature flag evaluation is one flag check:

- **Single Check:** One flag check = one evaluation
- **API Calls:** Each API call to feature flags endpoint counts
- **SDK Calls:** Each SDK call counts

---

## Billing & Payments

### How do I pay?

**Answer:** Settler uses Stripe for payments:

- **Credit Card:** Visa, Mastercard, American Express
- **Automatic Billing:** Charged monthly on billing date
- **Invoice:** Available for Enterprise customers

---

### When am I charged?

**Answer:** Billing cycle:

- **Start Date:** Charged on signup date (or upgrade date)
- **Monthly:** Charged monthly on same date
- **Prorated:** Upgrades prorated for remaining period

**Example:**

- Sign up on January 15 → Charged on January 15, February 15, March 15, etc.

---

### Can I get an invoice?

**Answer:** Yes. Invoices available:

- **Starter/Professional:** Download from Stripe Customer Portal
- **Enterprise:** Custom invoices available (contact support)

---

### What payment methods are accepted?

**Answer:** Settler accepts:

- **Credit Cards:** Visa, Mastercard, American Express
- **Enterprise:** Wire transfer, ACH (contact sales)

---

## Upgrades & Downgrades

### How do I upgrade?

**Answer:** Upgrade process:

1. **Console:** Go to Settings → Billing → Upgrade
2. **Select Plan:** Choose Professional or Enterprise
3. **Confirm:** Confirm upgrade
4. **Immediate Access:** Access to higher limits immediately
5. **Prorated Billing:** Pay difference for remaining period

---

### How do I downgrade?

**Answer:** Downgrade process:

1. **Console:** Go to Settings → Billing → Downgrade
2. **Select Plan:** Choose lower plan
3. **Confirm:** Confirm downgrade
4. **End of Period:** Downgrade takes effect at end of billing period
5. **Usage Limits:** Reduced limits apply after downgrade

---

### What happens to my data when I downgrade?

**Answer:** Data retention:

- **Data Preserved:** All data preserved after downgrade
- **Access Limited:** Access limited by new plan limits
- **Export Available:** Export data before downgrade (recommended)

---

## Refunds & Cancellations

### Can I get a refund?

**Answer:** Refund policy:

- **Trial Period:** Full refund within 14 days of signup
- **After Trial:** No refunds (prorated cancellation available)
- **Enterprise:** Custom refund terms (contact sales)

---

### How do I cancel?

**Answer:** Cancellation process:

1. **Console:** Go to Settings → Billing → Cancel
2. **Confirm:** Confirm cancellation
3. **End of Period:** Access continues until end of billing period
4. **Data Export:** Export data before cancellation (recommended)

---

### What happens to my data when I cancel?

**Answer:** Data retention:

- **30 Days:** Data retained for 30 days after cancellation
- **Export Available:** Export data during retention period
- **Permanent Deletion:** Data permanently deleted after 30 days

---

## Enterprise & Custom Plans

### What's included in Enterprise plan?

**Answer:** Enterprise plan includes:

- **Unlimited Usage:** No usage limits
- **Dedicated Support:** SLA-backed support
- **Custom Integrations:** Custom integrations available
- **Custom Contracts:** MSA, DPA available
- **SLA Guarantees:** Uptime, response time guarantees

---

### How is Enterprise pricing determined?

**Answer:** Enterprise pricing based on:

- **Usage:** Expected usage volume
- **Support:** Support requirements
- **Integrations:** Custom integration needs
- **Contracts:** Contract requirements

**Contact:** enterprise@settler.io for custom pricing

---

## Related Documents

- `/docs/PRICING_LOGIC.md` - Detailed pricing logic
- `/docs/PILOT_PROGRAM.md` - Pilot program details
