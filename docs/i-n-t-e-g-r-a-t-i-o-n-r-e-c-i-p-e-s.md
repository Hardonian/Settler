# Integration Recipes

## Common Integration Patterns and Code Examples

This guide provides ready-to-use code examples for common integration patterns with Settler.

---

## Table of Contents

1. [Stripe → QuickBooks Reconciliation](#stripe--quickbooks-reconciliation)
2. [Shopify → Stripe Reconciliation](#shopify--stripe-reconciliation)
3. [Multi-Gateway Reconciliation](#multi-gateway-reconciliation)
4. [Real-Time Webhook Reconciliation](#real-time-webhook-reconciliation)
5. [Scheduled Daily Reconciliation](#scheduled-daily-reconciliation)
6. [Subscription Revenue Recognition](#subscription-revenue-recognition)
7. [Error Handling and Retries](#error-handling-and-retries)
8. [Custom Adapter Integration](#custom-adapter-integration)

---

## Stripe → QuickBooks Reconciliation

### Use Case

Reconcile Stripe payments with QuickBooks accounting entries for accurate financial reporting.

### Implementation

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create reconciliation job
const job = await client.jobs.create({
  name: "Stripe to QuickBooks Daily Reconciliation",
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
      sandbox: process.env.NODE_ENV !== "production",
    },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact" },
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});

// Set up webhook for notifications
await client.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.mismatch"],
});

console.log("Job created:", job.data.id);
```

### Webhook Handler

```typescript
import express from "express";
import { verifyWebhookSignature } from "@settler/sdk";

const app = express();

app.post("/webhooks/settler", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-settler-signature"] as string;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  switch (event.type) {
    case "reconciliation.completed":
      handleReconciliationCompleted(event.data);
      break;
    case "reconciliation.mismatch":
      handleMismatch(event.data);
      break;
  }

  res.json({ received: true });
});

async function handleReconciliationCompleted(data: any) {
  console.log(`Reconciliation completed for job ${data.jobId}`);
  console.log(`Matched: ${data.summary.matched}`);
  console.log(`Unmatched: ${data.summary.unmatchedSource + data.summary.unmatchedTarget}`);

  // Send notification to finance team
  await sendEmail({
    to: "finance@company.com",
    subject: "Daily Reconciliation Complete",
    body: `Reconciliation completed with ${data.summary.matched} matched transactions.`,
  });
}

async function handleMismatch(data: any) {
  console.log("Mismatch detected:", data);

  // Create support ticket
  await createTicket({
    title: `Payment Mismatch: ${data.sourceId}`,
    description: `Expected: $${data.expectedAmount}, Actual: $${data.actualAmount}`,
    priority: "high",
  });
}
```

---

## Shopify → Stripe Reconciliation

### Use Case

Reconcile Shopify orders with Stripe payments to ensure all orders are paid correctly.

### Implementation

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await client.jobs.create({
  name: "Shopify-Stripe Order Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: process.env.SHOPIFY_DOMAIN,
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
      { field: "customer_email", type: "exact" },
    ],
    conflictResolution: "manual-review",
  },
});

// Run reconciliation
const execution = await client.jobs.run(job.data.id);

// Get report
const report = await client.reports.get(job.data.id, {
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

console.log("Reconciliation Report:");
console.log(`  Matched: ${report.data.summary.matched}`);
console.log(
  `  Unmatched: ${report.data.summary.unmatchedSource + report.data.summary.unmatchedTarget}`
);
console.log(`  Accuracy: ${report.data.summary.accuracy}%`);
```

---

## Multi-Gateway Reconciliation

### Use Case

Reconcile payments from multiple gateways (Stripe, PayPal, Square) to a single accounting system.

### Implementation

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await client.jobs.create({
  name: "Multi-Gateway to QuickBooks",
  sources: [
    {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY,
      },
    },
    {
      adapter: "paypal",
      config: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_SECRET,
      },
    },
    {
      adapter: "square",
      config: {
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        environment: process.env.SQUARE_ENV || "production",
      },
    },
  ],
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
      { field: "transaction_id", type: "fuzzy", threshold: 0.8 },
      { field: "amount", type: "exact" },
      { field: "customer_email", type: "exact" },
      { field: "date", type: "range", days: 2 },
    ],
    conflictResolution: "manual-review",
  },
});

console.log("Multi-gateway job created:", job.data.id);
```

---

## Real-Time Webhook Reconciliation

### Use Case

Reconcile payments in real-time as they occur, not in batch.

### Implementation

```typescript
import express from "express";
import { SettlerClient } from "@settler/sdk";

const app = express();
const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Forward Stripe webhooks to Settler for real-time processing
app.post("/webhooks/stripe", express.json(), async (req, res) => {
  const event = req.body;

  // Forward to Settler
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

// Handle Settler reconciliation results
app.post("/webhooks/settler", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-settler-signature"] as string;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  if (event.type === "reconciliation.mismatch") {
    // Handle mismatch immediately
    await handleRealtimeMismatch(event.data);
  }

  res.json({ received: true });
});

async function handleRealtimeMismatch(data: any) {
  // Alert operations team
  await sendSlackMessage({
    channel: "#operations",
    text: `⚠️ Payment mismatch detected: ${data.sourceId}`,
  });

  // Pause order fulfillment if needed
  if (data.severity === "high") {
    await pauseOrderFulfillment(data.sourceId);
  }
}
```

---

## Scheduled Daily Reconciliation

### Use Case

Run reconciliation automatically on a schedule and email reports to finance.

### Implementation

```typescript
import { SettlerClient } from "@settler/sdk";
import cron from "node-cron";
import nodemailer from "nodemailer";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

const transporter = nodemailer.createTransport({
  // Your email config
});

async function runDailyReconciliation() {
  const jobs = await client.jobs.list();

  for (const job of jobs.data) {
    if (job.schedule) {
      // Run the job
      const execution = await client.jobs.run(job.id);
      console.log(`Started reconciliation for job ${job.id}`);

      // Wait for completion (poll)
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const jobStatus = await client.jobs.get(job.id);
        if (jobStatus.data.status === "completed" || jobStatus.data.status === "failed") {
          completed = true;
        }
        attempts++;
      }

      // Get report
      const report = await client.reports.get(job.id, {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      // Email report
      await transporter.sendMail({
        to: "finance@company.com",
        subject: `Daily Reconciliation Report: ${job.name}`,
        html: generateReportHTML(report.data),
        attachments: [
          {
            filename: `report-${job.id}.csv`,
            content: generateCSV(report.data),
          },
        ],
      });
    }
  }
}

// Run daily at 3 AM
cron.schedule("0 3 * * *", runDailyReconciliation);
```

---

## Subscription Revenue Recognition

### Use Case

Reconcile subscription payments with revenue recognition for ASC 606 compliance.

### Implementation

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await client.jobs.create({
  name: "Stripe Subscriptions to QuickBooks Revenue",
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
      { field: "invoice_id", type: "exact" },
      { field: "amount", type: "exact" },
      { field: "period_start", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  metadata: {
    revenueRecognition: true,
    accountingStandard: "ASC 606",
  },
});

// Get revenue recognition report
const report = await client.reports.get(job.data.id, {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  includeRevenueRecognition: true,
});

console.log("Revenue Recognition Report:");
console.log(`  Recognized Revenue: $${report.data.revenueRecognition?.recognizedRevenue}`);
console.log(`  Deferred Revenue: $${report.data.revenueRecognition?.deferredRevenue}`);
```

---

## Error Handling and Retries

### Use Case

Handle errors gracefully and implement retry logic.

### Implementation

```typescript
import { SettlerClient, NetworkError, RateLimitError } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
  retry: {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
    retryOnRateLimit: true,
  },
});

async function createJobWithRetry(jobConfig: any) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const job = await client.jobs.create(jobConfig);
      return job;
    } catch (error) {
      attempts++;

      if (error instanceof RateLimitError) {
        console.log(`Rate limited. Retrying after ${error.retryAfter} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, error.retryAfter * 1000));
        continue;
      }

      if (error instanceof NetworkError) {
        console.log(`Network error. Retrying (attempt ${attempts}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        continue;
      }

      // Don't retry on validation errors
      throw error;
    }
  }

  throw new Error("Failed to create job after maximum attempts");
}

// Usage
try {
  const job = await createJobWithRetry({
    name: "My Job",
    // ... config
  });
  console.log("Job created:", job.data.id);
} catch (error) {
  console.error("Failed to create job:", error);
  // Alert team, log error, etc.
}
```

---

## Custom Adapter Integration

### Use Case

Integrate a custom payment provider or system that doesn't have a built-in adapter.

### Implementation

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Use the generic adapter with custom normalization
const job = await client.jobs.create({
  name: "Custom Provider Reconciliation",
  source: {
    adapter: "generic", // Generic adapter
    config: {
      apiEndpoint: "https://custom-provider.com/api",
      apiKey: process.env.CUSTOM_PROVIDER_KEY,
      normalization: {
        // Map custom fields to Settler's canonical schema
        id: "transaction_id",
        amount: "total_amount",
        currency: "currency_code",
        date: "transaction_date",
        customerEmail: "customer.email",
      },
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      // QuickBooks config
    },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact" },
    ],
  },
});
```

---

## See Also

- [Quickstart Guide](./QUICKSTART.md)
- [API Reference](./api.md)
- [CLI Documentation](./QUICKSTART_CLI.md)
- [GitOps Configuration](./GITOPS_CONFIG.md)
