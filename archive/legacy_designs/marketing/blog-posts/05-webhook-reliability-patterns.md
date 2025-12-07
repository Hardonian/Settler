# Webhook Reliability Patterns for Payment Reconciliation

**Published:** 2026-01-15  
**Author:** Settler Team  
**Category:** Engineering, Best Practices

---

## Introduction

Webhooks are essential for real-time reconciliation, but they're unreliable by nature. This guide covers patterns for building reliable webhook-based reconciliation systems.

---

## The Challenge

**Webhook Problems:**

- Delivery failures (network issues, timeouts)
- Duplicate deliveries
- Out-of-order delivery
- Missing webhooks

**Impact:** Incomplete reconciliation, data inconsistencies

---

## Reliability Patterns

### 1. Idempotency

**Problem:** Duplicate webhooks

**Solution:** Use idempotency keys

```typescript
const idempotencyKey = webhook.id || `${webhook.type}-${webhook.data.id}`;

// Check if already processed
const processed = await checkIfProcessed(idempotencyKey);
if (processed) {
  return; // Already processed, ignore
}

// Process webhook
await processWebhook(webhook);

// Mark as processed
await markAsProcessed(idempotencyKey);
```

### 2. Retry Logic

**Problem:** Temporary failures

**Solution:** Exponential backoff retry

```typescript
async function processWebhookWithRetry(webhook: Webhook, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await processWebhook(webhook);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Webhook Queue

**Problem:** Processing failures

**Solution:** Queue webhooks for retry

```typescript
// Add to queue
await webhookQueue.add({
  webhook,
  retryCount: 0,
  maxRetries: 3,
});

// Process queue with retries
await processWebhookQueue();
```

### 4. Signature Verification

**Problem:** Webhook spoofing

**Solution:** Verify webhook signatures

```typescript
import crypto from "crypto";

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const [timestamp, hash] = signature.split(",");
  const [t, v1] = hash.split("=");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedSignature));
}
```

### 5. Polling Fallback

**Problem:** Missing webhooks

**Solution:** Poll API as backup

```typescript
// Primary: Webhooks (real-time)
app.post("/webhooks/stripe", handleWebhook);

// Fallback: Polling (every hour)
setInterval(async () => {
  const recentTransactions = await fetchRecentTransactions();
  await reconcileTransactions(recentTransactions);
}, 3600000); // 1 hour
```

---

## Settler's Webhook Implementation

### Automatic Retries

Settler automatically retries failed webhook deliveries:

- 3 retries with exponential backoff
- Dead letter queue for permanent failures
- Webhook delivery status tracking

### Idempotency

All webhook processing is idempotent:

- Duplicate webhooks ignored
- Idempotency keys tracked
- No duplicate reconciliation

### Signature Verification

All webhooks verified:

- HMAC-SHA256 signatures
- Timestamp validation (prevent replay attacks)
- Secret rotation support

---

## Best Practices

1. **Always Verify Signatures:** Never trust unverified webhooks
2. **Handle Duplicates:** Use idempotency keys
3. **Retry on Failure:** Exponential backoff
4. **Queue for Reliability:** Don't process synchronously
5. **Monitor Delivery:** Track success/failure rates
6. **Poll as Fallback:** Don't rely solely on webhooks

---

## Example: Reliable Webhook Handler

```typescript
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.raw({ type: "application/json" }));

app.post("/webhooks/settler", async (req, res) => {
  // 1. Verify signature
  const signature = req.headers["x-settler-signature"] as string;
  const secret = process.env.SETTLER_WEBHOOK_SECRET!;

  if (!verifyWebhook(req.body.toString(), signature, secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 2. Parse payload
  const webhook = JSON.parse(req.body.toString());
  const idempotencyKey = webhook.id;

  // 3. Check idempotency
  if (await isProcessed(idempotencyKey)) {
    return res.json({ received: true }); // Already processed
  }

  // 4. Process webhook (async, don't block response)
  processWebhookAsync(webhook, idempotencyKey).catch(console.error);

  // 5. Respond immediately
  res.json({ received: true });
});

async function processWebhookAsync(webhook: Webhook, idempotencyKey: string) {
  try {
    await processWebhook(webhook);
    await markAsProcessed(idempotencyKey);
  } catch (error) {
    // Add to retry queue
    await addToRetryQueue(webhook, idempotencyKey);
  }
}
```

---

**Questions?** Contact us at support@settler.io
