# Pricing — Canonical Reference

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This document is the **master pricing reference** for Settler. All pricing decisions flow from this document.

---

## Pricing Philosophy

**Stripe-Style Transparency**: Simple, usage-based pricing with a generous free tier. No hidden fees. Upgrade when you need to scale.

**Key Principles:**

1. **Value alignment** — Price based on value delivered, not cost
2. **Low friction** — Easy to start, clear upgrade path
3. **Volume efficiency** — Lower cost per unit at higher tiers
4. **Enterprise capture** — Custom pricing for large customers

---

## Pricing Tiers

### Free Tier 🆓

**Perfect for:** Testing, small projects, developers learning the platform

| Feature         | Limit                       |
| --------------- | --------------------------- |
| Reconciliations | 1,000/month                 |
| Adapters        | 2                           |
| Log Retention   | 7 days                      |
| Support         | Community (Discord, GitHub) |
| API Rate Limit  | 100 requests/15 min         |
| Webhooks        | ✅ Included                 |
| Reports         | JSON only                   |

**Price:** $0/month

### Starter 💼

**Perfect for:** Small e-commerce stores, early-stage SaaS

| Feature         | Limit                    |
| --------------- | ------------------------ |
| Reconciliations | 10,000/month             |
| Adapters        | 5                        |
| Log Retention   | 30 days                  |
| Support         | Email (24-hour response) |
| API Rate Limit  | 500 requests/15 min      |
| Webhooks        | ✅ Included              |
| Reports         | JSON + CSV export        |
| Scheduled Jobs  | ✅ Included              |

**Price:** $29/month  
**Annual Billing:** $290/year (save $58, ~17% discount)

### Growth 🚀

**Perfect for:** Mid-market SaaS, growing e-commerce

| Feature                 | Limit                            |
| ----------------------- | -------------------------------- |
| Reconciliations         | 100,000/month                    |
| Adapters                | 15                               |
| Log Retention           | 90 days                          |
| Support                 | Priority email (4-hour response) |
| API Rate Limit          | 2,000 requests/15 min            |
| Webhooks                | ✅ Included                      |
| Reports                 | JSON + CSV + PDF export          |
| Scheduled Jobs          | ✅ Included                      |
| Advanced Matching Rules | ✅ Included                      |
| Multi-Currency          | ✅ Included                      |
| Custom Webhooks         | ✅ Included                      |

**Price:** $99/month  
**Annual Billing:** $990/year (save $198, ~17% discount)

### Scale 📈

**Perfect for:** Large e-commerce, enterprise SaaS

| Feature                  | Limit                         |
| ------------------------ | ----------------------------- |
| Reconciliations          | 1,000,000/month               |
| Adapters                 | Unlimited                     |
| Log Retention            | 1 year                        |
| Support                  | Priority support (1-hour SLA) |
| API Rate Limit           | 10,000 requests/15 min        |
| Webhooks                 | ✅ Included                   |
| Reports                  | All formats + White-label     |
| Scheduled Jobs           | ✅ Included                   |
| Advanced Matching Rules  | ✅ Included                   |
| Multi-Currency           | ✅ Included                   |
| Custom Webhooks          | ✅ Included                   |
| Multi-Entity Support     | ✅ Included                   |
| Dedicated Infrastructure | ✅ Included                   |
| Custom Adapters          | ✅ Included (1 free)          |

**Price:** $299/month  
**Annual Billing:** $2,990/year (save $598, ~17% discount)

### Enterprise 🏢

**Perfect for:** Large enterprises, regulated industries

| Feature           | Limit                                  |
| ----------------- | -------------------------------------- |
| Reconciliations   | Unlimited                              |
| Adapters          | Unlimited                              |
| Log Retention     | Custom (up to 7 years)                 |
| Support           | Dedicated account manager (1-hour SLA) |
| API Rate Limit    | Custom                                 |
| Webhooks          | ✅ Included                            |
| Reports           | All formats + White-label + Custom     |
| SSO (SAML, OIDC)  | ✅ Included                            |
| SOC 2 Type II     | ✅ Included                            |
| PCI-DSS Level 1   | ✅ Included                            |
| HIPAA-Ready       | ✅ Included (on-demand)                |
| Custom SLAs       | ✅ Included (99.99% uptime)            |
| VPC Peering       | ✅ Included                            |
| Private Endpoints | ✅ Included                            |

**Price:** Custom (typically $1,000-$10,000+/month)  
**Annual Billing:** Custom contracts

---

## Overage Pricing

**Beyond Plan Limits:** $0.01 per reconciliation

**Example:**

- Starter plan: 10,000 reconciliations/month
- Actual usage: 12,000 reconciliations
- **Overage:** 2,000 × $0.01 = $20
- **Total:** $29 + $20 = $49/month

**Automatic Billing:** Overage charges are automatically added to monthly bill.

---

## Add-Ons

### Additional Log Retention

- **$10/month** per additional 90 days
- Maximum: 7 years (for compliance)

### Dedicated IP Address

- **$50/month**
- For enterprise customers with IP allowlisting requirements

### Custom Adapters

- **$500 one-time** setup fee
- **$50/month** maintenance fee
- For platforms not in our adapter library

---

## Pricing Comparison

| Tier       | Price/Month | Reconciliations | Cost per 1K |
| ---------- | ----------- | --------------- | ----------- |
| Free       | $0          | 1,000           | $0          |
| Starter    | $29         | 10,000          | $2.90       |
| Growth     | $99         | 100,000         | $0.99       |
| Scale      | $299        | 1,000,000       | $0.30       |
| Enterprise | Custom      | Unlimited       | Custom      |

**Volume Discount:** The more you use, the less you pay per reconciliation.

---

## Enterprise Pricing Negotiation Guidelines

### Starting Points

| Scenario           | Starting Price | Target Discount |
| ------------------ | -------------- | --------------- |
| 1-year term        | $8,000/year    | 20% from list   |
| 2-year term        | $14,000/2yr    | 13% annual      |
| Multi-entity (3+)  | Custom         | Case-by-case    |
| High volume (10M+) | Custom         | >30% off list   |

### Non-Negotiable

- SSO included (Enterprise only)
- SOC 2 compliance
- 99.99% uptime SLA
- Dedicated support

### Negotiable

- Contract length
- Payment terms (net-30 vs net-60)
- Training included
- Custom development hours

---

## Implementation

### Stripe Configuration

See `monetization/BILLING_OPS.md` for Stripe setup.

### Pricing Changes

- Notice: 30 days for existing customers
- New customers: Immediately effective
- Annual customers: Honor original terms until renewal

---

## Related Documents

| Document                                 | Purpose                         |
| ---------------------------------------- | ------------------------------- |
| `PRICING_POLICY_MEMO.md`                 | Pricing decisions and rationale |
| `../monetization/REVENUE_MODEL.md`       | Revenue structure               |
| `../legal-commercial/TERMS_REFERENCE.md` | ToS summary                     |
| `../runbooks/FIRST_SALE_RUNBOOK.md`      | Sales process                   |
