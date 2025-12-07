# Settler API Best Practices

Learn how to use the Settler API effectively, efficiently, and securely.

---

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Performance](#performance)
- [Security](#security)
- [Webhooks](#webhooks)
- [Testing](#testing)

---

## Authentication

### Use Environment Variables

**❌ Bad:**

```typescript
const settler = new Settler({
  apiKey: "sk_live_abc123...", // Hardcoded!
});
```

**✅ Good:**

```typescript
const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});
```

### Rotate API Keys Regularly

- Rotate production keys every 90 days
- Use different keys for different environments
- Revoke unused keys immediately

### Use Test Keys for Development

```typescript
const settler = new Settler({
  apiKey:
    process.env.NODE_ENV === "production"
      ? process.env.SETTLER_API_KEY_LIVE
      : process.env.SETTLER_API_KEY_TEST,
});
```

---

## Error Handling

### Always Handle Errors

**❌ Bad:**

```typescript
const job = await settler.jobs.create({...});
// What if this fails?
```

**✅ Good:**

```typescript
try {
  const job = await settler.jobs.create({...});
} catch (error) {
  if (error instanceof SettlerError) {
    // Handle Settler-specific errors
    logger.error("Settler error", { type: error.type, message: error.message });
  } else {
    // Handle network/other errors
    logger.error("Unexpected error", { error });
  }
  throw error; // Re-throw if needed
}
```

### Handle Specific Error Types

```typescript
import Settler, { SettlerError } from "@settler/sdk";

try {
  const job = await settler.jobs.create({...});
} catch (error) {
  if (error instanceof SettlerError) {
    switch (error.type) {
      case "ValidationError":
        // Show user-friendly validation errors
        showValidationErrors(error.details);
        break;
      case "RateLimitError":
        // Implement exponential backoff
        await retryWithBackoff(() => settler.jobs.create({...}));
        break;
      case "NotFoundError":
        // Handle missing resource
        showNotFoundError();
        break;
      case "QuotaExceededError":
        // Handle quota exceeded
        showQuotaExceededError();
        break;
      default:
        // Handle other errors
        showGenericError(error.message);
    }
  }
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof SettlerError) {
        // Only retry on retryable errors
        if (
          error.type === "RateLimitError" ||
          error.type === "ServiceUnavailableError"
        ) {
          if (i < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

// Usage
const job = await withRetry(() => settler.jobs.create({...}));
```

---

## Rate Limiting

### Monitor Rate Limit Headers

```typescript
const response = await settler.jobs.list();
const rateLimitRemaining = response.headers["x-ratelimit-remaining"];

if (parseInt(rateLimitRemaining) < 10) {
  logger.warn("Rate limit approaching", { remaining: rateLimitRemaining });
  // Slow down requests
}
```

### Implement Exponential Backoff

```typescript
async function requestWithBackoff<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const retryAfter = error.retryAfter || Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Use Webhooks Instead of Polling

**❌ Bad:**

```typescript
// Polling every minute
setInterval(async () => {
  const report = await settler.reports.get(jobId);
  // Process report
}, 60000);
```

**✅ Good:**

```typescript
// Use webhooks
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: ["reconciliation.completed"],
});

// Handle webhook events
app.post("/webhooks/reconcile", async (req, res) => {
  const { event, data } = req.body;
  if (event === "reconciliation.completed") {
    await processReport(data.jobId);
  }
  res.json({ received: true });
});
```

---

## Performance

### Batch Operations When Possible

**❌ Bad:**

```typescript
// Creating jobs one by one
for (const config of jobConfigs) {
  await settler.jobs.create(config);
}
```

**✅ Good:**

```typescript
// Batch create jobs
const jobs = await Promise.all(jobConfigs.map((config) => settler.jobs.create(config)));
```

### Cache Responses

```typescript
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

async function getJobCached(jobId: string) {
  const cached = cache.get<ReconciliationJob>(jobId);
  if (cached) {
    return cached;
  }

  const job = await settler.jobs.get(jobId);
  cache.set(jobId, job.data);
  return job.data;
}
```

### Use Pagination

**❌ Bad:**

```typescript
// Fetching all jobs at once
const jobs = await settler.jobs.list({ limit: 1000 });
```

**✅ Good:**

```typescript
// Paginate results
async function getAllJobs() {
  const jobs = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await settler.jobs.list({ limit, offset });
    jobs.push(...response.data);

    if (response.data.length < limit) {
      break;
    }

    offset += limit;
  }

  return jobs;
}
```

### Optimize Report Queries

**❌ Bad:**

```typescript
// Fetching full report with all data
const report = await settler.reports.get(jobId, {
  includeMatches: true,
  includeUnmatched: true,
  includeErrors: true,
});

// Only need summary
const summary = report.data.summary;
```

**✅ Good:**

```typescript
// Fetch only what you need
const report = await settler.reports.get(jobId, {
  includeMatches: false,
  includeUnmatched: false,
  includeErrors: false,
});

const summary = report.data.summary;
```

---

## Security

### Never Commit API Keys

**❌ Bad:**

```typescript
// In version control
const settler = new Settler({
  apiKey: "sk_live_abc123...",
});
```

**✅ Good:**

```typescript
// Use environment variables
const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});
```

**`.env` file (add to `.gitignore`):**

```bash
SETTLER_API_KEY=sk_live_abc123...
```

### Verify Webhook Signatures

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

// Usage
app.post("/webhooks/reconcile", async (req, res) => {
  const signature = req.headers["x-settler-signature"];
  const isValid = verifyWebhook(JSON.stringify(req.body), signature, process.env.WEBHOOK_SECRET);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process webhook
  res.json({ received: true });
});
```

### Use HTTPS for Webhooks

**❌ Bad:**

```typescript
const webhook = await settler.webhooks.create({
  url: "http://your-app.com/webhooks/reconcile", // Not secure!
});
```

**✅ Good:**

```typescript
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile", // Secure
});
```

### Sanitize Input

```typescript
import { z } from "zod";

const CreateJobSchema = z.object({
  name: z.string().max(255),
  source: z.object({
    adapter: z.string(),
    config: z.record(z.unknown()),
  }),
  target: z.object({
    adapter: z.string(),
    config: z.record(z.unknown()),
  }),
  rules: z.object({
    matching: z.array(
      z.object({
        field: z.string(),
        type: z.enum(["exact", "fuzzy", "range"]),
        tolerance: z.number().optional(),
        days: z.number().optional(),
        threshold: z.number().optional(),
      })
    ),
  }),
});

// Validate before creating job
const validated = CreateJobSchema.parse(userInput);
const job = await settler.jobs.create(validated);
```

---

## Webhooks

### Idempotency

```typescript
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

app.post("/webhooks/reconcile", async (req, res) => {
  const webhookId = req.headers["x-settler-webhook-id"];

  // Check if we've already processed this webhook
  const processed = await redis.get(`webhook:${webhookId}`);
  if (processed) {
    return res.json({ received: true, duplicate: true });
  }

  // Process webhook
  await processWebhook(req.body);

  // Mark as processed (expire after 24 hours)
  await redis.setex(`webhook:${webhookId}`, 86400, "1");

  res.json({ received: true });
});
```

### Webhook Retries

Settler automatically retries failed webhooks with exponential backoff. Your endpoint should:

1. Return `200 OK` immediately
2. Process webhook asynchronously
3. Handle duplicate deliveries (idempotency)

```typescript
app.post("/webhooks/reconcile", async (req, res) => {
  // Return 200 immediately
  res.json({ received: true });

  // Process asynchronously
  processWebhookAsync(req.body).catch((error) => {
    logger.error("Failed to process webhook", { error });
  });
});
```

### Webhook Timeout

Keep webhook processing fast (< 5 seconds):

```typescript
app.post("/webhooks/reconcile", async (req, res) => {
  res.json({ received: true });

  // Process in background
  setImmediate(async () => {
    try {
      await processWebhook(req.body);
    } catch (error) {
      logger.error("Webhook processing error", { error });
    }
  });
});
```

---

## Testing

### Use Test API Keys

```typescript
const settler = new Settler({
  apiKey: process.env.SETTLER_TEST_API_KEY, // sk_test_...
});
```

### Mock Settler API in Tests

```typescript
import { vi } from "vitest";

vi.mock("@settler/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    jobs: {
      create: vi.fn().mockResolvedValue({
        data: { id: "job_test_123", status: "active" },
      }),
      get: vi.fn().mockResolvedValue({
        data: { id: "job_test_123", status: "active" },
      }),
    },
  })),
}));
```

### Test Error Scenarios

```typescript
import { SettlerError } from "@settler/sdk";

test("handles rate limit error", async () => {
  const error = new SettlerError("RateLimitError", "Rate limit exceeded", {
    retryAfter: 60,
  });

  const result = await handleError(error);
  expect(result.retryAfter).toBe(60);
});
```

---

## Monitoring

### Log API Requests

```typescript
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

### Monitor Reconciliation Metrics

```typescript
async function monitorReconciliation(jobId: string) {
  const report = await settler.reports.get(jobId);
  const { matched, unmatched, errors, accuracy } = report.data.summary;

  // Send to metrics service
  metrics.gauge("settler.matched", matched);
  metrics.gauge("settler.unmatched", unmatched);
  metrics.gauge("settler.errors", errors);
  metrics.gauge("settler.accuracy", accuracy);

  // Alert on low accuracy
  if (accuracy < 95) {
    await alert({
      level: "warning",
      message: `Reconciliation accuracy: ${accuracy}%`,
      jobId,
    });
  }
}
```

---

## Summary

**Key Takeaways:**

1. ✅ Use environment variables for API keys
2. ✅ Handle errors gracefully with retry logic
3. ✅ Monitor rate limits and implement backoff
4. ✅ Use webhooks instead of polling
5. ✅ Cache responses when possible
6. ✅ Verify webhook signatures
7. ✅ Use HTTPS for webhooks
8. ✅ Implement idempotency for webhooks
9. ✅ Test with test API keys
10. ✅ Monitor reconciliation metrics

---

**Questions?** Check out our [documentation](https://docs.settler.io) or ask in [Discord](https://discord.gg/settler).

---

**Last Updated:** 2026-01-15
