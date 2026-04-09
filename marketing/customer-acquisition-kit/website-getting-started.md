# Getting Started with Settler

**Automate financial reconciliation across all your platforms in 5 minutes.**

---

## What is Settler?

Settler is **Reconciliation-as-a-Service**—an API that automatically matches and reconciles transactions across Stripe, Shopify, QuickBooks, PayPal, and 15+ other platforms. Think "Resend for reconciliation"—dead-simple onboarding, pure API, usage-based pricing.

**The Problem:** Modern businesses operate across 10+ platforms. Data inconsistencies cause revenue leakage, compliance risks, and hours of manual work.

**The Solution:** Settler normalizes, validates, and reconciles data across all sources in real-time—with instant alerts, audit trails, and compliance built-in.

---

## Quick Start (5 Minutes)

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

### Step 4: Start Continuous Reconciliation

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Start continuous reconciliation - it runs automatically
const reconciliation = await settler.reconciliations.create({
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
  // Matching happens automatically - no configuration needed
  // System explains any mismatches automatically
});

console.log(`Reconciliation started: ${reconciliation.data.id}`);
// Reconciliation runs continuously - no manual intervention needed
```

### Step 5: Review Exceptions (If Any)

```typescript
// Reconciliation runs automatically
// Only review exceptions when system surfaces them
const exceptions = await settler.reconciliations.exceptions(reconciliation.data.id);

if (exceptions.data.length > 0) {
  // System automatically explains why each exception occurred
  exceptions.data.forEach((exception) => {
    console.log(`${exception.reason}: ${exception.details}`);
    // Each exception includes automatic explanation and suggested action
  });
} else {
  console.log("All transactions matched automatically - no action needed");
}
```

**That's it!** Reconciliation runs continuously. You only need to review exceptions when the system surfaces them with automatic explanations.

---

## Try It Without Code

**New to APIs?** Try our [Playground](https://settler.io/playground) to test integrations visually:

1. Select your source platform (e.g., Shopify)
2. Select your target platform (e.g., Stripe)
3. Reconciliation runs automatically
4. View results instantly
5. System explains any mismatches automatically

[Launch Playground →](https://settler.io/playground)

---

## Common Use Cases

### E-commerce Order Reconciliation

**Problem:** Shopify orders don't match Stripe payments. Manual reconciliation is structurally broken.

**Solution:** Continuous automatic reconciliation. System matches automatically and explains any mismatches.

```typescript
const reconciliation = await settler.reconciliations.create({
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
  // Matching happens automatically - no rules needed
  // System explains mismatches automatically
});
```

[View full example →](https://docs.settler.io/recipes/ecommerce)

### Multi-Platform Payment Reconciliation

**Problem:** Payments come from Stripe, PayPal, and Square. Manual reconciliation is structurally broken.

**Solution:** Continuous automatic reconciliation across all sources. System handles matching automatically.

```typescript
const reconciliation = await settler.reconciliations.create({
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
  // Matching happens automatically across all sources
  // System explains mismatches automatically
});
```

[View full example →](https://docs.settler.io/recipes/multi-platform)

### Accounting System Sync

**Problem:** QuickBooks is out of sync with payment processors. Manual sync is structurally broken.

**Solution:** Continuous automatic sync. System reconciles continuously and explains exceptions.

```typescript
const reconciliation = await settler.reconciliations.create({
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
  // Sync happens continuously - no schedule needed
  // System explains mismatches automatically
  // Exceptions are explicit, auditable, and bounded
});
```

[View full example →](https://docs.settler.io/recipes/accounting)

---

## Supported Platforms

### Payment Processors

- ✅ Stripe
- ✅ PayPal
- ✅ Square
- ✅ Adyen
- ✅ Braintree

### E-commerce Platforms

- ✅ Shopify
- ✅ WooCommerce
- ✅ BigCommerce
- ✅ Magento

### Accounting Systems

- ✅ QuickBooks
- ✅ Xero
- ✅ NetSuite
- ✅ Sage

### More Integrations

We're adding new adapters regularly. [Request an adapter →](https://settler.io/adapters/request)

---

## Features

### 🔌 15+ Built-in Adapters

Connect to Stripe, Shopify, QuickBooks, PayPal, and more with one line of code.

### ⚡ Real-Time Processing

Webhook-driven reconciliation as events happen—no polling required.

### 🎯 Automatic Matching

Matching happens automatically. System handles edge cases and explains mismatches.

### 🔄 Automatic Retries

Built-in exponential backoff and error handling. Never lose a transaction.

### 📊 Rich Reports

JSON, CSV, and PDF exports with detailed insights and audit trails.

### 🔐 Enterprise Security

SOC 2 Type II ready, GDPR compliant, PCI-DSS ready. Compliance built-in.

### 📈 Scales Automatically

Handle millions of transactions without infrastructure management.

### 🛠️ TypeScript First

Full type safety and IntelliSense support. Works with your existing stack.

---

## Pricing

**Free Forever:** 1,000 reconciliations/month — Great for testing

**Starter:** $29/month — 10,000 reconciliations — Small businesses

**Growth:** $99/month — 100,000 reconciliations — Growing companies

**Scale:** $299/month — 1,000,000 reconciliations — High-volume operations

**Enterprise:** Custom — Unlimited usage, dedicated infrastructure, custom SLAs

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
