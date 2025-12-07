# Getting Started with Settler

**Automate financial reconciliation across your platforms. Quick setup in under 30 minutes.**

---

## What is Settler?

Settler is **Reconciliation-as-a-Service**—an API that automatically matches and reconciles transactions across Stripe, Shopify, QuickBooks, PayPal, Square, Xero, and more. Think "Resend for reconciliation"—simple onboarding, pure API, usage-based pricing.

**The Problem:** Modern businesses operate across 10+ platforms. Data inconsistencies cause revenue leakage, compliance risks, and hours of manual work.

**The Solution:** Settler normalizes, validates, and reconciles data across all sources with event-driven processing—with alerts, audit trails, and compliance features built-in.

---

## Quick Start (15-30 Minutes)

### Step 1: Sign Up

[Create your free account →](https://settler.io/signup)

No credit card required. Get 1,000 reconciliations/month free forever.

### Step 2: Install the SDK

```bash
npm install @settler/sdk
```

### Step 3: Get Your API Key

1. Go to [Dashboard → API Keys](https://settler.io/dashboard/api-keys)
2. Click "Create API Key"
3. Copy your key (starts with `sk_`)

**⚠️ Keep your API key secret.** Never commit it to git. Use environment variables.

### Step 4: Create Your First Reconciliation Job

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create a reconciliation job
const job = await settler.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM UTC
});

console.log(`Job created: ${job.data.id}`);
```

### Step 5: Get Results

```typescript
// Fetch reconciliation report
const report = await settler.reports.get(job.data.id, {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

console.log(report.data.summary);
// {
//   matched: 145,
//   unmatched: 3,
//   errors: 1,
//   accuracy: 98.7,
//   totalTransactions: 149
// }
```

**That's it!** Your reconciliation is now running automatically.

---

## Try It Without Code

**New to APIs?** Try our [Playground](https://settler.io/playground) to test integrations visually:

1. Select your source platform (e.g., Shopify)
2. Select your target platform (e.g., Stripe)
3. Configure matching rules
4. Run a test reconciliation
5. View results instantly

[Launch Playground →](https://settler.io/playground)

---

## Common Use Cases

### E-commerce Order Reconciliation

**Problem:** Shopify orders don't match Stripe payments. Manual reconciliation takes hours.

**Solution:** Automate matching by order ID and amount. Get alerts on mismatches.

```typescript
const job = await settler.jobs.create({
  name: "Order Payment Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      /* ... */
    },
  },
  target: {
    adapter: "stripe",
    config: {
      /* ... */
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

[View full example →](https://docs.settler.io/recipes/ecommerce)

### Multi-Platform Payment Reconciliation

**Problem:** Payments come from Stripe, PayPal, and Square. Need unified reconciliation.

**Solution:** Reconcile all payment sources against QuickBooks automatically.

```typescript
const job = await settler.jobs.create({
  name: "Multi-Payment Reconciliation",
  sources: [
    {
      adapter: "stripe",
      config: {
        /* ... */
      },
    },
    {
      adapter: "paypal",
      config: {
        /* ... */
      },
    },
    {
      adapter: "square",
      config: {
        /* ... */
      },
    },
  ],
  target: {
    adapter: "quickbooks",
    config: {
      /* ... */
    },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "fuzzy", threshold: 0.8 },
      { field: "amount", type: "exact" },
    ],
  },
});
```

[View full example →](https://docs.settler.io/recipes/multi-platform)

### Accounting System Sync

**Problem:** QuickBooks is out of sync with payment processors. Manual sync is error-prone.

**Solution:** Automated daily sync with exception handling.

```typescript
const job = await settler.jobs.create({
  name: "Payment to Accounting Sync",
  source: {
    adapter: "stripe",
    config: {
      /* ... */
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      /* ... */
    },
  },
  rules: {
    matching: [
      { field: "invoice_id", type: "exact" },
      { field: "amount", type: "exact" },
      { field: "date", type: "range", days: 2 },
    ],
    conflictResolution: "manual-review",
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

[View full example →](https://docs.settler.io/recipes/accounting)

---

## Supported Platforms

### Currently Available

**Payment Processors:**
- ✅ Stripe
- ✅ PayPal
- ✅ Square

**E-commerce Platforms:**
- ✅ Shopify

**Accounting Systems:**
- ✅ QuickBooks
- ✅ Xero

### Coming Soon

We're adding new adapters regularly. Coming soon: Adyen, Braintree, WooCommerce, BigCommerce, Magento, NetSuite, Sage.

[Request an adapter →](https://settler.io/adapters/request)

---

## Features

### 🔌 15+ Built-in Adapters

Connect to Stripe, Shopify, QuickBooks, PayPal, and more with one line of code.

### ⚡ Event-Driven Processing

Webhook-driven reconciliation with flexible scheduling—no manual polling required.

### 🎯 Smart Matching

Exact, fuzzy, and custom matching rules. Handle edge cases automatically.

### 🔄 Automatic Retries

Built-in exponential backoff and error handling. Never lose a transaction.

### 📊 Rich Reports

JSON, CSV, and PDF exports with detailed insights and audit trails.

### 🔐 Enterprise Security

AES-256 encryption, GDPR compliant, secure API key storage. SOC 2 Type II certification in progress (Q2 2026).

### 📈 Scales Automatically

Handle millions of transactions without infrastructure management.

### 🛠️ TypeScript First

Full type safety and IntelliSense support. Works with your existing stack.

---

## Pricing

**Free Forever:** 1,000 reconciliations/month — Perfect for testing

**Commercial:** $99/month — 100,000 reconciliations — Growing companies

**Enterprise:** Custom — Unlimited usage, dedicated support, custom SLAs

[View full pricing →](https://settler.io/pricing)

---

## Next Steps

1. **Read the Docs** → [docs.settler.io](https://docs.settler.io)
2. **Try the Playground** → [settler.io/playground](https://settler.io/playground)
3. **Join Discord** → [discord.gg/settler](https://discord.gg/settler)
4. **Watch Tutorial** → [youtube.com/@settler](https://youtube.com/@settler)

---

## Need Help?

- **Quick Questions?** → [Discord Community](https://discord.gg/settler)
- **Integration Issues?** → [Troubleshooting Guide](https://docs.settler.io/troubleshooting)
- **Something Broken?** → [support@settler.io](mailto:support@settler.io)
- **Enterprise Sales?** → [Schedule a Call](https://settler.io/contact/enterprise)

---

**Ready to automate reconciliation?** [Get Started Free →](https://settler.io/signup)
