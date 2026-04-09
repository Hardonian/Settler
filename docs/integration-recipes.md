# Integration Recipes

Ready-to-use code examples for common integration scenarios.

## E-commerce: Shopify + Stripe Reconciliation

Reconcile Shopify orders with Stripe payments.

```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});

// Create reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Daily Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY!,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY!,
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

// Set up webhook for mismatches
await client.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: ["reconciliation.mismatch", "reconciliation.error"],
});

// Get daily report
const report = await client.reports.get(job.data.id, {
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

## Multi-Payment Platform Reconciliation

Reconcile payments from multiple sources (Stripe, PayPal, Square) with accounting system.

```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});

// Stripe → QuickBooks
const stripeJob = await client.jobs.create({
  name: "Stripe-QuickBooks Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY! },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID!,
      clientSecret: process.env.QB_CLIENT_SECRET!,
      realmId: process.env.QB_REALM_ID!,
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

// PayPal → QuickBooks
const paypalJob = await client.jobs.create({
  name: "PayPal-QuickBooks Reconciliation",
  source: {
    adapter: "paypal",
    config: {
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID!,
      clientSecret: process.env.QB_CLIENT_SECRET!,
      realmId: process.env.QB_REALM_ID!,
    },
  },
  rules: {
    matching: [
      { field: "payment_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});

// Run all jobs
await Promise.all([client.jobs.run(stripeJob.data.id), client.jobs.run(paypalJob.data.id)]);
```

## Real-Time Webhook Reconciliation

Set up real-time reconciliation as events occur.

```typescript
import express from "express";
import Settler from "@settler/sdk";

const app = express();
app.use(express.json());

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});

// Webhook endpoint to receive Shopify orders
app.post("/webhooks/shopify", async (req, res) => {
  const order = req.body;

  // Forward to Settler for processing
  await fetch("https://api.settler.io/api/v1/webhooks/receive/shopify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.SETTLER_API_KEY!,
    },
    body: JSON.stringify(order),
  });

  res.status(200).json({ received: true });
});

// Receive reconciliation results from Settler
app.post("/webhooks/reconcile", async (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case "reconciliation.matched":
      console.log(`✅ Matched: ${data.sourceId} ↔ ${data.targetId}`);
      // Update your database, send notification, etc.
      break;

    case "reconciliation.mismatch":
      console.error(`⚠️ Mismatch: ${data.sourceId}`);
      console.error(`Expected: ${data.expectedAmount}, Actual: ${data.actualAmount}`);
      // Alert finance team, create ticket, etc.
      await sendAlert({
        type: "mismatch",
        orderId: data.sourceId,
        expected: data.expectedAmount,
        actual: data.actualAmount,
      });
      break;

    case "reconciliation.error":
      console.error(`❌ Error: ${data.error}`);
      // Log error, notify ops team
      break;
  }

  res.status(200).json({ received: true });
});

app.listen(3000);
```

## Scheduled Daily Reconciliation

Run reconciliation daily and email reports.

```typescript
import Settler from "@settler/sdk";
import cron from "node-cron";
import nodemailer from "nodemailer";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});

const transporter = nodemailer.createTransport({
  // Your email config
});

async function runDailyReconciliation() {
  const jobs = await client.jobs.list();

  for (const job of jobs.data) {
    // Run job
    await client.jobs.run(job.id);

    // Wait for completion (in production, use polling)
    await new Promise((resolve) => setTimeout(resolve, 60000));

    // Get report
    const report = await client.reports.get(job.id, {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    });

    // Email report
    await transporter.sendMail({
      to: "finance@yourcompany.com",
      subject: `Daily Reconciliation Report: ${job.name}`,
      html: `
        <h2>Reconciliation Report</h2>
        <p><strong>Job:</strong> ${job.name}</p>
        <p><strong>Matched:</strong> ${report.data.summary.matched}</p>
        <p><strong>Unmatched:</strong> ${report.data.summary.unmatched}</p>
        <p><strong>Errors:</strong> ${report.data.summary.errors}</p>
        <p><strong>Accuracy:</strong> ${report.data.summary.accuracy}%</p>
        
        ${
          report.data.unmatched.length > 0
            ? `
          <h3>Unmatched Items</h3>
          <ul>
            ${report.data.unmatched
              .map(
                (item) =>
                  `<li>${item.sourceId || item.targetId}: $${item.amount} - ${item.reason}</li>`
              )
              .join("")}
          </ul>
        `
            : ""
        }
      `,
    });
  }
}

// Run daily at 3 AM
cron.schedule("0 3 * * *", runDailyReconciliation);
```

## Next.js API Route Integration

Use Settler in Next.js API routes.

```typescript
// pages/api/reconcile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { jobId, startDate, endDate } = req.body;

    const report = await client.reports.get(jobId, {
      startDate,
      endDate,
    });

    res.status(200).json(report.data);
  } catch (error) {
    console.error("Reconciliation error:", error);
    res.status(500).json({
      error: "Failed to generate report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
```

## React Component Integration

Display reconciliation status in React.

```typescript
import { useState, useEffect } from "react";
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.NEXT_PUBLIC_SETTLER_API_KEY!,
});

export function ReconciliationStatus({ jobId }: { jobId: string }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const result = await client.reports.get(jobId, {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        });
        setReport(result.data);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
    const interval = setInterval(fetchReport, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [jobId]);

  if (loading) return <div>Loading...</div>;
  if (!report) return <div>No report available</div>;

  return (
    <div>
      <h3>Reconciliation Status</h3>
      <div>
        <p>Matched: {report.summary.matched}</p>
        <p>Unmatched: {report.summary.unmatched}</p>
        <p>Accuracy: {report.summary.accuracy}%</p>
      </div>

      {report.summary.unmatched > 0 && (
        <div className="alert">
          ⚠️ {report.summary.unmatched} unmatched transactions found
        </div>
      )}
    </div>
  );
}
```

## CLI Usage Examples

```bash
# List all jobs
settler jobs list

# Create a job (interactive)
settler jobs create \
  --name "Shopify-Stripe Reconciliation" \
  --source shopify \
  --target stripe

# Run a job
settler jobs run job_1234567890

# Get report
settler reports get job_1234567890 \
  --start 2026-01-01 \
  --end 2026-01-31

# List adapters
settler adapters list

# List webhooks
settler webhooks list
```

## Environment Variables

```bash
# .env
SETTLER_API_KEY=sk_live_your_api_key_here

# Platform credentials
SHOPIFY_API_KEY=your_shopify_key
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
STRIPE_SECRET_KEY=sk_live_your_stripe_key
QB_CLIENT_ID=your_quickbooks_client_id
QB_CLIENT_SECRET=your_quickbooks_secret
QB_REALM_ID=your_realm_id
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
```

## Error Handling Best Practices

```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});

async function reconcileWithRetry(jobId: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const execution = await client.jobs.run(jobId);

      // Poll for completion
      while (true) {
        const status = await client.jobs.getExecution(execution.data.id);
        if (status.data.status === "completed") {
          return await client.reports.get(jobId);
        }
        if (status.data.status === "failed") {
          throw new Error(`Job failed: ${status.data.error}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```
