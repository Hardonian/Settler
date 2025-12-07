# Settler: Reconciliation-as-a-Service

**Automate financial data reconciliation across platforms in 5 minutes**

---

## What is Settler?

Settler is an API-first platform that automates reconciliation—the process of matching records between different systems (like Shopify orders with Stripe payments, or QuickBooks invoices with PayPal transactions).

**Think "Resend for reconciliation"** — dead-simple onboarding, pure API, usage-based pricing.

---

## The Problem

Modern businesses operate across **10+ platforms**:

- E-commerce: Shopify, WooCommerce, BigCommerce
- Payments: Stripe, PayPal, Square
- Accounting: QuickBooks, Xero, NetSuite
- And more...

**Manual reconciliation is:**

- ❌ Time-consuming (10-15 hours/week)
- ❌ Error-prone (15-20% error rate)
- ❌ Doesn't scale
- ❌ No real-time visibility

**Result:** Revenue leakage, compliance risks, operational overhead.

---

## The Solution

### Settler automates reconciliation in 5 minutes:

```typescript
import Settler from "@settler/sdk";

const client = new Settler({ apiKey: "sk_your_key" });

// Create reconciliation job
const job = await client.jobs.create({
  source: { adapter: "shopify", config: {...} },
  target: { adapter: "stripe", config: {...} },
  rules: { matching: [...] }
});

// Run and get results
await client.jobs.run(job.id);
const report = await client.reports.get(job.id);
// Matched: 1,250 | Unmatched: 5 | Accuracy: 99.6%
```

**Benefits:**

- ✅ **5-minute integration** vs. weeks of custom code
- ✅ **99%+ accuracy** with ML-powered matching
- ✅ **Real-time webhooks** for instant alerts
- ✅ **Complete audit trail** for compliance
- ✅ **Composable adapters** for any platform

---

## Who It's For

### E-commerce Businesses

Reconcile orders with payment processors automatically

### SaaS Companies

Match subscription events across billing systems

### Finance Teams

Automate accounting reconciliation workflows

### Developers

Build financial data pipelines with a simple API

---

## Key Features

### 🚀 API-First Design

Everything accessible via REST API. Use from any language, any framework.

### 🔌 Pre-Built Adapters

Stripe, Shopify, QuickBooks, PayPal, Square, and more. Add custom adapters easily.

### ⚡ Real-Time Processing

Webhook-based reconciliation with instant notifications.

### 📊 Complete Visibility

Dashboard with real-time status, audit trails, and detailed reports.

### 🔒 Compliance Ready

GDPR, SOC 2 Type II ready out of the box. Complete audit trail.

### 🎯 Smart Matching

ML-powered matching with configurable rules and confidence scoring.

---

## Pricing

**Free Tier:**

- 1,000 reconciliations/month
- 2 adapters
- Community support

**Starter ($29/month):**

- 10,000 reconciliations/month
- 5 adapters
- Email support

**Growth ($99/month):**

- 100,000 reconciliations/month
- 15 adapters
- Priority support

**Scale ($299/month):**

- 1M reconciliations/month
- Unlimited adapters
- 4-hour SLA

**Enterprise:** Custom pricing for unlimited usage, dedicated infrastructure, and compliance certifications.

---

## Why Settler?

### vs. Manual Process

- **Time**: Minutes vs. hours
- **Accuracy**: 99%+ vs. 85-95%
- **Cost**: Usage-based vs. high labor costs

### vs. Legacy Solutions

- **Setup**: 5 minutes vs. days/weeks
- **API-First**: Yes vs. No
- **Real-Time**: Yes vs. Batch only
- **Developer DX**: Excellent vs. Poor

### vs. Custom Scripts

- **Maintenance**: Zero vs. Ongoing
- **Compliance**: Built-in vs. Manual
- **Scalability**: Automatic vs. Requires work

---

## Get Started

### 1. Sign Up

Visit [app.settler.io](https://app.settler.io) and create a free account.

### 2. Install SDK

```bash
npm install @settler/sdk
```

### 3. Create Job

Use the code example above to create your first reconciliation job.

### 4. Run & Monitor

Run reconciliation and monitor results in the dashboard or via API.

**That's it!** You're reconciling in minutes, not days.

---

## Resources

- **Documentation**: [docs.settler.io](https://docs.settler.io)
- **API Reference**: [docs.settler.io/api](https://docs.settler.io/api)
- **Support**: support@settler.io
- **Community**: [Discord](https://discord.gg/settler)
- **GitHub**: [github.com/settler/settler](https://github.com/settler/settler)

---

## Contact

**Sales**: sales@settler.io  
**Support**: support@settler.io  
**Partnerships**: partnerships@settler.io

**Made with ❤️ for developers who hate manual reconciliation.**
