# @settler/sdk

**Reconciliation-as-a-Service API** — Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems.

> Think "Resend for reconciliation"—dead-simple onboarding, pure API, usage-based pricing, and composable adapters for every platform.

[![npm version](https://img.shields.io/npm/v/@settler/sdk.svg)](https://www.npmjs.com/package/@settler/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Installation

```bash
npm install @settler/sdk
```

### 5-Minute Integration

```typescript
import Settler from "@settler/sdk";

// Initialize the client
const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY, // Get yours at settler.io/dashboard
});

// Create your first reconciliation job
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
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM UTC
});

console.log(`Job created: ${job.data.id}`);
```

### Get Reconciliation Results

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

// Get unmatched transactions for review
const unmatched = await settler.reports.getUnmatched(job.data.id);
console.log(unmatched.data);
```

### Real-Time Webhook Reconciliation

```typescript
// Settler automatically receives webhooks from your platforms
// Configure webhook endpoints in your dashboard or via API

const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.mismatch"],
  secret: process.env.WEBHOOK_SECRET,
});

// Handle webhook events in your app
app.post("/webhooks/settler", async (req, res) => {
  const signature = req.headers["settler-signature"];
  const isValid = settler.webhooks.verify(req.body, signature, webhook.secret);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  if (event === "reconciliation.mismatch") {
    // Alert your finance team
    await notifyFinanceTeam({
      orderId: data.order_id,
      expected: data.expected_amount,
      actual: data.actual_amount,
    });
  }

  res.json({ received: true });
});
```

## ✨ Features

- **🔌 15+ Built-in Adapters**: Stripe, Shopify, QuickBooks, PayPal, Square, NetSuite, Xero, and more
- **⚡ Real-Time Processing**: Webhook-driven reconciliation as events happen
- **🎯 Smart Matching**: Exact, fuzzy, and custom matching rules
- **🔄 Automatic Retries**: Built-in exponential backoff and error handling
- **📊 Rich Reports**: JSON, CSV, and PDF exports with detailed insights
- **🔐 Enterprise Security**: SOC 2 Type II, GDPR, PCI-DSS ready
- **📈 Scales Automatically**: Handle millions of transactions without infrastructure management
- **🛠️ TypeScript First**: Full type safety and IntelliSense support

## 📚 Documentation

- **[Full API Reference](https://docs.settler.io/api)** — Complete endpoint documentation
- **[Adapter Guide](https://docs.settler.io/adapters)** — Connect any platform
- **[Integration Recipes](https://docs.settler.io/recipes)** — Common use cases and patterns
- **[Troubleshooting](https://docs.settler.io/troubleshooting)** — Solutions to common issues

## 🎯 Common Use Cases

### E-commerce Order Reconciliation

Reconcile Shopify orders with Stripe payments automatically:

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

### Multi-Platform Payment Reconciliation

Reconcile payments across Stripe, PayPal, and Square:

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
      { field: "customer_email", type: "exact" },
    ],
  },
});
```

### Accounting System Sync

Keep QuickBooks in sync with your payment processors:

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
    conflictResolution: "manual-review", // Flag mismatches for review
  },
});
```

## 🎨 Advanced Features

### Custom Matching Rules

```typescript
rules: {
  matching: [
    // Exact match on order ID
    { field: "order_id", type: "exact" },

    // Amount match with tolerance
    { field: "amount", type: "exact", tolerance: 0.01 },

    // Date range matching (within 1 day)
    { field: "date", type: "range", days: 1 },

    // Fuzzy matching on customer email
    { field: "customer_email", type: "fuzzy", threshold: 0.9 },

    // Custom JavaScript function
    {
      field: "custom",
      type: "function",
      fn: "(source, target) => source.metadata.orderId === target.metadata.ref",
    },
  ],
}
```

### Scheduled Reconciliation

```typescript
// Run daily at 2 AM UTC
schedule: "0 2 * * *";

// Run every 6 hours
schedule: "0 */6 * * *";

// Run on the 1st of every month
schedule: "0 0 1 * *";
```

### Multi-Currency Support

```typescript
rules: {
  matching: [
    { field: "amount", type: "exact", tolerance: 0.01 },
    { field: "currency", type: "exact" },
  ],
  currencyConversion: {
    enabled: true,
    baseCurrency: "USD",
    ratesProvider: "settler", // or "custom" with your own rates
  },
}
```

## 🔐 Authentication

Get your API key from the [Settler Dashboard](https://settler.io/dashboard):

1. Sign up for a free account
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy and store it securely (never commit to git!)

```typescript
// Recommended: Use environment variables
const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Or pass directly (not recommended for production)
const settler = new Settler({
  apiKey: "sk_live_...",
});
```

## 💰 Pricing

- **Free Tier**: 1,000 reconciliations/month — Perfect for testing
- **Starter**: $29/month — 10,000 reconciliations
- **Growth**: $99/month — 100,000 reconciliations
- **Scale**: $299/month — 1,000,000 reconciliations
- **Enterprise**: Custom pricing — Unlimited usage

[View full pricing →](https://settler.io/pricing)

## 🛠️ Requirements

- Node.js 18+ or Bun
- TypeScript 5.0+ (recommended)
- An API key from [settler.io](https://settler.io)

## 📦 Package Exports

```typescript
// ESM
import Settler from "@settler/sdk";

// CommonJS
const Settler = require("@settler/sdk");

// TypeScript types included
import type { Job, Report, Webhook } from "@settler/sdk";
```

## 🤝 Support

- **Documentation**: [docs.settler.io](https://docs.settler.io)
- **Discord Community**: [discord.gg/settler](https://discord.gg/settler)
- **GitHub Issues**: [github.com/settler/settler](https://github.com/settler/settler)
- **Email Support**: support@settler.io

## 📄 License

MIT © [Settler](https://settler.io)

## 🙏 Contributing

We love contributions! See our [Contributing Guide](https://github.com/settler/settler/blob/main/docs/contributing.md) for details.

---

**Made with ❤️ for developers who hate manual reconciliation.**

[Get Started Free →](https://settler.io/signup) | [View Docs →](https://docs.settler.io) | [Join Discord →](https://discord.gg/settler)
