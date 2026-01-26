# Common Reconciliation Workflows

**Step-by-step guides for common reconciliation scenarios**

---

## Workflow 1: E-commerce Order Reconciliation

**Scenario:** Reconcile Shopify orders with Stripe payments

### Step 1: Set Up Adapters

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Verify adapter connections
const shopifyTest = await settler.adapters.test({
  adapter: "shopify",
  config: {
    apiKey: process.env.SHOPIFY_API_KEY,
    shopDomain: "your-shop.myshopify.com",
  },
});

const stripeTest = await settler.adapters.test({
  adapter: "stripe",
  config: {
    apiKey: process.env.STRIPE_SECRET_KEY,
  },
});
```

### Step 2: Create Reconciliation Job

```typescript
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
      { field: "amount", type: "range", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM UTC
});
```

### Step 3: Run and Monitor

```typescript
// Run immediately
const execution = await settler.jobs.run(job.data.id);

// Or wait for scheduled run
// Monitor via webhooks
```

### Step 4: Handle Exceptions

```typescript
// Get unmatched transactions
const exceptions = await settler.exceptions.list({
  jobId: job.data.id,
  resolution_status: "open",
});

// Review and resolve
for (const exception of exceptions.data) {
  console.log(`Exception: ${exception.id}`);
  console.log(`Reason: ${exception.reason}`);

  // Resolve if needed
  if (exception.reason === "Processing delay") {
    await settler.exceptions.resolve(exception.id, {
      resolution: "auto-match",
      notes: "Matched after delay",
    });
  }
}
```

---

## Workflow 2: Multi-Platform Payment Reconciliation

**Scenario:** Reconcile payments from Stripe, PayPal, and Square against QuickBooks

### Step 1: Create Multi-Source Job

```typescript
const job = await settler.jobs.create({
  name: "Multi-Payment Reconciliation",
  sources: [
    {
      adapter: "stripe",
      config: { apiKey: process.env.STRIPE_KEY },
    },
    {
      adapter: "paypal",
      config: { apiKey: process.env.PAYPAL_KEY },
    },
    {
      adapter: "square",
      config: { apiKey: process.env.SQUARE_KEY },
    },
  ],
  target: {
    adapter: "quickbooks",
    config: { apiKey: process.env.QB_KEY },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "fuzzy", threshold: 0.8 },
      { field: "amount", type: "range", tolerance: 0.01 },
      { field: "date", type: "range", days: 2 },
    ],
  },
});
```

### Step 2: Handle Multi-Currency

```typescript
// Sync FX rates first
await settler.currency.syncRates({
  baseCurrency: "USD",
});

// Job will automatically use FX rates for conversion
```

### Step 3: Review Results

```typescript
const report = await settler.reports.get(job.data.id);

console.log("Summary:", report.data.summary);
// {
//   matched: 145,
//   unmatched: 8,
//   errors: 1,
//   accuracy: 94.8,
//   totalTransactions: 154
// }

// Export for review
const pdfExport = await settler.exports.create({
  jobId: job.data.id,
  format: "pdf",
});
```

---

## Workflow 3: Scheduled Daily Reconciliation

**Scenario:** Daily automated reconciliation with email alerts

### Step 1: Create Scheduled Job

```typescript
const job = await settler.jobs.create({
  name: "Daily Reconciliation",
  source: {
    /* ... */
  },
  target: {
    /* ... */
  },
  rules: {
    /* ... */
  },
  schedule: "0 2 * * *", // Daily at 2 AM UTC
});
```

### Step 2: Set Up Webhooks

```typescript
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.mismatch", "reconciliation.error"],
  secret: process.env.WEBHOOK_SECRET,
});
```

### Step 3: Handle Webhook Events

```typescript
// In your webhook endpoint
app.post("/webhooks/settler", async (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case "reconciliation.completed":
      await handleCompleted(data);
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

async function handleCompleted(data: any) {
  const { jobId, summary } = data;

  // Send success email
  await sendEmail({
    to: "finance@company.com",
    subject: "Daily Reconciliation Complete",
    body: `Reconciliation completed: ${summary.matched} matched, ${summary.unmatched} unmatched`,
  });

  // Update dashboard
  await updateDashboard(jobId, summary);
}

async function handleMismatch(data: any) {
  // Alert finance team
  await sendAlert({
    type: "reconciliation_mismatch",
    jobId: data.jobId,
    sourceId: data.sourceId,
    targetId: data.targetId,
    amount: data.amount,
  });
}
```

---

## Workflow 4: Real-Time Event-Driven Reconciliation

**Scenario:** Reconcile as transactions happen via webhooks

### Step 1: Set Up Webhook Receivers

```typescript
// Receive webhook from Stripe
app.post("/webhooks/stripe", async (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    // Trigger reconciliation
    await settler.jobs.run(jobId, {
      trigger: "webhook",
      sourceEvent: event.id,
    });
  }

  res.json({ received: true });
});
```

### Step 2: Configure Event Triggers

```typescript
const job = await settler.jobs.create({
  name: "Real-Time Reconciliation",
  source: {
    /* ... */
  },
  target: {
    /* ... */
  },
  rules: {
    /* ... */
  },
  webhookTriggers: {
    enabled: true,
    events: ["payment.succeeded", "order.created"],
  },
});
```

### Step 3: Process Results

```typescript
// Listen for reconciliation webhooks
app.post("/webhooks/settler", async (req, res) => {
  const { event, data } = req.body;

  if (event === "reconciliation.completed") {
    // Process immediately
    await processReconciliationResult(data);
  }

  res.json({ received: true });
});
```

---

## Workflow 5: Exception Review and Resolution

**Scenario:** Regular review and resolution of unmatched transactions

### Step 1: Get Exceptions

```typescript
const exceptions = await settler.exceptions.list({
  jobId: jobId,
  resolution_status: "open",
  limit: 100,
});
```

### Step 2: Review Exceptions

```typescript
for (const exception of exceptions.data) {
  console.log(`Exception ${exception.id}:`);
  console.log(`  Source: ${exception.sourceId}`);
  console.log(`  Target: ${exception.targetId}`);
  console.log(`  Amount: ${exception.amount} ${exception.currency}`);
  console.log(`  Reason: ${exception.reason}`);
  console.log(`  Confidence: ${exception.confidence}`);
}
```

### Step 3: Resolve Exceptions

```typescript
// Auto-resolve if confidence is high
for (const exception of exceptions.data) {
  if (exception.confidence > 0.9) {
    await settler.exceptions.resolve(exception.id, {
      resolution: "auto-match",
      notes: "High confidence match",
    });
  }
}

// Manual review for low confidence
const lowConfidence = exceptions.data.filter((e) => e.confidence < 0.7);
for (const exception of lowConfidence) {
  // Show to user for manual review
  await showExceptionForReview(exception);
}
```

### Step 4: Export Exception Report

```typescript
const exceptionReport = await settler.exports.create({
  jobId: jobId,
  format: "csv",
  type: "exceptions",
  filters: {
    resolution_status: "open",
  },
});
```

---

## Workflow 6: Multi-Currency Reconciliation

**Scenario:** Reconcile transactions in different currencies

### Step 1: Set Base Currency

```typescript
// Set base currency for tenant
await settler.currency.setBaseCurrency({
  baseCurrency: "USD",
});
```

### Step 2: Sync FX Rates

```typescript
// Sync rates for common currencies
await settler.currency.syncRates({
  baseCurrency: "USD",
  currencies: ["EUR", "GBP", "JPY", "CAD", "AUD"],
});
```

### Step 3: Create Multi-Currency Job

```typescript
const job = await settler.jobs.create({
  name: "Multi-Currency Reconciliation",
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
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      {
        field: "amount",
        type: "range",
        tolerance: 0.01,
        currencyConversion: true, // Enable FX conversion
      },
    ],
  },
  currency: {
    baseCurrency: "USD",
    autoConvert: true,
  },
});
```

### Step 4: Review Conversion Rates

```typescript
const report = await settler.reports.get(job.data.id);

// Check FX conversions used
for (const match of report.data.matches) {
  if (match.fxConversion) {
    console.log(`Converted ${match.fxConversion.fromAmount} ${match.fxConversion.fromCurrency}`);
    console.log(`  to ${match.fxConversion.toAmount} ${match.fxConversion.toCurrency}`);
    console.log(`  Rate: ${match.fxConversion.rate}`);
  }
}
```

---

## Workflow 7: Batch Processing Large Volumes

**Scenario:** Process large transaction volumes efficiently

### Step 1: Process in Batches

```typescript
async function processLargeVolume(jobId: string, dateRange: { start: Date; end: Date }) {
  const batchSize = 30; // days per batch
  const batches = [];

  let currentStart = dateRange.start;
  while (currentStart < dateRange.end) {
    const batchEnd = new Date(currentStart);
    batchEnd.setDate(batchEnd.getDate() + batchSize);
    if (batchEnd > dateRange.end) batchEnd = dateRange.end;

    batches.push({ start: currentStart, end: batchEnd });
    currentStart = batchEnd;
  }

  // Process batches sequentially
  for (const batch of batches) {
    const execution = await settler.jobs.run(jobId, {
      dateRange: batch,
    });

    // Wait for completion
    await waitForCompletion(execution.data.id);
  }
}
```

### Step 2: Monitor Progress

```typescript
async function waitForCompletion(executionId: string) {
  let status = "running";
  while (status === "running") {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s

    const execution = await settler.jobs.getExecution(executionId);
    status = execution.data.status;

    if (status === "completed") {
      console.log("Batch completed:", execution.data.summary);
    } else if (status === "failed") {
      console.error("Batch failed:", execution.data.error);
    }
  }
}
```

### Step 3: Aggregate Results

```typescript
// Combine results from all batches
const allReports = await Promise.all(
  batches.map((batch) => settler.reports.get(jobId, { dateRange: batch }))
);

const aggregated = {
  matched: allReports.reduce((sum, r) => sum + r.data.summary.matched, 0),
  unmatched: allReports.reduce((sum, r) => sum + r.data.summary.unmatched, 0),
  errors: allReports.reduce((sum, r) => sum + r.data.summary.errors, 0),
};

console.log("Aggregated results:", aggregated);
```

---

## Workflow 8: Custom Matching Logic

**Scenario:** Complex matching rules for edge cases

### Step 1: Define Custom Matching Function

```typescript
const job = await settler.jobs.create({
  name: "Custom Matching",
  source: {
    /* ... */
  },
  target: {
    /* ... */
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      {
        field: "custom",
        type: "function",
        fn: `
          (source, target) => {
            // Custom logic
            const sourceRef = source.metadata?.orderRef;
            const targetRef = target.metadata?.reference;
            
            // Match if references are similar
            if (sourceRef && targetRef) {
              return sourceRef.toLowerCase() === targetRef.toLowerCase();
            }
            
            // Fallback: match by amount and date
            const amountMatch = Math.abs(source.amount - target.amount) < 0.01;
            const dateMatch = Math.abs(
              new Date(source.date) - new Date(target.date)
            ) < 2 * 24 * 60 * 60 * 1000; // 2 days
            
            return amountMatch && dateMatch;
          }
        `,
      },
    ],
  },
});
```

### Step 2: Test Custom Function

```typescript
// Test with sample data
const testResult = await settler.jobs.testMatchingRules({
  source: {
    order_id: "ORD-123",
    amount: 99.99,
    date: "2026-01-15",
    metadata: { orderRef: "REF-456" },
  },
  target: {
    transaction_id: "TXN-789",
    amount: 99.99,
    date: "2026-01-16",
    metadata: { reference: "REF-456" },
  },
  rules: job.rules,
});

console.log("Match result:", testResult.data.matched);
console.log("Confidence:", testResult.data.confidence);
```

---

## Best Practices

### 1. Start Simple

- Begin with exact matches
- Add complexity gradually
- Test each rule change

### 2. Monitor Regularly

- Review exceptions weekly
- Check accuracy trends
- Adjust rules as needed

### 3. Use Webhooks

- Avoid polling
- Get real-time updates
- Reduce API calls

### 4. Handle Errors Gracefully

- Implement retry logic
- Log errors for analysis
- Alert on persistent failures

### 5. Optimize Performance

- Use appropriate date ranges
- Process in batches for large volumes
- Cache frequently accessed data

---

## Next Steps

- [API Quick Start Guide](./api-quick-start.md)
- [Matching Rules Documentation](./matching-rules.md)
- [Webhook Setup Guide](./webhook-setup.md)
- [Error Handling Guide](./error-handling.md)

---

**Last Updated:** January 2026
