# Settler Quickstart Guide

## First Reconciliation in <30 Minutes

This guide will help you get your first reconciliation running in under 30 minutes. We'll walk through setting up Settler, creating a reconciliation job, and viewing your first results.

---

## Prerequisites

- Node.js 18+ installed
- A Settler account (sign up at [settler.io](https://settler.io) or use the free tier)
- API keys for the platforms you want to reconcile (e.g., Stripe, Shopify, PayPal)

---

## Step 1: Install the SDK (2 minutes)

```bash
npm install @settler/sdk
# or
yarn add @settler/sdk
# or
pnpm add @settler/sdk
```

---

## Step 2: Get Your API Key (1 minute)

1. Sign up at [settler.io](https://settler.io) or log in to your account
2. Navigate to **Settings** → **API Keys**
3. Create a new API key (or use the default one)
4. Copy your API key (starts with `sk_`)

**Free Tier:** 1,000 reconciliations/month, 2 adapters, 7-day log retention

---

## Step 3: Create Your First Reconciliation Job (5 minutes)

### Option A: Using the SDK (Recommended)

Create a file `reconcile.js`:

```javascript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY, // or 'sk_your_api_key_here'
});

async function createFirstJob() {
  // Create a reconciliation job
  const job = await client.jobs.create({
    name: "My First Reconciliation",
    source: {
      adapter: "stripe", // Source platform
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY, // Your Stripe secret key
      },
    },
    target: {
      adapter: "shopify", // Target platform
      config: {
        apiKey: process.env.SHOPIFY_API_KEY,
        shopDomain: "your-shop.myshopify.com",
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

  console.log("✅ Job created:", job.data.id);
  console.log("   Name:", job.data.name);
  console.log("   Status:", job.data.status);

  return job.data.id;
}

createFirstJob().catch(console.error);
```

Run it:

```bash
export SETTLER_API_KEY='sk_your_api_key'
export STRIPE_SECRET_KEY='sk_your_stripe_key'
export SHOPIFY_API_KEY='your_shopify_key'
node reconcile.js
```

### Option B: Using the CLI

```bash
# Install CLI globally
npm install -g @settler/cli

# Set your API key
export SETTLER_API_KEY='sk_your_api_key'

# Create a job
settler jobs create \
  --name "My First Reconciliation" \
  --source stripe \
  --target shopify
```

### Option C: Using cURL

```bash
curl -X POST https://api.settler.io/api/v1/jobs \
  -H "X-API-Key: sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Reconciliation",
    "source": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_your_stripe_key"
      }
    },
    "target": {
      "adapter": "shopify",
      "config": {
        "apiKey": "your_shopify_key",
        "shopDomain": "your-shop.myshopify.com"
      }
    },
    "rules": {
      "matching": [
        { "field": "order_id", "type": "exact" },
        { "field": "amount", "type": "exact", "tolerance": 0.01 }
      ]
    }
  }'
```

---

## Step 4: Run Your First Reconciliation (2 minutes)

### Using the SDK:

```javascript
// Run the job
const execution = await client.jobs.run(jobId);
console.log("✅ Reconciliation started:", execution.data.id);

// Wait a few seconds for it to complete (or poll for status)
await new Promise((resolve) => setTimeout(resolve, 5000));

// Get the report
const report = await client.reports.get(jobId, {
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
  endDate: new Date().toISOString(),
});

console.log("\n📊 Reconciliation Report:");
console.log("   Matched:", report.data.summary.matched);
console.log("   Unmatched (source):", report.data.summary.unmatchedSource);
console.log("   Unmatched (target):", report.data.summary.unmatchedTarget);
console.log("   Accuracy:", report.data.summary.accuracy + "%");
```

### Using the CLI:

```bash
# Run the job
settler jobs run <job_id>

# View the report
settler reports get <job_id>
```

---

## Step 5: View Results (2 minutes)

### View in Dashboard

1. Go to [app.settler.io](https://app.settler.io)
2. Navigate to **Jobs** → Select your job
3. View the reconciliation report with matched/unmatched transactions

### View via API

```javascript
const report = await client.reports.get(jobId);

console.log("Summary:", report.data.summary);
console.log("Matched transactions:", report.data.matched);
console.log("Unmatched transactions:", report.data.unmatched);
```

### View via CLI

```bash
settler reports get <job_id> --format json
```

---

## Step 6: Set Up Webhooks (Optional, 5 minutes)

Get real-time notifications when reconciliation completes:

```javascript
// Create a webhook
const webhook = await client.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.failed", "reconciliation.mismatch"],
});

console.log("✅ Webhook created:", webhook.data.id);
```

**Webhook Handler Example (Express.js):**

```javascript
import express from "express";
import { verifyWebhookSignature } from "@settler/sdk";

const app = express();

app.post("/webhooks/settler", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-settler-signature"];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  switch (event.type) {
    case "reconciliation.completed":
      console.log("✅ Reconciliation completed:", event.data.jobId);
      console.log("   Matched:", event.data.summary.matched);
      break;
    case "reconciliation.mismatch":
      console.log("⚠️  Mismatch detected:", event.data);
      // Alert your team, create a ticket, etc.
      break;
  }

  res.json({ received: true });
});

app.listen(3000);
```

---

## Common Use Cases

### Use Case 1: Stripe → QuickBooks Reconciliation

```javascript
const job = await client.jobs.create({
  name: "Stripe to QuickBooks",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
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
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact" },
    ],
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

### Use Case 2: Multi-Gateway Reconciliation

```javascript
// Reconcile Stripe + PayPal + Shopify → QuickBooks
const job = await client.jobs.create({
  name: "Multi-Gateway Reconciliation",
  sources: [
    { adapter: "stripe", config: { apiKey: process.env.STRIPE_KEY } },
    { adapter: "paypal", config: { apiKey: process.env.PAYPAL_KEY } },
    { adapter: "shopify", config: { apiKey: process.env.SHOPIFY_KEY } },
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

### Use Case 3: Real-Time Webhook Reconciliation

```javascript
// In your webhook handler (e.g., Stripe webhook)
app.post("/webhooks/stripe", async (req, res) => {
  const event = req.body;

  // Forward to Settler for real-time reconciliation
  await fetch("https://api.settler.io/api/v1/webhooks/receive/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.SETTLER_API_KEY,
    },
    body: JSON.stringify(event),
  });

  res.json({ received: true });
});
```

---

## Next Steps

1. **Explore the Dashboard:** [app.settler.io](https://app.settler.io) - Visual interface for managing jobs and viewing reports
2. **Read the API Docs:** [docs.settler.io/api](https://docs.settler.io/api) - Complete API reference
3. **Check Integration Recipes:** [docs.settler.io/recipes](https://docs.settler.io/recipes) - Common integration patterns
4. **Join the Community:** [Discord](https://discord.gg/settler) - Get help, share feedback

---

## Troubleshooting

### "Invalid API Key" Error

- Make sure your API key starts with `sk_`
- Check that you're using the correct environment (production vs sandbox)
- Verify your API key hasn't expired

### "Adapter Not Found" Error

- Check that the adapter name is correct (e.g., `stripe`, `shopify`, `paypal`)
- Verify your adapter credentials are valid
- See [Available Adapters](https://docs.settler.io/adapters) for a full list

### "No Transactions Found" Error

- Verify your source/target credentials are correct
- Check the date range (default is last 7 days)
- Ensure transactions exist in the specified date range

### Reconciliation Takes Too Long

- Large date ranges (>30 days) may take longer
- Check your job status: `settler jobs get <job_id>`
- View logs: `settler jobs logs <job_id>`

---

## Support

- 📖 [Full Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [GitHub Issues](https://github.com/settler/settler/issues)
- 📧 [Email Support](mailto:support@settler.io)

---

**Time Check:** You should have completed your first reconciliation in under 30 minutes! 🎉

If you ran into any issues, check the troubleshooting section above or reach out to our community for help.
