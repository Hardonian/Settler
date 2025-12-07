# Settler Onboarding Experience

A step-by-step guide to getting started with Settler. From signup to production in minutes.

---

## Table of Contents

- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Interactive Onboarding](#interactive-onboarding)
- [First Reconciliation Job](#first-reconciliation-job)
- [Testing & Validation](#testing--validation)
- [Production Setup](#production-setup)
- [Next Steps](#next-steps)

---

## Quick Start (5 Minutes)

### Step 1: Sign Up

1. Go to [settler.io](https://settler.io)
2. Click "Get Started" or "Sign Up"
3. Enter your email and password
4. Verify your email (check inbox)

**Alternative:** Sign up with GitHub/Google for faster onboarding.

### Step 2: Get Your API Key

1. After signup, you'll be redirected to the dashboard
2. Navigate to **Settings → API Keys**
3. Click **"Create API Key"**
4. Copy your API key (starts with `sk_live_...` or `sk_test_...`)
5. **Important:** Store it securely (shown only once)

**Test vs. Live Keys:**

- `sk_test_...` — Sandbox mode (no real data)
- `sk_live_...` — Production mode (real reconciliations)

### Step 3: Install SDK

**npm:**

```bash
npm install @settler/sdk
```

**yarn:**

```bash
yarn add @settler/sdk
```

**pnpm:**

```bash
pnpm add @settler/sdk
```

### Step 4: Create Your First Job

**Option A: Using the Playground (No Code)**

1. Go to [settler.io/playground](https://settler.io/playground)
2. Select your source adapter (e.g., Shopify)
3. Select your target adapter (e.g., Stripe)
4. Enter your API keys
5. Configure matching rules
6. Click **"Run"**
7. View results instantly

**Option B: Using Code**

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "My First Reconciliation",
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

### Step 5: Get Results

```typescript
const report = await settler.reports.get(job.data.id);

console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

**🎉 Congratulations!** You've completed your first reconciliation.

---

## Interactive Onboarding

When you first sign up, Settler guides you through an interactive onboarding flow.

### Welcome Screen

**What you'll see:**

- Welcome message
- Product overview (30-second video)
- "Get Started" button

**What happens:**

- Click "Get Started" to begin

### Step 1: Choose Your Use Case

**Options:**

- E-commerce (Shopify, WooCommerce, etc.)
- SaaS (Stripe, PayPal, etc.)
- Accounting (QuickBooks, Xero, etc.)
- Custom (Other platforms)

**What happens:**

- Select your use case
- We'll pre-configure adapters for you

### Step 2: Connect Your Platforms

**What you'll see:**

- List of recommended adapters
- "Connect" buttons for each platform

**What happens:**

- Click "Connect" for each platform
- Enter API keys/credentials
- Test connection (automatic)

**Example:**

```
✅ Stripe Connected
✅ Shopify Connected
⏳ QuickBooks (Click to connect)
```

### Step 3: Configure Matching Rules

**What you'll see:**

- Visual rule builder
- Pre-configured rules based on your use case
- Option to customize

**What happens:**

- Review pre-configured rules
- Adjust if needed
- Click "Save"

**Example Rules:**

- Match by `order_id` (exact)
- Match by `amount` (exact, tolerance: $0.01)
- Match by `date` (range: 1 day)

### Step 4: Test Your First Reconciliation

**What you'll see:**

- "Run Test" button
- Real-time progress indicator
- Results preview

**What happens:**

- Click "Run Test"
- Wait for reconciliation (usually < 10 seconds)
- View results

**Results Preview:**

```
✅ Matched: 145 transactions
⚠️  Unmatched: 3 transactions
❌ Errors: 0
📊 Accuracy: 98.0%
```

### Step 5: Set Up Webhooks (Optional)

**What you'll see:**

- Webhook configuration form
- Example webhook URL
- Event selection

**What happens:**

- Enter your webhook URL
- Select events to subscribe to
- Test webhook delivery

### Step 6: Schedule Reconciliation (Optional)

**What you'll see:**

- Schedule configuration
- Cron expression builder
- Timezone selector

**What happens:**

- Set schedule (e.g., "Daily at 2 AM")
- Save schedule

### Step 7: Complete Onboarding

**What you'll see:**

- Success message
- Next steps
- Links to documentation
- "Go to Dashboard" button

**What happens:**

- Click "Go to Dashboard"
- Start using Settler!

---

## First Reconciliation Job

### Understanding the Job Structure

A reconciliation job consists of:

1. **Source** — Where data comes from (e.g., Shopify orders)
2. **Target** — Where data goes to (e.g., Stripe payments)
3. **Rules** — How to match transactions
4. **Schedule** — When to run (optional)

### Common Use Cases

#### Use Case 1: E-commerce Order Reconciliation

**Scenario:** Reconcile Shopify orders with Stripe payments

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
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

#### Use Case 2: Multi-Platform Payment Reconciliation

**Scenario:** Reconcile payments from Stripe, PayPal, and Square

```typescript
const job = await settler.jobs.create({
  name: "Multi-Platform Payment Reconciliation",
  sources: [
    {
      adapter: "stripe",
      config: { apiKey: process.env.STRIPE_SECRET_KEY },
    },
    {
      adapter: "paypal",
      config: { apiKey: process.env.PAYPAL_CLIENT_ID, secret: process.env.PAYPAL_SECRET },
    },
    {
      adapter: "square",
      config: { apiKey: process.env.SQUARE_ACCESS_TOKEN },
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
    ],
  },
});
```

#### Use Case 3: Real-Time Webhook Reconciliation

**Scenario:** Reconcile as events happen

```typescript
// 1. Create job
const job = await settler.jobs.create({
  name: "Real-Time Reconciliation",
  source: { adapter: "shopify", config: {...} },
  target: { adapter: "stripe", config: {...} },
  rules: { matching: [...] }
});

// 2. Set up webhook
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: [
    "reconciliation.matched",
    "reconciliation.mismatch",
    "reconciliation.error"
  ]
});

// 3. Handle webhook events
app.post("/webhooks/reconcile", async (req, res) => {
  const { event, data } = req.body;

  if (event === "reconciliation.mismatch") {
    // Alert finance team
    await notifyFinanceTeam({
      jobId: data.jobId,
      sourceId: data.sourceId,
      expectedAmount: data.expectedAmount,
      actualAmount: data.actualAmount
    });
  }

  res.json({ received: true });
});
```

---

## Testing & Validation

### Test Mode

Use test API keys to experiment safely:

```typescript
const settler = new Settler({
  apiKey: process.env.SETTLER_TEST_API_KEY, // sk_test_...
});
```

**Test Mode Features:**

- No real reconciliations
- Sandbox data
- No usage limits
- Perfect for development

### Validation Checklist

Before going to production:

- [ ] **API Keys:** Using production keys (`sk_live_...`)
- [ ] **Adapters:** All adapters connected and tested
- [ ] **Matching Rules:** Rules validated with test data
- [ ] **Webhooks:** Webhook endpoint tested and verified
- [ ] **Error Handling:** Error handling implemented
- [ ] **Monitoring:** Monitoring/logging set up
- [ ] **Documentation:** Team documentation updated

### Testing Your Integration

**1. Test Job Creation:**

```typescript
const job = await settler.jobs.create({...});
console.assert(job.data.id !== undefined, "Job ID should be defined");
console.assert(job.data.status === "active", "Job should be active");
```

**2. Test Job Execution:**

```typescript
const execution = await settler.jobs.run(job.data.id);
console.assert(execution.data.status === "running", "Execution should be running");
```

**3. Test Report Retrieval:**

```typescript
const report = await settler.reports.get(job.data.id);
console.assert(report.data.summary !== undefined, "Summary should be defined");
console.assert(report.data.summary.totalTransactions > 0, "Should have transactions");
```

**4. Test Webhook Delivery:**

```typescript
// Use a webhook testing service like webhook.site
const webhook = await settler.webhooks.create({
  url: "https://webhook.site/your-unique-id",
  events: ["reconciliation.matched"],
});

// Trigger a reconciliation
await settler.jobs.run(job.data.id);

// Check webhook.site for received webhook
```

---

## Production Setup

### Environment Variables

Create a `.env` file (never commit this):

```bash
# Settler
SETTLER_API_KEY=sk_live_abc123...

# Source Platforms
SHOPIFY_API_KEY=shpat_...
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com

# Target Platforms
STRIPE_SECRET_KEY=sk_live_...
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
QUICKBOOKS_REALM_ID=...

# Webhooks
WEBHOOK_SECRET=whsec_...
```

### Error Handling

Implement robust error handling:

```typescript
import Settler, { SettlerError } from "@settler/sdk";

async function createJobWithRetry(config: CreateJobRequest, maxRetries = 3) {
  const settler = new Settler({ apiKey: process.env.SETTLER_API_KEY });

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await settler.jobs.create(config);
    } catch (error) {
      if (error instanceof SettlerError) {
        if (error.type === "RateLimitError" && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        // Log error
        logger.error("Settler error", {
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

### Monitoring

Set up monitoring for your reconciliation jobs:

```typescript
import Settler from "@settler/sdk";

async function monitorJob(jobId: string) {
  const settler = new Settler({ apiKey: process.env.SETTLER_API_KEY });

  setInterval(async () => {
    try {
      const report = await settler.reports.get(jobId);
      const { matched, unmatched, errors, accuracy } = report.data.summary;

      // Send metrics to your monitoring service
      metrics.gauge("settler.matched", matched);
      metrics.gauge("settler.unmatched", unmatched);
      metrics.gauge("settler.errors", errors);
      metrics.gauge("settler.accuracy", accuracy);

      // Alert if accuracy drops below threshold
      if (accuracy < 95) {
        await alert({
          level: "warning",
          message: `Reconciliation accuracy dropped to ${accuracy}%`,
          jobId,
        });
      }
    } catch (error) {
      logger.error("Failed to monitor job", { jobId, error });
    }
  }, 60000); // Check every minute
}
```

### Logging

Log important operations:

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
  onRequest: (config) => {
    logger.info("Settler API Request", {
      method: config.method,
      url: config.url,
      timestamp: new Date().toISOString(),
    });
  },
  onResponse: (response) => {
    logger.info("Settler API Response", {
      status: response.status,
      timestamp: new Date().toISOString(),
    });
  },
});
```

---

## Next Steps

### Learn More

- **API Reference:** [docs.settler.io/api](https://docs.settler.io/api)
- **Developer Toolkit:** [docs.settler.io/toolkit](https://docs.settler.io/toolkit)
- **Examples:** [docs.settler.io/examples](https://docs.settler.io/examples)
- **Best Practices:** [docs.settler.io/best-practices](https://docs.settler.io/best-practices)

### Join the Community

- **Discord:** [discord.gg/settler](https://discord.gg/settler)
- **GitHub:** [github.com/settler/settler](https://github.com/settler/settler)
- **Twitter:** [@settler_io](https://twitter.com/settler_io)

### Get Help

- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Support Email:** support@settler.io
- **Discord:** Ask in #help channel

### Advanced Features

Once you're comfortable with the basics, explore:

- **Custom Matching Rules** — JavaScript-based matching logic
- **Multi-Currency Support** — FX conversion and currency-aware matching
- **Scheduled Jobs** — Cron-based automatic reconciliation
- **Webhook Integrations** — Real-time event notifications
- **Advanced Reporting** — Custom reports and analytics

---

## Troubleshooting

### Common Issues

**Issue: "Invalid API Key"**

**Solution:**

- Check that you're using the correct API key
- Ensure the API key starts with `sk_live_...` or `sk_test_...`
- Verify the API key hasn't been revoked

**Issue: "Adapter Connection Failed"**

**Solution:**

- Verify adapter API keys are correct
- Check adapter configuration (required fields)
- Test adapter connection manually

**Issue: "No Matches Found"**

**Solution:**

- Review matching rules (may be too strict)
- Check date ranges (transactions may be outside range)
- Verify data exists in both source and target

**Issue: "Webhook Not Receiving Events"**

**Solution:**

- Verify webhook URL is accessible (HTTPS required)
- Check webhook secret matches
- Verify webhook is active (not paused)
- Test webhook endpoint manually

### Getting Help

If you're stuck:

1. **Check Documentation:** [docs.settler.io](https://docs.settler.io)
2. **Search Issues:** [github.com/settler/settler/issues](https://github.com/settler/settler/issues)
3. **Ask Discord:** [discord.gg/settler](https://discord.gg/settler)
4. **Email Support:** support@settler.io

---

**Welcome to Settler!** 🎉 We're excited to see what you build.

---

**Last Updated:** 2026-01-15
