# Webhook Idempotency & Replay Guarantees

## Overview

Settler's webhook system provides strong idempotency and replay guarantees to ensure reliable event delivery even in the face of network failures, retries, and duplicate events.

## Idempotency Guarantees

### What is Idempotent Delivery?

An idempotent operation produces the same result whether executed once or multiple times. For webhooks, this means:

- **Duplicate prevention**: The same event will not be processed twice within the idempotency window
- **Safe retries**: Failed deliveries can be retried without side effects
- **Replay protection**: Manual replays are deduplicated automatically

### Idempotency Window

- **Duration**: 24 hours
- **Scope**: Per webhook endpoint + event
- **Storage**: Database-backed with automatic cleanup

### How It Works

1. **Idempotency Key Generation**

   ```typescript
   // Auto-generated from event data
   idempotencyKey = `${tenantId}:${eventType}:${sha256(data).slice(0, 16)}`;

   // Or provided by caller
   idempotencyKey = "user-provided-key";
   ```

2. **Delivery Check**
   - Before delivery, check if idempotency key exists
   - If delivered successfully → skip (return success)
   - If failed or expired → allow retry
   - Store delivery status after attempt

3. **Storage**
   ```sql
   -- Idempotency keys stored with status
   idempotency_keys: {
     key: string,
     status: 'pending' | 'completed' | 'failed',
     response: json,
     expires_at: timestamp  -- 24h from creation
   }
   ```

### Headers

Each webhook includes idempotency information:

```http
POST /your-webhook-endpoint HTTP/1.1
X-Settler-Event-ID: evt_1234567890
X-Settler-Event-Type: reconciliation.completed
X-Idempotency-Key: tenant123:reconciliation.completed:abc123def456
X-Settler-Timestamp: 1704067200000
X-Settler-Signature: sha256=...
```

### Using Idempotency Keys

**TypeScript SDK:**

```typescript
// SDK auto-generates idempotency keys
await client.webhooks.create({
  url: "https://your-app.com/webhook",
  events: ["reconciliation.completed"],
});

// Or provide your own
await settler.queueWebhook(tenantId, eventType, data, {
  idempotencyKey: "custom-key-123",
});
```

**API Direct:**

```bash
curl -X POST https://api.settler.dev/api/v1/webhooks/queue \
  -H "X-API-Key: your-api-key" \
  -H "X-Idempotency-Key: custom-key-123" \
  -d '{...}'
```

## Replay Guarantees

### What is Replay?

Replay allows redelivery of a previously sent webhook event. Use cases:

- **Failed delivery retry**: Manually retry a failed webhook
- **Testing**: Re-send events to test handlers
- **Recovery**: Recover from downstream service outages

### Replay Safety

Replays are automatically deduplicated:

1. **Successful replays cannot be replayed again** (unless forced)
2. **Replay events have unique IDs** to distinguish from original
3. **Replay metadata** tracks replay count and original event
4. **Idempotency keys** are versioned: `original-key:replay:${timestamp}`

### Replay Metadata

```json
{
  "id": "evt_replay_9876543210",
  "type": "reconciliation.completed",
  "data": { ... },
  "metadata": {
    "originalDeliveryId": "del_1234567890",
    "isReplay": true,
    "replayCount": 1
  },
  "idempotencyKey": "tenant123:reconciliation.completed:abc123:replay:1704067200000"
}
```

### Replay API

**Replay a single delivery:**

```typescript
// TypeScript SDK
const result = await webhookService.replayWebhook("del_1234567890");
// { success: true, deliveryId: 'del_9876543210', wasDuplicate: false }

// Force replay even if already delivered
const result = await webhookService.replayWebhook("del_1234567890", { force: true });
```

**Batch replay:**

```typescript
const results = await webhookService.batchReplayWebhooks([
  "del_1111111111",
  "del_2222222222",
  "del_3333333333",
]);
```

**Check delivery status:**

```typescript
const delivery = await webhookService.getDeliveryByIdempotencyKey("tenant123:event:hash");
// { id: 'del_1234567890', status: 'delivered', ... }
```

## Implementation Guide

### Handling Idempotent Webhooks

Your webhook handler should be idempotent:

```typescript
app.post("/webhook", async (req, res) => {
  const { id, type, data, idempotencyKey } = req.body;

  // Check if already processed
  const existing = await db.webhookEvents.findOne({ eventId: id });
  if (existing) {
    return res.json({ received: true, duplicate: true });
  }

  // Process event
  await processWebhook(type, data);

  // Record processed
  await db.webhookEvents.insert({
    eventId: id,
    idempotencyKey,
    processedAt: new Date(),
  });

  res.json({ received: true });
});
```

### Detecting Replays

Check the metadata to detect replayed events:

```typescript
if (event.metadata?.isReplay) {
  console.log(`Replay #${event.metadata.replayCount} of ${event.metadata.originalDeliveryId}`);
}
```

### Deduplication Window

Default deduplication is 24 hours. For longer windows, implement your own storage:

```typescript
// Store processed event IDs with TTL
await redis.setex(
  `webhook:${event.id}`,
  7 * 24 * 60 * 60, // 7 days
  "processed"
);
```

## Error Handling

### Idempotency Errors

| Scenario                | Behavior                         |
| ----------------------- | -------------------------------- |
| Duplicate detected      | Returns success (no re-delivery) |
| Idempotency key expired | Treats as new event              |
| Storage failure         | Falls back to normal delivery    |

### Replay Errors

| Scenario                       | Behavior                                  |
| ------------------------------ | ----------------------------------------- |
| Original not found             | Returns error                             |
| Webhook deleted/inactive       | Returns error                             |
| Already delivered (no force)   | Returns success with `wasDuplicate: true` |
| Already delivered (with force) | Creates new delivery                      |

## Best Practices

1. **Always verify signatures** before processing
2. **Acknowledge quickly** (return 2xx) then process async
3. **Store event IDs** for your own deduplication
4. **Use idempotency keys** for critical events
5. **Monitor replay usage** to detect issues
6. **Clean up old data** from your deduplication store

## Monitoring

Track webhook reliability:

```typescript
// Metrics to watch
-webhook.delivery.success_rate -
  webhook.delivery.latency_p99 -
  webhook.duplicate_rate -
  webhook.retry.count -
  webhook.replay.usage;
```

## FAQ

**Q: Can I disable idempotency?**
A: No, idempotency is always enabled for safety. You can skip idempotency checks in replays using `force: true`.

**Q: What happens if idempotency storage fails?**
A: The webhook is delivered normally without duplicate prevention. Monitor for increased duplicate rates.

**Q: How long are replay records kept?**
A: Delivery records are retained based on your data retention policy (default: 90 days).

**Q: Can I replay events older than 24 hours?**
A: Yes, replays work regardless of the idempotency window. The window only affects automatic duplicate prevention.

**Q: Do replays count against my webhook quota?**
A: Yes, replays count as normal deliveries for billing purposes.
