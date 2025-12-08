# Settler Code Examples

**Collection of code examples for common Settler use cases**

This repository contains practical, copy-paste-ready examples for integrating Settler into your application.

---

## Quick Start

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
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
    ],
  },
});

console.log("Job created:", job.data.id);
```

---

## Examples

### 1. E-commerce Order Reconciliation

**Use Case:** Reconcile Shopify orders with Stripe payments

**File:** `examples/ecommerce-shopify-stripe.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create job
const job = await settler.jobs.create({
  name: "Daily Order Reconciliation",
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
  schedule: "0 2 * * *", // Daily at 2 AM
});

// Run reconciliation
const execution = await settler.jobs.run(job.data.id);

// Get results
const report = await settler.reports.get(job.data.id);
console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

### 2. SaaS Subscription Reconciliation

**Use Case:** Reconcile Stripe subscriptions with QuickBooks revenue

**File:** `examples/saas-stripe-quickbooks.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Monthly Subscription Reconciliation",
  source: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      realmId: process.env.QB_REALM_ID,
    },
  },
  rules: {
    matching: [
      { field: "subscription_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "customer_email", type: "exact" },
    ],
  },
  schedule: "0 0 1 * *", // First day of month at midnight
});
```

### 3. Multi-Payment Provider Reconciliation

**Use Case:** Reconcile payments from Stripe, PayPal, and Square

**File:** `examples/multi-provider.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create multiple jobs for each provider
const stripeJob = await settler.jobs.create({
  name: "Stripe Reconciliation",
  source: { adapter: "stripe", config: { apiKey: process.env.STRIPE_SECRET_KEY } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
});

const paypalJob = await settler.jobs.create({
  name: "PayPal Reconciliation",
  source: { adapter: "paypal", config: { clientId: process.env.PAYPAL_CLIENT_ID, clientSecret: process.env.PAYPAL_SECRET } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
});

// Run all reconciliations
await Promise.all([
  settler.jobs.run(stripeJob.data.id),
  settler.jobs.run(paypalJob.data.id),
]);
```

### 4. Real-Time Webhook Reconciliation

**Use Case:** Reconcile as events happen via webhooks

**File:** `examples/realtime-webhooks.ts`

```typescript
import Settler from "@settler/sdk";
import express from "express";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const app = express();
app.use(express.json());

// Create job
const job = await settler.jobs.create({
  name: "Real-Time Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
});

// Set up webhook
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: [
    "reconciliation.matched",
    "reconciliation.mismatch",
    "reconciliation.error",
  ],
});

// Handle webhook events
app.post("/webhooks/settler", async (req, res) => {
  const { event, data } = req.body;

  if (event === "reconciliation.mismatch") {
    // Alert finance team
    await notifyFinanceTeam({
      jobId: data.jobId,
      sourceId: data.sourceId,
      expectedAmount: data.expectedAmount,
      actualAmount: data.actualAmount,
    });
  }

  res.json({ received: true });
});
```

### 5. Exception Handling

**Use Case:** Review and resolve unmatched transactions

**File:** `examples/exception-handling.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Get exceptions (unmatched transactions)
const exceptions = await settler.exceptions.list({
  jobId: "job_abc123",
  resolution_status: "open",
  limit: 50,
});

// Resolve exception
await settler.exceptions.resolve(exceptions.data[0].id, {
  resolution: "matched",
  notes: "Manually verified - amounts match",
});

// Bulk resolve
await settler.exceptions.bulkResolve({
  exceptionIds: exceptions.data.map(e => e.id),
  resolution: "ignored",
  notes: "Low-value transactions, acceptable variance",
});
```

### 6. Error Handling

**Use Case:** Robust error handling with retries

**File:** `examples/error-handling.ts`

```typescript
import Settler, { SettlerError } from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function createJobWithRetry(config: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await settler.jobs.create(config);
    } catch (error) {
      if (error instanceof SettlerError) {
        if (error.type === "RateLimitError" && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Log error
        console.error("Settler error:", {
          type: error.type,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

### 7. API Key Management

**Use Case:** Manage API keys programmatically

**File:** `examples/api-key-management.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// List API keys
const keys = await settler.apiKeys.list();
console.log("API Keys:", keys.data);

// Create new API key
const newKey = await settler.apiKeys.create({
  name: "Production API Key",
  scopes: ["jobs:read", "jobs:write", "reports:read"],
  rateLimit: 2000,
});
console.log("New key:", newKey.data.key); // Only shown once!

// Regenerate API key
const regenerated = await settler.apiKeys.regenerate(keys.data[0].id);
console.log("Regenerated key:", regenerated.data.key);

// Revoke API key
await settler.apiKeys.delete(keys.data[0].id);
```

### 8. Dashboard Metrics

**Use Case:** Track activation and usage metrics

**File:** `examples/dashboard-metrics.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Get activation dashboard
const activation = await settler.dashboards.activation({
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-31T23:59:59Z",
});
console.log("Signup funnel:", activation.data.signupFunnel);
console.log("Time to first value:", activation.data.timeToFirstValue);

// Get usage dashboard
const usage = await settler.dashboards.usage({
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-31T23:59:59Z",
});
console.log("Reconciliation volume:", usage.data.reconciliationVolume);
console.log("Accuracy trends:", usage.data.accuracyTrends);
```

### 9. Scheduled Reconciliations

**Use Case:** Set up automated daily/weekly reconciliations

**File:** `examples/scheduled-reconciliations.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Daily reconciliation at 2 AM
const dailyJob = await settler.jobs.create({
  name: "Daily Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
  schedule: "0 2 * * *", // Cron: Daily at 2 AM
});

// Weekly reconciliation on Monday at 9 AM
const weeklyJob = await settler.jobs.create({
  name: "Weekly Reconciliation",
  source: { adapter: "stripe", config: { /* ... */ } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
  schedule: "0 9 * * 1", // Cron: Monday at 9 AM
});
```

### 10. Multi-Currency Reconciliation

**Use Case:** Reconcile transactions in different currencies

**File:** `examples/multi-currency.ts`

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Multi-Currency Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  target: {
    adapter: "quickbooks",
    config: { /* ... */ },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      // FX conversion handled automatically
    ],
    // Enable FX conversion
    fxConversion: {
      enabled: true,
      baseCurrency: "USD",
    },
  },
});
```

---

## Best Practices

### 1. Environment Variables

Always use environment variables for API keys:

```typescript
const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY, // Never hardcode!
});
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  const job = await settler.jobs.create(config);
} catch (error) {
  if (error instanceof SettlerError) {
    // Handle Settler-specific errors
    console.error("Settler error:", error.message);
  } else {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
  }
}
```

### 3. Retry Logic

Implement retry logic for transient errors:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### 4. Webhook Verification

Always verify webhook signatures:

```typescript
import crypto from "crypto";

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const [timestamp, hash] = signature.split(",");
  const [t, v1] = hash.split("=");
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(v1),
    Buffer.from(expectedSignature)
  );
}
```

---

## Contributing

Have a use case that's not covered? Submit a PR with your example!

---

**Last Updated:** 2026-01-15
