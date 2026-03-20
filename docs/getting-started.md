# Getting Started with Settler

This guide will help you get started with Settler in under 30 minutes.

## Prerequisites

- Node.js 24.0.0 or higher
- npm 10.0.0 or higher
- A Supabase project (for local development)
- API keys from your platforms (Stripe, Shopify, etc.) - or use demo mode

## Running Locally

For local development, follow the [canonical setup guide](./SETUP.md) or use demo mode:

```bash
# Demo mode works without external dependencies
DEMO_MODE=true
```

## Step 1: Install the SDK

```bash
npm install @settler/sdk
```

Or with yarn:

```bash
yarn add @settler/sdk
```

## Step 2: Get Your API Key

1. Sign in to your [Settler dashboard](https://settler.io/dashboard)
2. Navigate to **Settings → API Keys**
3. Click **"Create API Key"**
4. Copy your key (starts with `sk_`)
5. Store it securely in an environment variable:

```bash
export SETTLER_API_KEY="sk_your_api_key_here"
```

**⚠️ Security Note:** Never commit API keys to version control. Always use environment variables.

## Step 3: Initialize the Client

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});
```

## Step 4: Create Your First Reconciliation Job

A reconciliation job defines:

- **Source platform** (e.g., Shopify orders)
- **Target platform** (e.g., Stripe payments)
- **Matching rules** (how to match transactions)

```typescript
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
});

console.log(`Job created: ${job.data.id}`);
```

## Step 5: Run Reconciliation

### Option A: Run Immediately

```typescript
const execution = await settler.jobs.run(job.data.id);
console.log(`Execution started: ${execution.data.id}`);
```

### Option B: Schedule Automatic Runs

Add a schedule when creating the job:

```typescript
const job = await settler.jobs.create({
  // ... other config
  schedule: "0 2 * * *", // Daily at 2 AM UTC (cron format)
});
```

## Step 6: Get Results

### Check Execution Status

```typescript
const status = await settler.jobs.getExecutionStatus(execution.data.id);
console.log(`Status: ${status.data.status}`); // "completed", "running", "failed"
```

### Get Reconciliation Report

```typescript
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

## Step 7: Set Up Webhooks (Optional)

Receive notifications when reconciliation completes or exceptions occur:

```typescript
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.mismatch", "reconciliation.error"],
  secret: process.env.WEBHOOK_SECRET, // For signature verification
});

console.log(`Webhook created: ${webhook.data.id}`);
```

See [API Reference](./api-reference.md) for complete webhook configuration details.

## Common Patterns

### Pattern 1: Daily Reconciliation

```typescript
const job = await settler.jobs.create({
  name: "Daily Reconciliation",
  // ... source and target config
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

### Pattern 2: Error Handling

```typescript
try {
  const execution = await settler.jobs.run(job.data.id);

  // Poll for completion (or use webhooks)
  let status = "running";
  while (status === "running") {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
    const executionStatus = await settler.jobs.getExecutionStatus(execution.data.id);
    status = executionStatus.data.status;
  }

  if (status === "failed") {
    console.error("Reconciliation failed");
  }
} catch (error) {
  console.error("Failed to run reconciliation:", error);
  // Handle error (retry, alert, etc.)
}
```

## Next Steps

- 📖 [API Reference](./api.md) - Complete API documentation
- 🔔 [Webhook Setup Guide](./webhook-setup.md) - Set up event notifications
- 🏗️ [Architecture](./ARCHITECTURE.md) - Understand system design
- 💡 [Integration Recipes](./INTEGRATION_RECIPES.md) - Common use cases and examples

## Need Help?

- **Documentation:** See the `/docs` directory in this repository
- **Issues:** [GitHub Issues](https://github.com/shardie-github/Settler-API/issues)
- **Email Support:** Check project README for community support channels
