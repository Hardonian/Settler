# Frequently Asked Questions

**Everything you need to know about Settler.**

---

## General

### What is Settler?

Settler is **Reconciliation-as-a-Service**—an API that automatically matches and reconciles transactions across Stripe, Shopify, QuickBooks, PayPal, Square, Xero, and more. Think "Resend for reconciliation"—simple onboarding, pure API, usage-based pricing.

### Who is Settler for?

**Developers** who want to automate reconciliation without building custom infrastructure.

**Finance teams** who spend hours daily on manual reconciliation.

**CTOs** who want to reduce operational overhead and focus engineering time on core product.

**E-commerce businesses** processing payments across multiple platforms.

**SaaS companies** syncing payment data with accounting systems.

### How is Settler different from QuickBooks/Xero reconciliation?

QuickBooks and Xero have **manual** reconciliation features. Settler provides **automated reconciliation** via API:

- ✅ Event-driven webhook reconciliation (with flexible scheduling)
- ✅ Multi-platform reconciliation (not just accounting systems)
- ✅ Programmatic access (integrate into your workflows)
- ✅ Smart matching rules (exact, fuzzy, range matching)
- ✅ Developer-friendly (TypeScript SDK, full API)

### Do I need to be a developer to use Settler?

**For production use:** Yes, you'll need a developer to integrate the SDK (takes ~15-30 minutes for first job).

**For testing:** No! Try our [Playground](https://settler.io/playground) to test integrations visually without code.

---

## Getting Started

### How long does it take to set up?

**First reconciliation job:** ~15-30 minutes

1. Install SDK (`npm install @settler/sdk`)
2. Get API key (from dashboard)
3. Configure adapter connections
4. Create job with matching rules
5. Test and verify

**Full production setup:** 1-2 hours

- Set up all platform connections
- Configure matching rules
- Set up webhooks
- Train finance team

### What do I need to get started?

- Node.js 18+ (or Bun)
- API keys from your platforms (Stripe, Shopify, etc.)
- A Settler account ([sign up free](https://settler.io/signup))

### Can I try Settler before committing?

**Yes!** Free tier includes 1,000 reconciliations/month—perfect for testing.

- ✅ No credit card required
- ✅ Full API access
- ✅ All features included
- ✅ No time limit

[Get Started Free →](https://settler.io/signup)

### Do you have a sandbox/test environment?

**Yes!** Use our Playground to test integrations without code:

[Try Playground →](https://settler.io/playground)

For API testing, use test API keys from your platforms (Stripe test mode, Shopify dev store, etc.).

---

## Technical

### What programming languages do you support?

**TypeScript/JavaScript** (Node.js, Bun) — Full SDK support

**Python** — SDK coming Q2 2026

**Ruby** — SDK coming Q2 2026

**Go** — SDK coming Q3 2026

**REST API** — Works with any language

### How does reconciliation work?

1. **Fetch data** from source platform (e.g., Shopify orders)
2. **Fetch data** from target platform (e.g., Stripe payments)
3. **Normalize** data to common format
4. **Match** transactions using rules (order ID, amount, date, etc.)
5. **Generate report** with matched/unmatched transactions
6. **Alert** on mismatches (via webhook or email)

### What matching rules are available?

- **Exact match** — Field values must match exactly
- **Fuzzy match** — Similarity-based matching (e.g., customer names)
- **Range match** — Date/amount within tolerance
- **Custom function** — JavaScript-based custom logic

[View matching rules docs →](https://docs.settler.io/matching-rules)

### How do webhooks work?

Settler receives webhooks from your platforms (Stripe, Shopify, etc.) and automatically triggers reconciliation when new events arrive.

You can also receive webhooks from Settler when reconciliation completes or mismatches occur.

[View webhook docs →](https://docs.settler.io/webhooks)

### What happens if reconciliation fails?

**Automatic retries:** Exponential backoff (3 attempts)

**Error handling:** Failed transactions logged with error details

**Alerts:** Webhook/email notification on persistent failures

**Dead letter queue:** Failed transactions queued for manual review

### How accurate is reconciliation?

**Typical accuracy:** 95-99% (depends on data quality and matching rules)

**Improving accuracy:**

- Fine-tune matching rules
- Use fuzzy matching for edge cases
- Add custom matching logic
- Review unmatched transactions regularly

### Can I customize reconciliation logic?

**Yes!** Custom JavaScript functions for matching:

```typescript
rules: {
  matching: [
    {
      field: "custom",
      type: "function",
      fn: "(source, target) => source.metadata.orderId === target.metadata.ref",
    },
  ],
}
```

[View custom rules docs →](https://docs.settler.io/matching-rules#custom-functions)

---

## Platforms & Adapters

### Which platforms do you support?

**Currently Available (7+ adapters):**
- **Payment Processors:** Stripe, PayPal, Square
- **E-commerce:** Shopify
- **Accounting:** QuickBooks, Xero

**Coming Soon:** Adyen, Braintree, WooCommerce, BigCommerce, Magento, NetSuite, Sage

See [full list →](https://docs.settler.io/adapters)

### Can I add a platform that's not supported?

**Yes!** Two options:

1. **Request an adapter** — We'll build it (usually 2-4 weeks)
   [Request adapter →](https://settler.io/adapters/request)

2. **Build your own** — Use our adapter SDK (open source)
   [Adapter SDK docs →](https://docs.settler.io/adapters/custom)

### How do I connect my platforms?

**API Keys:** Most platforms use API keys (Stripe, Shopify, etc.)

**OAuth:** Some platforms use OAuth (QuickBooks, Xero)

**CSV Upload:** Some platforms support CSV import (coming soon)

[View adapter setup docs →](https://docs.settler.io/adapters)

### Are my API keys secure?

**Yes!** We encrypt all API keys at rest (AES-256) and never log them. Keys are stored in encrypted vaults and only accessed when needed for reconciliation.

[View security docs →](https://settler.io/security)

---

## Pricing & Billing

### How much does Settler cost?

**Free:** 1,000 reconciliations/month — $0

**Starter:** 10,000 reconciliations/month — $29/month

**Growth:** 100,000 reconciliations/month — $99/month

**Scale:** 1,000,000 reconciliations/month — $299/month

**Enterprise:** Unlimited — Custom pricing

[View full pricing →](https://settler.io/pricing)

### What counts as a reconciliation?

**One reconciliation** = matching one source transaction with one target transaction.

**Example:**

- 100 Shopify orders matched with 100 Stripe payments = **100 reconciliations**
- 100 Shopify orders, 95 matched, 5 unmatched = **100 reconciliations** (matched + unmatched)

### What happens if I exceed my plan limit?

**Automatic overage billing:** $0.01 per reconciliation beyond your plan limit.

**No service interruption:** Reconciliation continues automatically.

**Example:**

- Starter plan: 10,000/month included
- Actual usage: 12,000
- Overage: 2,000 × $0.01 = $20
- **Total:** $29 + $20 = $49/month

### Can I upgrade/downgrade anytime?

**Upgrades:** Immediate (pro-rated billing)

**Downgrades:** Take effect at end of billing cycle

### Do you offer annual billing?

**Yes!** Save 17% with annual billing (equivalent to 2 months free).

### Do you offer discounts for startups/non-profits?

**Yes!** Contact [sales@settler.io](mailto:sales@settler.io) for startup/non-profit discounts.

---

## Security & Compliance

### Is Settler secure?

**Yes!** We take security seriously:

- ✅ **Encryption:** AES-256 at rest, TLS 1.3 in transit
- ✅ **API Keys:** Encrypted storage, never logged
- ✅ **Access Control:** Role-based access control (RBAC)
- ✅ **Audit Logs:** Immutable logs, 7-year retention
- ✅ **SOC 2 Type II:** In progress (certification Q2 2026)
- ✅ **GDPR Compliant:** Data export/deletion APIs
- ✅ **PCI-DSS Ready:** We never store card data

[View security page →](https://settler.io/security)

### Do you store my financial data?

**Yes, temporarily.** We store transaction data needed for reconciliation:

- **What we store:** Transaction IDs, amounts, dates, metadata
- **What we don't store:** Credit card numbers, bank account numbers, passwords
- **Retention:** Configurable (7 days to 7 years)
- **Deletion:** GDPR-compliant deletion API available

### Are you SOC 2 certified?

**SOC 2 Type II audit in progress** — Certification expected Q2 2026.

We follow SOC 2 controls today and will be fully certified soon.

### Are you GDPR compliant?

**Yes!** GDPR-compliant features:

- ✅ Data export API (`GET /api/v1/users/{id}/data-export`)
- ✅ Data deletion API (`DELETE /api/v1/users/{id}/data`)
- ✅ Data processing agreement (DPA) available
- ✅ Privacy policy and cookie consent

[Request DPA →](https://settler.io/legal/dpa)

### Are you PCI-DSS compliant?

**We never store card data**, so PCI-DSS scope is minimal. If you send card data via webhooks, we pass it through without storage.

**PCI-DSS Level 1 certification:** Available for Enterprise customers (Q3 2026).

---

## Support

### What support do you offer?

**Free Tier:** Community support (Discord, GitHub)

**Starter:** Email support (24-hour response)

**Growth:** Priority email support (4-hour response)

**Scale:** Priority support (1-hour SLA)

**Enterprise:** Dedicated account manager (1-hour SLA)

### Where can I get help?

- **Discord Community** → [discord.gg/settler](https://discord.gg/settler)
- **GitHub Issues** → [github.com/settler/settler](https://github.com/settler/settler)
- **Email Support** → [support@settler.io](mailto:support@settler.io)
- **Documentation** → [docs.settler.io](https://docs.settler.io)

### Do you offer training?

**Yes!** We offer:

- **Documentation** — Complete guides and tutorials
- **Video Tutorials** — [YouTube channel](https://youtube.com/@settler)
- **Office Hours** — Weekly community calls (Discord)
- **Enterprise Training** — Custom training for Enterprise customers

---

## Enterprise

### What's included in Enterprise?

- ✅ Unlimited reconciliations
- ✅ Dedicated support (SLA)
- ✅ Custom SLAs
- ✅ Dedicated account manager
- ✅ Custom adapters
- ✅ Extended log retention (up to 7 years)
- ✅ Priority feature requests

**Coming Soon:**
- SSO (SAML, OIDC) - Q2 2026
- SOC 2 Type II certification - Q2 2026
- PCI-DSS Level 1 - Q3 2026
- White-label reports - Q2 2026

[Contact Enterprise Sales →](https://settler.io/contact/enterprise)

### How do I get Enterprise pricing?

Contact [sales@settler.io](mailto:sales@settler.io) or [schedule a call](https://settler.io/contact/enterprise).

We'll work with you to create a custom plan based on your volume and requirements.

---

## Still Have Questions?

- **Email:** [support@settler.io](mailto:support@settler.io)
- **Discord:** [discord.gg/settler](https://discord.gg/settler)
- **Docs:** [docs.settler.io](https://docs.settler.io)

**Ready to get started?** [Sign Up Free →](https://settler.io/signup)
