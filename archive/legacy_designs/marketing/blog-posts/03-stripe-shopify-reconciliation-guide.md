# How to Automatically Reconcile Stripe and Shopify

**Published:** 2026-01-15  
**Author:** Settler Team  
**Category:** Tutorial, E-commerce

---

## Introduction

If you run an e-commerce store, you likely use Shopify for orders and Stripe for payments. Reconciling these two systems manually is time-consuming and error-prone. This guide shows you how to automate it.

---

## The Problem

**Manual Process:**

1. Export Shopify orders (CSV)
2. Export Stripe payments (CSV)
3. Match orders to payments in Excel
4. Find unmatched items
5. Investigate discrepancies
6. Update accounting system

**Time:** 2-3 hours daily  
**Accuracy:** 85-95% (human error)  
**Scalability:** Doesn't scale

---

## The Solution: Automated Reconciliation

**Automated Process:**

1. Connect Shopify and Stripe via Settler API
2. Configure matching rules
3. Run reconciliation automatically
4. Review exceptions (if any)
5. Export to accounting system

**Time:** 5 minutes setup, then automatic  
**Accuracy:** 99%+  
**Scalability:** Handles millions of transactions

---

## Step-by-Step Guide

### Step 1: Install Settler SDK

```bash
npm install @settler/sdk
```

### Step 2: Get API Keys

**Settler API Key:**

1. Sign up at [settler.io](https://settler.io)
2. Go to Settings → API Keys
3. Create new API key
4. Copy key (starts with `sk_live_...`)

**Stripe API Key:**

1. Go to Stripe Dashboard → Developers → API Keys
2. Copy Secret Key (starts with `sk_live_...`)

**Shopify API Key:**

1. Go to Shopify Admin → Apps → Develop apps
2. Create app → Admin API access token
3. Copy token (starts with `shpat_...`)

### Step 3: Create Reconciliation Job

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Shopify-Stripe Daily Reconciliation",
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

console.log("Job created:", job.data.id);
```

### Step 4: Run Reconciliation

```typescript
// Run manually
const execution = await settler.jobs.run(job.data.id);

// Or wait for scheduled run
```

### Step 5: Get Results

```typescript
const report = await settler.reports.get(job.data.id);

console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

### Step 6: Handle Exceptions

```typescript
// Get unmatched transactions
const exceptions = await settler.exceptions.list({
  jobId: job.data.id,
  resolution_status: "open",
});

// Review and resolve
for (const exception of exceptions.data) {
  console.log(`Exception: ${exception.description}`);
  // Resolve manually or automatically
}
```

### Step 7: Export to Accounting

```typescript
// Export as CSV
const csv = await settler.reports.export(job.data.id, {
  format: "csv",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

// Import into QuickBooks/Xero
```

---

## Matching Rules Explained

### Order ID Match

```typescript
{ field: "order_id", type: "exact" }
```

**What it does:** Matches Shopify order ID with Stripe payment metadata

**Why:** Stripe payments include Shopify order ID in metadata

### Amount Match with Tolerance

```typescript
{ field: "amount", type: "exact", tolerance: 0.01 }
```

**What it does:** Matches amounts within $0.01 tolerance

**Why:** Rounding differences, fees, discounts

### Date Range Match

```typescript
{ field: "date", type: "range", days: 1 }
```

**What it does:** Matches transactions within 1 day

**Why:** Orders and payments may have different timestamps

---

## Common Issues & Solutions

### Issue 1: High Exception Rate

**Symptoms:** Many unmatched transactions

**Solutions:**

- Check matching rules (may be too strict)
- Verify order IDs are in Stripe metadata
- Adjust date range tolerance
- Check for refunds/chargebacks

### Issue 2: Amount Mismatches

**Symptoms:** Amounts don't match exactly

**Solutions:**

- Increase tolerance (e.g., $0.10)
- Account for Stripe fees
- Handle discounts separately
- Check currency conversion

### Issue 3: Missing Transactions

**Symptoms:** Orders without payments

**Solutions:**

- Check payment status (pending vs completed)
- Verify date ranges
- Check for failed payments
- Handle partial payments

---

## Advanced: Real-Time Reconciliation

**Set up webhooks for real-time matching:**

```typescript
// Create webhook
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.matched", "reconciliation.mismatch"],
});

// Handle webhook events
app.post("/webhooks/settler", async (req, res) => {
  const { event, data } = req.body;

  if (event === "reconciliation.mismatch") {
    // Alert finance team
    await notifyFinanceTeam(data);
  }

  res.json({ received: true });
});
```

---

## Results

**Before (Manual):**

- Time: 2-3 hours daily
- Accuracy: 85-95%
- Exceptions: 10-15%

**After (Automated):**

- Time: 5 minutes setup, then automatic
- Accuracy: 99%+
- Exceptions: <5%

**ROI:** Saves 10+ hours per week, prevents revenue leakage

---

## Next Steps

1. **Try Settler Free:** [settler.io/signup](https://settler.io/signup)
2. **Read Docs:** [docs.settler.io](https://docs.settler.io)
3. **Join Discord:** [discord.gg/settler](https://discord.gg/settler)

---

**Questions?** Contact us at support@settler.io
