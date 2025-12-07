# Settler API Reference

Complete, comprehensive API reference for Settler Reconciliation-as-a-Service. Every endpoint, every parameter, every response type.

**Base URL:** `https://api.settler.io`  
**API Version:** `v1`  
**Content-Type:** `application/json`

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Errors](#errors)
- [Jobs](#jobs)
- [Reports](#reports)
- [Webhooks](#webhooks)
- [Adapters](#adapters)
- [Health](#health)

---

## Authentication

All API requests require authentication. Settler supports two authentication methods:

### API Key (Recommended)

Include your API key in the `X-API-Key` header:

```bash
curl https://api.settler.io/api/v1/jobs \
  -H "X-API-Key: sk_live_abc123..."
```

**Getting Your API Key:**

1. Sign up at [settler.io](https://settler.io)
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy and store securely (shown only once)

**API Key Types:**

- `sk_live_...` — Production API key
- `sk_test_...` — Test API key (sandbox mode)

### Bearer Token (JWT)

Include a Bearer token in the `Authorization` header:

```bash
curl https://api.settler.io/api/v1/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Getting a JWT Token:**
Use the `/api/v1/auth/token` endpoint with your API key to exchange for a JWT token.

---

## Rate Limits

Settler enforces rate limits to ensure fair usage and system stability.

**Default Limits:**

- **Free Tier:** 100 requests per 15 minutes
- **Starter:** 500 requests per 15 minutes
- **Growth:** 2,000 requests per 15 minutes
- **Scale:** 10,000 requests per 15 minutes
- **Enterprise:** Custom limits

**Rate Limit Headers:**
Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**Rate Limit Exceeded:**
When rate limit is exceeded, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded. Retry after 2026-01-15T10:15:00Z",
  "retryAfter": 1640995200
}
```

**Best Practices:**

- Implement exponential backoff
- Cache responses when possible
- Use webhooks instead of polling
- Monitor rate limit headers

---

## Errors

Settler uses standard HTTP status codes and returns detailed error information.

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Invalid request parameters",
  "details": [
    {
      "field": "source.adapter",
      "message": "Adapter 'invalid' is not supported",
      "code": "INVALID_ADAPTER"
    }
  ],
  "requestId": "req_abc123",
  "timestamp": "2026-01-15T10:00:00Z"
}
```

### Error Types

| Status Code | Error Type                | Description                                  |
| ----------- | ------------------------- | -------------------------------------------- |
| `400`       | `ValidationError`         | Invalid request parameters                   |
| `401`       | `UnauthorizedError`       | Missing or invalid authentication            |
| `403`       | `ForbiddenError`          | Insufficient permissions                     |
| `404`       | `NotFoundError`           | Resource not found                           |
| `409`       | `ConflictError`           | Resource conflict (e.g., duplicate job name) |
| `429`       | `RateLimitError`          | Rate limit exceeded                          |
| `500`       | `InternalError`           | Internal server error                        |
| `503`       | `ServiceUnavailableError` | Service temporarily unavailable              |

### Error Codes

| Code                  | Description                   |
| --------------------- | ----------------------------- |
| `INVALID_ADAPTER`     | Adapter not supported         |
| `INVALID_CONFIG`      | Adapter configuration invalid |
| `INVALID_RULE`        | Matching rule invalid         |
| `JOB_NOT_FOUND`       | Job ID not found              |
| `REPORT_NOT_FOUND`    | Report not found              |
| `WEBHOOK_NOT_FOUND`   | Webhook not found             |
| `ADAPTER_ERROR`       | Adapter execution error       |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded           |
| `QUOTA_EXCEEDED`      | Usage quota exceeded          |

### Handling Errors

**TypeScript SDK:**

```typescript
import Settler from "@settler/sdk";

try {
  const job = await settler.jobs.create({...});
} catch (error) {
  if (error instanceof Settler.ValidationError) {
    console.error("Validation error:", error.details);
  } else if (error instanceof Settler.RateLimitError) {
    // Retry after error.retryAfter
  } else {
    console.error("Unexpected error:", error);
  }
}
```

**cURL:**

```bash
curl -X POST https://api.settler.io/api/v1/jobs \
  -H "X-API-Key: sk_..." \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## Jobs

Reconciliation jobs define how data from one platform (source) is reconciled with another (target).

### Create Job

Create a new reconciliation job.

**Endpoint:** `POST /api/v1/jobs`

**Request:**

```json
{
  "name": "Shopify-Stripe Reconciliation",
  "source": {
    "adapter": "shopify",
    "config": {
      "apiKey": "shpat_abc123...",
      "shopDomain": "your-shop.myshopify.com"
    }
  },
  "target": {
    "adapter": "stripe",
    "config": {
      "apiKey": "sk_live_abc123..."
    }
  },
  "rules": {
    "matching": [
      {
        "field": "order_id",
        "type": "exact"
      },
      {
        "field": "amount",
        "type": "exact",
        "tolerance": 0.01
      },
      {
        "field": "date",
        "type": "range",
        "days": 1
      }
    ],
    "conflictResolution": "last-wins"
  },
  "schedule": "0 2 * * *"
}
```

**Parameters:**

| Field      | Type          | Required | Description                        |
| ---------- | ------------- | -------- | ---------------------------------- |
| `name`     | string        | Yes      | Job name (max 255 chars)           |
| `source`   | AdapterConfig | Yes      | Source adapter configuration       |
| `target`   | AdapterConfig | Yes      | Target adapter configuration       |
| `rules`    | MatchingRules | Yes      | Matching rules                     |
| `schedule` | string        | No       | Cron expression for scheduled runs |

**AdapterConfig:**

```typescript
{
  adapter: string;        // Adapter ID (e.g., "stripe", "shopify")
  config: {
    [key: string]: any;   // Adapter-specific configuration
  };
}
```

**MatchingRules:**

```typescript
{
  matching: MatchingRule[];
  conflictResolution?: "first-wins" | "last-wins" | "manual-review";
}
```

**MatchingRule:**

```typescript
{
  field: string;                    // Field to match (e.g., "order_id", "amount")
  type: "exact" | "fuzzy" | "range";
  tolerance?: number;               // For "exact" type (e.g., 0.01 for amounts)
  days?: number;                    // For "range" type (date range in days)
  threshold?: number;               // For "fuzzy" type (0-1, similarity threshold)
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "job_abc123",
    "userId": "user_xyz789",
    "name": "Shopify-Stripe Reconciliation",
    "source": {
      "adapter": "shopify",
      "config": {
        "apiKey": "shpat_***",
        "shopDomain": "your-shop.myshopify.com"
      }
    },
    "target": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_live_***"
      }
    },
    "rules": {
      "matching": [
        {
          "field": "order_id",
          "type": "exact"
        },
        {
          "field": "amount",
          "type": "exact",
          "tolerance": 0.01
        },
        {
          "field": "date",
          "type": "range",
          "days": 1
        }
      ],
      "conflictResolution": "last-wins"
    },
    "schedule": "0 2 * * *",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  },
  "message": "Reconciliation job created successfully"
}
```

**Example:**

```bash
curl -X POST https://api.settler.io/api/v1/jobs \
  -H "X-API-Key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shopify-Stripe Reconciliation",
    "source": {
      "adapter": "shopify",
      "config": {
        "apiKey": "shpat_abc123...",
        "shopDomain": "your-shop.myshopify.com"
      }
    },
    "target": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_live_abc123..."
      }
    },
    "rules": {
      "matching": [
        {"field": "order_id", "type": "exact"},
        {"field": "amount", "type": "exact", "tolerance": 0.01}
      ],
      "conflictResolution": "last-wins"
    }
  }'
```

**TypeScript:**

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({ apiKey: "sk_live_abc123..." });

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
    ],
    conflictResolution: "last-wins",
  },
});

console.log("Job created:", job.data.id);
```

---

### List Jobs

List all reconciliation jobs for your account.

**Endpoint:** `GET /api/v1/jobs`

**Query Parameters:**

| Parameter | Type   | Description                                       |
| --------- | ------ | ------------------------------------------------- |
| `limit`   | number | Number of results (default: 20, max: 100)         |
| `offset`  | number | Pagination offset (default: 0)                    |
| `status`  | string | Filter by status (`active`, `paused`, `archived`) |
| `adapter` | string | Filter by adapter (e.g., `stripe`, `shopify`)     |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "job_abc123",
      "userId": "user_xyz789",
      "name": "Shopify-Stripe Reconciliation",
      "status": "active",
      "source": {
        "adapter": "shopify"
      },
      "target": {
        "adapter": "stripe"
      },
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

**Example:**

```bash
curl https://api.settler.io/api/v1/jobs?limit=10&status=active \
  -H "X-API-Key: sk_live_abc123..."
```

**TypeScript:**

```typescript
const jobs = await settler.jobs.list({ limit: 10, status: "active" });
console.log(`Found ${jobs.count} jobs`);
```

---

### Get Job

Get details of a specific reconciliation job.

**Endpoint:** `GET /api/v1/jobs/:id`

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Job ID      |

**Response:** `200 OK`

```json
{
  "data": {
    "id": "job_abc123",
    "userId": "user_xyz789",
    "name": "Shopify-Stripe Reconciliation",
    "source": {
      "adapter": "shopify",
      "config": {
        "apiKey": "shpat_***",
        "shopDomain": "your-shop.myshopify.com"
      }
    },
    "target": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_live_***"
      }
    },
    "rules": {
      "matching": [
        {
          "field": "order_id",
          "type": "exact"
        },
        {
          "field": "amount",
          "type": "exact",
          "tolerance": 0.01
        }
      ],
      "conflictResolution": "last-wins"
    },
    "schedule": "0 2 * * *",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

**Example:**

```bash
curl https://api.settler.io/api/v1/jobs/job_abc123 \
  -H "X-API-Key: sk_live_abc123..."
```

**TypeScript:**

```typescript
const job = await settler.jobs.get("job_abc123");
console.log("Job name:", job.data.name);
```

---

### Update Job

Update an existing reconciliation job.

**Endpoint:** `PATCH /api/v1/jobs/:id`

**Request:**

```json
{
  "name": "Updated Job Name",
  "rules": {
    "matching": [
      {
        "field": "order_id",
        "type": "exact"
      }
    ]
  },
  "status": "paused"
}
```

**Parameters:**

All parameters are optional. Only include fields you want to update.

**Response:** `200 OK`

Returns updated job object.

**Example:**

```bash
curl -X PATCH https://api.settler.io/api/v1/jobs/job_abc123 \
  -H "X-API-Key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'
```

**TypeScript:**

```typescript
const updated = await settler.jobs.update("job_abc123", {
  status: "paused",
});
```

---

### Run Job

Manually trigger a reconciliation job execution.

**Endpoint:** `POST /api/v1/jobs/:id/run`

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Job ID      |

**Query Parameters:**

| Parameter   | Type   | Description                                                   |
| ----------- | ------ | ------------------------------------------------------------- |
| `dateRange` | string | Optional date range (ISO 8601, e.g., `2026-01-01/2026-01-31`) |

**Response:** `202 Accepted`

```json
{
  "data": {
    "id": "exec_xyz789",
    "jobId": "job_abc123",
    "status": "running",
    "startedAt": "2026-01-15T10:00:00Z"
  },
  "message": "Job execution started"
}
```

**Example:**

```bash
curl -X POST https://api.settler.io/api/v1/jobs/job_abc123/run \
  -H "X-API-Key: sk_live_abc123..."
```

**TypeScript:**

```typescript
const execution = await settler.jobs.run("job_abc123");
console.log("Execution ID:", execution.data.id);
```

---

### Delete Job

Delete a reconciliation job.

**Endpoint:** `DELETE /api/v1/jobs/:id`

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Job ID      |

**Response:** `204 No Content`

**Example:**

```bash
curl -X DELETE https://api.settler.io/api/v1/jobs/job_abc123 \
  -H "X-API-Key: sk_live_abc123..."
```

**TypeScript:**

```typescript
await settler.jobs.delete("job_abc123");
```

---

## Reports

Reconciliation reports contain the results of job executions.

### Get Report

Get a reconciliation report for a specific job.

**Endpoint:** `GET /api/v1/reports/:jobId`

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `jobId`   | string | Job ID      |

**Query Parameters:**

| Parameter          | Type    | Description                               |
| ------------------ | ------- | ----------------------------------------- |
| `startDate`        | string  | Start date (ISO 8601, e.g., `2026-01-01`) |
| `endDate`          | string  | End date (ISO 8601, e.g., `2026-01-31`)   |
| `format`           | string  | Response format (`json`, `csv`)           |
| `includeMatches`   | boolean | Include matched items (default: `true`)   |
| `includeUnmatched` | boolean | Include unmatched items (default: `true`) |
| `includeErrors`    | boolean | Include errors (default: `true`)          |

**Response:** `200 OK`

```json
{
  "data": {
    "jobId": "job_abc123",
    "dateRange": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-31T23:59:59Z"
    },
    "summary": {
      "matched": 145,
      "unmatched": 3,
      "errors": 1,
      "accuracy": 98.7,
      "totalTransactions": 149
    },
    "matches": [
      {
        "id": "match_1",
        "sourceId": "order_123",
        "targetId": "payment_456",
        "amount": 99.99,
        "currency": "USD",
        "matchedAt": "2026-01-15T10:00:00Z",
        "confidence": 1.0
      }
    ],
    "unmatched": [
      {
        "id": "unmatch_1",
        "sourceId": "order_789",
        "amount": 49.99,
        "currency": "USD",
        "reason": "No matching payment found"
      }
    ],
    "errors": [
      {
        "id": "error_1",
        "message": "Webhook timeout",
        "occurredAt": "2026-01-15T10:00:00Z"
      }
    ],
    "generatedAt": "2026-01-15T10:00:00Z"
  }
}
```

**Example:**

```bash
curl "https://api.settler.io/api/v1/reports/job_abc123?startDate=2026-01-01&endDate=2026-01-31" \
  -H "X-API-Key: sk_live_abc123..."
```

**TypeScript:**

```typescript
const report = await settler.reports.get("job_abc123", {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

---

### List Reports

List all reports for your account.

**Endpoint:** `GET /api/v1/reports`

**Query Parameters:**

| Parameter   | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `limit`     | number | Number of results (default: 20, max: 100) |
| `offset`    | number | Pagination offset (default: 0)            |
| `jobId`     | string | Filter by job ID                          |
| `startDate` | string | Filter by start date                      |
| `endDate`   | string | Filter by end date                        |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "jobId": "job_abc123",
      "summary": {
        "matched": 145,
        "unmatched": 3,
        "errors": 1,
        "accuracy": 98.7
      },
      "generatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

**Example:**

```bash
curl "https://api.settler.io/api/v1/reports?limit=10&jobId=job_abc123" \
  -H "X-API-Key: sk_live_abc123..."
```

**TypeScript:**

```typescript
const reports = await settler.reports.list({ limit: 10 });
```

---

## Webhooks

Webhooks allow you to receive real-time notifications about reconciliation events.

### Create Webhook

Create a new webhook endpoint.

**Endpoint:** `POST /api/v1/webhooks`

**Request:**

```json
{
  "url": "https://your-app.com/webhooks/reconcile",
  "events": ["reconciliation.matched", "reconciliation.mismatch", "reconciliation.error"],
  "secret": "optional_webhook_secret"
}
```

**Parameters:**

| Field    | Type     | Required | Description                     |
| -------- | -------- | -------- | ------------------------------- |
| `url`    | string   | Yes      | Webhook URL (must be HTTPS)     |
| `events` | string[] | Yes      | Events to subscribe to          |
| `secret` | string   | No       | Webhook secret for verification |

**Supported Events:**

- `reconciliation.matched` — Transaction matched successfully
- `reconciliation.mismatch` — Transaction mismatch detected
- `reconciliation.error` — Error occurred during reconciliation
- `reconciliation.completed` — Reconciliation job completed
- `reconciliation.started` — Reconciliation job started

**Response:** `201 Created`

```json
{
  "data": {
    "id": "wh_abc123",
    "userId": "user_xyz789",
    "url": "https://your-app.com/webhooks/reconcile",
    "events": ["reconciliation.matched", "reconciliation.mismatch"],
    "secret": "whsec_xyz789",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "message": "Webhook created successfully"
}
```

**Example:**

```bash
curl -X POST https://api.settler.io/api/v1/webhooks \
  -H "X-API-Key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/reconcile",
    "events": ["reconciliation.matched", "reconciliation.mismatch"]
  }'
```

**TypeScript:**

```typescript
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: ["reconciliation.matched", "reconciliation.mismatch"],
});

console.log("Webhook ID:", webhook.data.id);
console.log("Webhook Secret:", webhook.data.secret);
```

---

### List Webhooks

List all webhooks for your account.

**Endpoint:** `GET /api/v1/webhooks`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://your-app.com/webhooks/reconcile",
      "events": ["reconciliation.matched"],
      "status": "active",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### Get Webhook

Get details of a specific webhook.

**Endpoint:** `GET /api/v1/webhooks/:id`

**Response:** `200 OK`

Returns webhook object.

---

### Update Webhook

Update an existing webhook.

**Endpoint:** `PATCH /api/v1/webhooks/:id`

**Request:**

```json
{
  "url": "https://new-url.com/webhooks/reconcile",
  "events": ["reconciliation.matched"],
  "status": "paused"
}
```

**Response:** `200 OK`

Returns updated webhook object.

---

### Delete Webhook

Delete a webhook.

**Endpoint:** `DELETE /api/v1/webhooks/:id`

**Response:** `204 No Content`

---

### Webhook Payload

When events occur, Settler sends HTTP POST requests to your webhook URL.

**Headers:**

```
X-Settler-Signature: t=1640995200,v1=abc123...
X-Settler-Event: reconciliation.matched
X-Settler-Webhook-Id: wh_abc123
```

**Payload:**

```json
{
  "event": "reconciliation.matched",
  "data": {
    "jobId": "job_abc123",
    "matchId": "match_456",
    "sourceId": "order_123",
    "targetId": "payment_456",
    "amount": 99.99,
    "currency": "USD",
    "matchedAt": "2026-01-15T10:00:00Z"
  },
  "timestamp": "2026-01-15T10:00:00Z"
}
```

**Verification:**

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

---

## Adapters

Adapters connect Settler to external platforms.

### List Adapters

List all available adapters.

**Endpoint:** `GET /api/v1/adapters`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "stripe",
      "name": "Stripe",
      "description": "Reconcile Stripe payments and charges",
      "version": "1.0.0",
      "config": {
        "required": ["apiKey"],
        "optional": ["webhookSecret"]
      },
      "supportedEvents": ["payment.succeeded", "charge.refunded"]
    },
    {
      "id": "shopify",
      "name": "Shopify",
      "description": "Reconcile Shopify orders and transactions",
      "version": "1.0.0",
      "config": {
        "required": ["apiKey", "shopDomain"],
        "optional": ["webhookSecret"]
      },
      "supportedEvents": ["order.created", "order.updated"]
    }
  ],
  "count": 2
}
```

---

### Get Adapter

Get details of a specific adapter.

**Endpoint:** `GET /api/v1/adapters/:id`

**Response:** `200 OK`

Returns adapter object with full configuration details.

---

## Health

Check API health and status.

### Health Check

**Endpoint:** `GET /api/v1/health`

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-15T10:00:00Z"
}
```

---

## SDKs

Official SDKs are available for popular languages:

- **TypeScript/JavaScript:** `npm install @settler/sdk`
- **Python:** `pip install settler-sdk` (coming soon)
- **Ruby:** `gem install settler-sdk` (coming soon)
- **Go:** `go get github.com/settler/settler-go` (coming soon)

See [Developer Toolkit Guide](./developer-toolkit.md) for SDK usage examples.

---

## Support

**Documentation:** [docs.settler.io](https://docs.settler.io)  
**Support Email:** support@settler.io  
**Discord:** [discord.gg/settler](https://discord.gg/settler)  
**GitHub:** [github.com/settler/settler](https://github.com/settler/settler)

---

**Last Updated:** 2026-01-15  
**API Version:** v1
