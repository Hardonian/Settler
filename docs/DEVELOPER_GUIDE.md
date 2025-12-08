# Settler Developer Guide

Complete guide for developers integrating Settler into their applications.

## Architecture Overview

Settler follows an API-first architecture:

```
┌─────────────┐
│ Your App    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│ Settler API │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌─────┐
│Source│ │Target│
│Adapter│ │Adapter│
└─────┘ └─────┘
```

## Authentication

Settler uses API key authentication. Include your API key in the `Authorization` header:

```http
Authorization: Bearer sk_your_api_key
```

### API Key Scopes

- **Read-only**: Can read jobs, reports, and adapters
- **Write**: Can create and update jobs
- **Admin**: Full access including webhook management

## Rate Limits

- **Free Tier**: 100 requests/minute
- **Starter**: 500 requests/minute
- **Growth**: 2,000 requests/minute
- **Scale**: 10,000 requests/minute
- **Enterprise**: Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

Settler uses standard HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": "Validation Error",
  "message": "Invalid adapter configuration",
  "details": {
    "field": "source.config.apiKey",
    "reason": "API key is required"
  }
}
```

## Idempotency

All state-changing operations support idempotency keys:

```http
POST /api/v1/jobs
Idempotency-Key: unique-key-12345
```

Duplicate requests with the same idempotency key will return the original response.

## Webhooks

### Webhook Events

- `reconciliation.started`: Reconciliation job started
- `reconciliation.completed`: Reconciliation completed successfully
- `reconciliation.failed`: Reconciliation failed
- `reconciliation.mismatch`: Unmatched records detected

### Webhook Payload

```json
{
  "event": "reconciliation.completed",
  "data": {
    "job_id": "job_123",
    "execution_id": "exec_456",
    "summary": {
      "matched": 1250,
      "unmatched": 5,
      "accuracy": 99.6
    }
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### Webhook Signature Verification

```typescript
import { verifyWebhookSignature } from "@settler/sdk";

const isValid = verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

## Best Practices

### 1. Use Environment Variables

Never hardcode API keys:

```typescript
const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});
```

### 2. Handle Errors Gracefully

```typescript
try {
  const job = await client.jobs.create({...});
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof RateLimitError) {
    // Retry with exponential backoff
  } else {
    // Log and alert
  }
}
```

### 3. Use Webhooks for Real-Time Updates

Instead of polling, set up webhooks:

```typescript
await client.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed"],
});
```

### 4. Implement Retry Logic

```typescript
import { withRetry } from "@settler/sdk";

const job = await withRetry(
  () => client.jobs.create({...}),
  { maxRetries: 3, backoff: "exponential" }
);
```

### 5. Cache Job Results

Cache reconciliation reports to reduce API calls:

```typescript
const cacheKey = `report:${jobId}:${executionId}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const report = await client.reports.get(jobId, executionId);
await cache.set(cacheKey, report, { ttl: 3600 });
```

## Advanced Features

### Custom Adapters

Create custom adapters for your systems:

```typescript
import { Adapter } from "@settler/adapters";

class CustomAdapter implements Adapter {
  name = "custom";
  
  async fetch(config: any, dateRange: DateRange) {
    // Fetch data from your system
  }
  
  normalize(data: any) {
    // Normalize to Settler format
  }
}
```

### Scheduled Jobs

Use cron expressions for scheduled reconciliation:

```typescript
const job = await client.jobs.create({
  // ... other config
  schedule: "0 2 * * *", // Daily at 2 AM
});
```

### Multi-Currency Support

Settler supports multi-currency reconciliation:

```typescript
const job = await client.jobs.create({
  // ... other config
  rules: {
    matching: [
      { field: "amount", type: "exact", currency: "USD" },
    ],
    currencyConversion: {
      enabled: true,
      baseCurrency: "USD",
    },
  },
});
```

## Testing

### Test Mode

Use test mode for development:

```typescript
const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
  baseUrl: "https://api-test.settler.io",
});
```

### Mocking

Mock Settler API responses in tests:

```typescript
import { mockSettlerAPI } from "@settler/sdk/testing";

mockSettlerAPI({
  "POST /api/v1/jobs": {
    status: 201,
    body: { data: { id: "job_123" } },
  },
});
```

## Performance Optimization

### Batch Operations

Batch multiple operations:

```typescript
const jobs = await Promise.all([
  client.jobs.create({...}),
  client.jobs.create({...}),
  client.jobs.create({...}),
]);
```

### Pagination

Use pagination for large result sets:

```typescript
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await client.jobs.list({ page, limit: 100 });
  // Process jobs
  hasMore = response.pagination.hasMore;
  page++;
}
```

## Security

### API Key Rotation

Rotate API keys regularly:

```typescript
// Create new key
const newKey = await client.apiKeys.create({...});

// Update client
client.apiKey = newKey;

// Delete old key after verification
await client.apiKeys.delete(oldKeyId);
```

### Webhook Security

Always verify webhook signatures:

```typescript
app.post("/webhooks/settler", (req, res) => {
  const signature = req.headers["x-settler-signature"];
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send("Invalid signature");
  }
  
  // Process webhook
});
```

## Support

- **Documentation**: [docs.settler.io](https://docs.settler.io)
- **API Reference**: [docs.settler.io/api](https://docs.settler.io/api)
- **Support Email**: support@settler.io
- **Community Discord**: [discord.gg/settler](https://discord.gg/settler)
