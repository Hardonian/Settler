# Settler Onboarding Guide

Welcome to Settler! This guide will help you get started with reconciliation in minutes.

## Quick Start (5 Minutes)

### Step 1: Sign Up and Get Your API Key

1. Visit [app.settler.io](https://app.settler.io)
2. Sign up for a free account
3. Navigate to Settings → API Keys
4. Create a new API key
5. Copy and securely store your API key

### Step 2: Install the SDK

**TypeScript/JavaScript:**
```bash
npm install @settler/sdk
```

**Python:**
```bash
pip install settler-sdk
```

**Ruby:**
```bash
gem install settler-sdk
```

**Go:**
```bash
go get github.com/settler/settler-go
```

### Step 3: Create Your First Reconciliation Job

**TypeScript Example:**
```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: "sk_your_api_key",
});

const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shop: "your-shop",
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
```

### Step 4: Run Reconciliation

```typescript
// Run the job
await client.jobs.run(job.data.id);

// Get results
const report = await client.reports.get(job.data.id);
console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
```

### Step 5: Set Up Webhooks (Optional)

```typescript
await client.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.failed"],
});
```

## Common Use Cases

### E-commerce Order Reconciliation

Reconcile Shopify orders with Stripe payments:

```typescript
const job = await client.jobs.create({
  name: "Daily Order Reconciliation",
  source: {
    adapter: "shopify",
    config: { apiKey: "...", shop: "..." },
  },
  target: {
    adapter: "stripe",
    config: { apiKey: "..." },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

### SaaS Subscription Reconciliation

Reconcile Stripe subscriptions with QuickBooks invoices:

```typescript
const job = await client.jobs.create({
  name: "Monthly Subscription Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: "..." },
  },
  target: {
    adapter: "quickbooks",
    config: { apiKey: "...", companyId: "..." },
  },
  rules: {
    matching: [
      { field: "subscription_id", type: "exact" },
      { field: "amount", type: "exact" },
      { field: "customer_email", type: "exact" },
    ],
  },
  schedule: "0 0 1 * *", // First day of month
});
```

## Next Steps

1. **Explore Adapters**: See [Adapter Guide](./adapters.md) for all available adapters
2. **Custom Matching Rules**: Learn about advanced matching in [API Documentation](./api.md)
3. **Set Up Monitoring**: Configure webhooks and alerts for reconciliation events
4. **Review Reports**: Use the dashboard to analyze reconciliation results

## Getting Help

- **Documentation**: [docs.settler.io](https://docs.settler.io)
- **Support**: support@settler.io
- **Community**: [Discord](https://discord.gg/settler)
- **GitHub**: [github.com/settler/settler](https://github.com/settler/settler)

## Troubleshooting

### Common Issues

**Issue: "Invalid API key"**
- Verify your API key is correct
- Check that you're using the correct environment (production vs. development)

**Issue: "Adapter connection failed"**
- Verify your adapter credentials are correct
- Check network connectivity to the adapter's API
- Review adapter-specific requirements in [Adapter Guide](./adapters.md)

**Issue: "No matches found"**
- Review your matching rules
- Check that source and target data formats match
- Verify date ranges and filters

For more troubleshooting help, see [Troubleshooting Guide](./troubleshooting.md).
