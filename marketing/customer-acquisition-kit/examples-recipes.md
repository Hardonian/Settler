# Settler Examples & Recipes

Real-world examples and code recipes for common reconciliation scenarios.

---

## Table of Contents

- [E-commerce Examples](#e-commerce-examples)
- [SaaS Examples](#saas-examples)
- [Accounting Examples](#accounting-examples)
- [Advanced Examples](#advanced-examples)
- [Integration Recipes](#integration-recipes)

---

## E-commerce Examples

### Example 1: Shopify ↔ Stripe Reconciliation

Reconcile Shopify orders with Stripe payments.

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create reconciliation job
const job = await settler.jobs.create({
  name: "Shopify-Stripe Daily Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
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

console.log("Job created:", job.data.id);

// Get report
const report = await settler.reports.get(job.data.id, {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

### Example 2: WooCommerce ↔ PayPal Reconciliation

Reconcile WooCommerce orders with PayPal transactions.

```typescript
const job = await settler.jobs.create({
  name: "WooCommerce-PayPal Reconciliation",
  source: {
    adapter: "woocommerce",
    config: {
      url: process.env.WOOCOMMERCE_URL,
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    },
  },
  target: {
    adapter: "paypal",
    config: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: "live",
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "customer_email", type: "exact" },
    ],
  },
});
```

### Example 3: Multi-Platform E-commerce Reconciliation

Reconcile orders from multiple e-commerce platforms.

```typescript
const job = await settler.jobs.create({
  name: "Multi-Platform E-commerce Reconciliation",
  sources: [
    {
      adapter: "shopify",
      config: {
        apiKey: process.env.SHOPIFY_API_KEY,
        shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      },
    },
    {
      adapter: "woocommerce",
      config: {
        url: process.env.WOOCOMMERCE_URL,
        consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
        consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
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
      { field: "order_id", type: "fuzzy", threshold: 0.8 },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 2 },
    ],
  },
});
```

---

## SaaS Examples

### Example 4: Stripe Subscription Reconciliation

Reconcile Stripe subscriptions with your database.

```typescript
const job = await settler.jobs.create({
  name: "Stripe Subscription Reconciliation",
  source: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  target: {
    adapter: "custom",
    config: {
      type: "database",
      connectionString: process.env.DATABASE_URL,
      query: `
        SELECT 
          id as subscription_id,
          amount,
          currency,
          created_at as date
        FROM subscriptions
        WHERE status = 'active'
      `,
    },
  },
  rules: {
    matching: [
      { field: "subscription_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
  },
});
```

### Example 5: Multi-Payment Gateway Reconciliation

Reconcile payments from Stripe, PayPal, and Square.

```typescript
const job = await settler.jobs.create({
  name: "Multi-Payment Gateway Reconciliation",
  sources: [
    {
      adapter: "stripe",
      config: { apiKey: process.env.STRIPE_SECRET_KEY },
    },
    {
      adapter: "paypal",
      config: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      },
    },
    {
      adapter: "square",
      config: { accessToken: process.env.SQUARE_ACCESS_TOKEN },
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
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "customer_email", type: "exact" },
      { field: "date", type: "range", days: 1 },
    ],
  },
});
```

### Example 6: Real-Time Webhook Reconciliation

Reconcile as events happen using webhooks.

```typescript
import express from "express";

const app = express();
app.use(express.json());

// Create reconciliation job
const job = await settler.jobs.create({
  name: "Real-Time Webhook Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
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

// Set up webhook
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: ["reconciliation.matched", "reconciliation.mismatch", "reconciliation.error"],
  secret: process.env.WEBHOOK_SECRET,
});

// Handle webhook events
app.post("/webhooks/reconcile", async (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case "reconciliation.matched":
      console.log("Transaction matched:", data.matchId);
      // Update your database
      await updateTransactionStatus(data.sourceId, "matched");
      break;

    case "reconciliation.mismatch":
      console.log("Mismatch detected:", data.sourceId);
      // Alert finance team
      await notifyFinanceTeam({
        jobId: data.jobId,
        sourceId: data.sourceId,
        expectedAmount: data.expectedAmount,
        actualAmount: data.actualAmount,
      });
      break;

    case "reconciliation.error":
      console.error("Reconciliation error:", data.error);
      // Log error
      await logError(data);
      break;
  }

  res.json({ received: true });
});

app.listen(3000);
```

---

## Accounting Examples

### Example 7: QuickBooks ↔ Bank Reconciliation

Reconcile QuickBooks transactions with bank statements.

```typescript
const job = await settler.jobs.create({
  name: "QuickBooks-Bank Reconciliation",
  source: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      realmId: process.env.QB_REALM_ID,
    },
  },
  target: {
    adapter: "bank_csv",
    config: {
      fileUrl: process.env.BANK_STATEMENT_URL,
      format: "ofx", // or "csv", "qif"
    },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "fuzzy", threshold: 0.8 },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 2 },
      { field: "description", type: "fuzzy", threshold: 0.7 },
    ],
  },
});
```

### Example 8: Xero ↔ Stripe Reconciliation

Reconcile Xero invoices with Stripe payments.

```typescript
const job = await settler.jobs.create({
  name: "Xero-Stripe Reconciliation",
  source: {
    adapter: "xero",
    config: {
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      tenantId: process.env.XERO_TENANT_ID,
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
      { field: "invoice_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "customer_email", type: "exact" },
      { field: "date", type: "range", days: 1 },
    ],
  },
});
```

---

## Advanced Examples

### Example 9: Custom Matching Rules

Use JavaScript functions for custom matching logic.

```typescript
const job = await settler.jobs.create({
  name: "Custom Matching Rules",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
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
      {
        field: "order_id",
        type: "custom",
        function: `
          function match(source, target) {
            // Custom matching logic
            const sourceOrderId = source.order_id.replace(/#/g, '');
            const targetOrderId = target.metadata.order_id;
            return sourceOrderId === targetOrderId;
          }
        `,
      },
      {
        field: "amount",
        type: "exact",
        tolerance: 0.01,
      },
    ],
  },
});
```

### Example 10: Multi-Currency Reconciliation

Handle multiple currencies with FX conversion.

```typescript
const job = await settler.jobs.create({
  name: "Multi-Currency Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
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
      {
        field: "amount",
        type: "exact",
        tolerance: 0.01,
        currencyConversion: {
          enabled: true,
          baseCurrency: "USD",
          provider: "fixer", // or "openexchangerates"
        },
      },
    ],
  },
});
```

### Example 11: Scheduled Reconciliation with Alerts

Set up scheduled reconciliation with email alerts.

```typescript
const job = await settler.jobs.create({
  name: "Daily Reconciliation with Alerts",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
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
  schedule: "0 2 * * *", // Daily at 2 AM
});

// Set up webhook for alerts
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile-alerts",
  events: ["reconciliation.completed", "reconciliation.mismatch"],
});

// Handle alerts
app.post("/webhooks/reconcile-alerts", async (req, res) => {
  const { event, data } = req.body;

  if (event === "reconciliation.completed") {
    const report = await settler.reports.get(data.jobId);
    const { accuracy, unmatched } = report.data.summary;

    // Send email if accuracy is low
    if (accuracy < 95 || unmatched > 5) {
      await sendEmail({
        to: "finance@yourcompany.com",
        subject: "Reconciliation Alert",
        body: `
          Reconciliation completed with issues:
          - Accuracy: ${accuracy}%
          - Unmatched: ${unmatched} transactions
        `,
      });
    }
  }

  res.json({ received: true });
});
```

---

## Integration Recipes

### Recipe 1: Next.js API Route

```typescript
// app/api/reconcile/route.ts
import { NextRequest, NextResponse } from "next/server";
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const job = await settler.jobs.create({
      name: body.name,
      source: body.source,
      target: body.target,
      rules: body.rules,
    });

    return NextResponse.json({ job: job.data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const jobs = await settler.jobs.list();
    return NextResponse.json({ jobs: jobs.data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Recipe 2: Express.js Webhook Handler

```typescript
// webhooks/reconcile.ts
import express from "express";
import crypto from "crypto";
import Settler from "@settler/sdk";

const router = express.Router();

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const [timestamp, hash] = signature.split(",");
  const [t, v1] = hash.split("=");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedSignature));
}

router.post("/reconcile", async (req, res) => {
  const signature = req.headers["x-settler-signature"] as string;
  const isValid = verifyWebhook(JSON.stringify(req.body), signature, process.env.WEBHOOK_SECRET!);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  // Process webhook event
  switch (event) {
    case "reconciliation.matched":
      await handleMatched(data);
      break;
    case "reconciliation.mismatch":
      await handleMismatch(data);
      break;
    case "reconciliation.error":
      await handleError(data);
      break;
  }

  res.json({ received: true });
});

async function handleMatched(data: any) {
  // Update database
  await db.transactions.update({
    where: { id: data.sourceId },
    data: { status: "matched", matchedAt: new Date() },
  });
}

async function handleMismatch(data: any) {
  // Alert finance team
  await sendSlackMessage({
    channel: "#finance-alerts",
    text: `Mismatch detected: ${data.sourceId}`,
  });
}

async function handleError(data: any) {
  // Log error
  await logger.error("Reconciliation error", data);
}

export default router;
```

### Recipe 3: Serverless Function (Vercel)

```typescript
// api/reconcile.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Settler from "@settler/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const settler = new Settler({
    apiKey: process.env.SETTLER_API_KEY,
  });

  try {
    const job = await settler.jobs.create(req.body);
    return res.status(201).json({ job: job.data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### Recipe 4: Cloudflare Worker

```typescript
// worker.ts
import Settler from "@settler/sdk";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const settler = new Settler({
      apiKey: env.SETTLER_API_KEY,
    });

    try {
      const body = await request.json();
      const job = await settler.jobs.create(body);

      return new Response(JSON.stringify({ job: job.data }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  },
};
```

### Recipe 5: Scheduled Reconciliation (Cron Job)

```typescript
// cron/reconcile.ts
import Settler from "@settler/sdk";
import cron from "node-cron";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Run reconciliation daily at 2 AM
cron.schedule("0 2 * * *", async () => {
  try {
    const jobs = await settler.jobs.list({ status: "active" });

    for (const job of jobs.data) {
      console.log(`Running reconciliation for job: ${job.id}`);

      const execution = await settler.jobs.run(job.id);
      console.log(`Execution started: ${execution.data.id}`);

      // Wait for completion (poll or use webhooks)
      await waitForCompletion(execution.data.id);

      // Get report
      const report = await settler.reports.get(job.id);
      console.log(`Accuracy: ${report.data.summary.accuracy}%`);
    }
  } catch (error) {
    console.error("Reconciliation error:", error);
  }
});

async function waitForCompletion(executionId: string) {
  // Poll for completion or use webhooks
  // Implementation depends on your needs
}
```

---

## More Examples

Check out our [GitHub repository](https://github.com/settler/settler-examples) for more examples:

- React integration
- Vue.js integration
- Python examples
- Ruby examples
- Go examples

---

**Need Help?** Check out our [documentation](https://docs.settler.io) or ask in [Discord](https://discord.gg/settler).

---

**Last Updated:** 2026-01-15
