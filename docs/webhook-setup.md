# Webhook Setup Guide

**Set up event-driven notifications for reconciliation events.**

---

## Overview

Settler webhooks allow you to receive real-time notifications when reconciliation events occur. This enables you to:

- React immediately to reconciliation completion
- Handle mismatches and exceptions automatically
- Integrate reconciliation results into your workflows
- Build custom alerting and monitoring

---

## Webhook Events

Settler sends webhooks for the following events:

### Reconciliation Events

- `reconciliation.completed` - Reconciliation job completed successfully
- `reconciliation.mismatch` - Unmatched transactions found
- `reconciliation.error` - Reconciliation job failed
- `reconciliation.started` - Reconciliation job started

### Exception Events

- `exception.created` - New exception created
- `exception.resolved` - Exception resolved
- `exception.escalated` - Exception escalated for review

---

## Step 1: Create a Webhook Endpoint

Create an HTTP endpoint in your application to receive webhooks:

```typescript
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

app.post("/webhooks/settler", async (req, res) => {
  // Verify webhook signature (see Step 3)
  const isValid = verifyWebhookSignature(req);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  // Handle different event types
  switch (event) {
    case "reconciliation.completed":
      await handleReconciliationCompleted(data);
      break;
    case "reconciliation.mismatch":
      await handleMismatch(data);
      break;
    case "reconciliation.error":
      await handleError(data);
      break;
    default:
      console.log(`Unhandled event: ${event}`);
  }

  res.json({ received: true });
});

app.listen(3000, () => {
  console.log("Webhook server running on port 3000");
});
```

---

## Step 2: Register Your Webhook

Register your webhook endpoint with Settler:

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.mismatch", "reconciliation.error"],
  secret: process.env.WEBHOOK_SECRET, // Keep this secret!
});

console.log(`Webhook created: ${webhook.data.id}`);
console.log(`Webhook secret: ${webhook.data.secret}`);
```

**Important:** Store the webhook secret securely. You'll need it to verify signatures.

---

## Step 3: Verify Webhook Signatures

Settler signs all webhooks with HMAC-SHA256. Always verify signatures to ensure webhooks are authentic:

```typescript
function verifyWebhookSignature(req: express.Request): boolean {
  const signature = req.headers["x-settler-signature"] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET!;

  if (!signature) {
    return false;
  }

  // Parse signature: "t=timestamp,v1=hash"
  const [timestamp, hash] = signature.split(",");
  const [t, v1] = hash.split("=");

  // Create expected signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp.split("=")[1]}.${payload}`)
    .digest("hex");

  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedSignature));
}
```

---

## Step 4: Handle Events

### Handle Reconciliation Completed

```typescript
async function handleReconciliationCompleted(data: any) {
  const { jobId, summary } = data;

  console.log(`Reconciliation completed for job ${jobId}`);
  console.log(`Matched: ${summary.matched}`);
  console.log(`Unmatched: ${summary.unmatched}`);
  console.log(`Accuracy: ${summary.accuracy}%`);

  // Fetch full report if needed
  const report = await settler.reports.get(jobId);

  // Update your database, send notifications, etc.
  await updateReconciliationStatus(jobId, report.data);
}
```

### Handle Mismatches

```typescript
async function handleMismatch(data: any) {
  const { jobId, sourceId, targetId, reason } = data;

  console.log(`Mismatch detected in job ${jobId}`);
  console.log(`Source: ${sourceId}, Target: ${targetId}`);
  console.log(`Reason: ${reason}`);

  // Alert finance team
  await sendAlert({
    type: "reconciliation_mismatch",
    jobId,
    sourceId,
    targetId,
    reason,
  });

  // Create exception record in your system
  await createException({
    jobId,
    sourceId,
    targetId,
    reason,
    status: "open",
  });
}
```

### Handle Errors

```typescript
async function handleError(data: any) {
  const { jobId, error, message } = data;

  console.error(`Reconciliation error in job ${jobId}:`, error);
  console.error(`Message: ${message}`);

  // Log error to monitoring system
  await logError({
    jobId,
    error,
    message,
    timestamp: new Date(),
  });

  // Retry if appropriate
  if (isRetryableError(error)) {
    await retryReconciliation(jobId);
  }
}
```

---

## Step 5: Test Your Webhook

Use Settler's webhook testing tool or send a test webhook:

```typescript
// In your webhook handler, add a test endpoint
app.post("/webhooks/settler/test", (req, res) => {
  const testEvent = {
    event: "reconciliation.completed",
    data: {
      jobId: "test-job-id",
      summary: {
        matched: 100,
        unmatched: 5,
        accuracy: 95.2,
      },
    },
  };

  // Simulate webhook
  handleReconciliationCompleted(testEvent.data);

  res.json({ message: "Test webhook processed" });
});
```

---

## Best Practices

### 1. Idempotency

Webhooks may be delivered multiple times. Make your handlers idempotent:

```typescript
const processedEvents = new Set<string>();

async function handleEvent(eventId: string, data: any) {
  if (processedEvents.has(eventId)) {
    console.log(`Event ${eventId} already processed`);
    return;
  }

  // Process event
  await processEvent(data);

  // Mark as processed
  processedEvents.add(eventId);
}
```

### 2. Retry Logic

Settler automatically retries failed webhook deliveries (up to 5 times with exponential backoff). Your endpoint should:

- Return 2xx status codes for successful processing
- Return 4xx status codes for permanent failures (won't retry)
- Return 5xx status codes for temporary failures (will retry)

```typescript
app.post("/webhooks/settler", async (req, res) => {
  try {
    await processWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    // Temporary failure - will retry
    if (isTemporaryError(error)) {
      res.status(503).json({ error: "Temporary failure" });
    } else {
      // Permanent failure - won't retry
      res.status(400).json({ error: "Invalid request" });
    }
  }
});
```

### 3. Timeout Handling

Process webhooks quickly. Settler expects a response within 30 seconds:

```typescript
app.post("/webhooks/settler", async (req, res) => {
  // Acknowledge immediately
  res.status(202).json({ received: true });

  // Process asynchronously
  processWebhookAsync(req.body).catch(console.error);
});
```

### 4. Security

- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Rotate webhook secrets regularly
- Rate limit webhook endpoints

---

## Webhook Payload Examples

### Reconciliation Completed

```json
{
  "event": "reconciliation.completed",
  "data": {
    "jobId": "job_123",
    "executionId": "exec_456",
    "summary": {
      "matched": 145,
      "unmatched": 3,
      "errors": 1,
      "accuracy": 98.7,
      "totalTransactions": 149
    },
    "completedAt": "2026-01-15T10:30:00Z"
  }
}
```

### Reconciliation Mismatch

```json
{
  "event": "reconciliation.mismatch",
  "data": {
    "jobId": "job_123",
    "sourceId": "order_789",
    "targetId": null,
    "reason": "No matching transaction found",
    "amount": 99.99,
    "currency": "USD",
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

### Reconciliation Error

```json
{
  "event": "reconciliation.error",
  "data": {
    "jobId": "job_123",
    "executionId": "exec_456",
    "error": "ADAPTER_ERROR",
    "message": "Failed to fetch data from Shopify API",
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

---

## Monitoring Webhooks

Monitor webhook delivery in your Settler dashboard:

1. Go to **Settings → Webhooks**
2. Click on a webhook to view delivery history
3. Check delivery status, response codes, and retry attempts

---

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is accessible (not behind firewall)
2. Verify webhook is registered in dashboard
3. Check webhook delivery logs
4. Ensure endpoint returns 2xx status code

### Invalid Signature

1. Verify webhook secret matches
2. Check signature format: `t=timestamp,v1=hash`
3. Ensure payload is JSON stringified correctly
4. Verify timestamp is within 5 minutes

### Webhook Timeout

1. Process webhooks asynchronously
2. Return 202 Accepted immediately
3. Process in background job/queue
4. Keep processing time under 30 seconds

---

## Next Steps

- 📖 [API Quick Start Guide](./api-quick-start.md)
- 📚 [API Reference](https://docs.settler.io/api)
- 💡 [Integration Recipes](./integration-recipes.md)

---

## Need Help?

- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Discord Community:** [discord.gg/settler](https://discord.gg/settler)
- **Email Support:** [support@settler.io](mailto:support@settler.io)
