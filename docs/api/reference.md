# Complete API Reference

**Settler.dev REST API - Complete endpoint documentation**

> Reality note: this reference includes representative endpoint patterns. For route-family truth (auth + tenant classes and mounted paths), use `docs/api/route-classes.md`, `docs/api/route-families.md`, and `docs/api/route-inventory.md` generated from live route inventory.

---

## Base URL

- **Production:** `https://api.settler.io/api/v1`
- **Staging:** `https://api-staging.settler.io/api/v1`
- **Local:** `http://localhost:3000/api/v1`

---

## Authentication

All API requests require authentication via API key.

### API Key Authentication

Include your API key in the `Authorization` header:

```http
Authorization: Bearer sk_live_your_api_key_here
```

Or use the `X-API-Key` header:

```http
X-API-Key: sk_live_your_api_key_here
```

### Getting Your API Key

1. Sign in to [Settler Dashboard](https://settler.io/dashboard)
2. Navigate to **Settings → API Keys**
3. Click **"Create API Key"**
4. Copy and store securely

**⚠️ Security:** Never commit API keys to version control. Use environment variables.

---

## Rate Limits

| Plan       | Limit          | Window     |
| ---------- | -------------- | ---------- |
| Free       | 100 requests   | 15 minutes |
| Commercial | 2,000 requests | 15 minutes |
| Enterprise | Custom         | Custom     |

Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "traceId": "unique-trace-id",
    "field": "additional context"
  }
}
```

See [Error Handling Guide](../error-handling.md) for complete error codes and handling.

---

## Jobs API

### Create Reconciliation Job

**Endpoint:** `POST /api/v1/jobs`

**Request:**

```json
{
  "name": "Shopify-Stripe Reconciliation",
  "source": {
    "adapter": "shopify",
    "config": {
      "apiKey": "your_shopify_api_key",
      "shopDomain": "your-shop.myshopify.com"
    }
  },
  "target": {
    "adapter": "stripe",
    "config": {
      "apiKey": "your_stripe_secret_key"
    }
  },
  "rules": {
    "matching": [
      { "field": "order_id", "type": "exact" },
      { "field": "amount", "type": "range", "tolerance": 0.01 },
      { "field": "date", "type": "range", "days": 1 }
    ],
    "conflictResolution": "last-wins"
  },
  "schedule": "0 2 * * *"
}
```

**Response:**

```json
{
  "data": {
    "id": "job_123",
    "name": "Shopify-Stripe Reconciliation",
    "status": "pending",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### Get Job

**Endpoint:** `GET /api/v1/jobs/:id`

**Response:**

```json
{
  "data": {
    "id": "job_123",
    "name": "Shopify-Stripe Reconciliation",
    "status": "completed",
    "source": {
      /* ... */
    },
    "target": {
      /* ... */
    },
    "rules": {
      /* ... */
    },
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

### List Jobs

**Endpoint:** `GET /api/v1/jobs?page=1&limit=20`

**Query Parameters:**

- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page

**Response:**

```json
{
  "data": [
    {
      "id": "job_123",
      "name": "Shopify-Stripe Reconciliation",
      "status": "completed",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Run Job

**Endpoint:** `POST /api/v1/jobs/:id/run`

**Response:**

```json
{
  "data": {
    "executionId": "exec_456",
    "status": "running",
    "startedAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### Delete Job

**Endpoint:** `DELETE /api/v1/jobs/:id`

**Response:**

```json
{
  "message": "Job deleted successfully"
}
```

---

## Reports API

### Get Reconciliation Report

**Endpoint:** `GET /api/v1/reports/:jobId?startDate=2026-01-01&endDate=2026-01-31&format=json&page=1&limit=100`

**Query Parameters:**

- `startDate` (string, ISO 8601) - Start date for report
- `endDate` (string, ISO 8601) - End date for report
- `format` (string, enum: "json", "csv") - Response format
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 100) - Items per page

**Response:**

```json
{
  "data": {
    "jobId": "job_123",
    "executionId": "exec_456",
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
        "id": "match_789",
        "sourceId": "order_123",
        "targetId": "payment_456",
        "amount": 99.99,
        "currency": "USD",
        "confidence": 1.0,
        "matchedAt": "2026-01-15T10:30:00Z"
      }
    ],
    "unmatched": [
      {
        "id": "unmatched_101",
        "sourceId": "order_124",
        "targetId": null,
        "amount": 49.99,
        "currency": "USD",
        "reason": "No matching transaction found"
      }
    ],
    "errors": [
      {
        "id": "error_202",
        "message": "Adapter connection failed",
        "timestamp": "2026-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 149,
      "totalPages": 2
    },
    "generatedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

### List Reports

**Endpoint:** `GET /api/v1/reports?page=1&limit=20`

**Response:**

```json
{
  "data": [
    {
      "id": "report_123",
      "jobId": "job_123",
      "summary": {
        "matched": 145,
        "unmatched": 3
      },
      "generatedAt": "2026-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

## Exports API

### Create Export

**Endpoint:** `POST /api/v1/exports`

**Request:**

```json
{
  "jobId": "job_123",
  "format": "pdf"
}
```

**Supported Formats:**

- `csv` - CSV export
- `json` - JSON export
- `pdf` - PDF report (includes summary, matches, unmatched, errors)

**Response (PDF/CSV - streamed directly):**

- Content-Type: `application/pdf` or `text/csv`
- Content-Disposition: `attachment; filename="reconciliation_job_123_1234567890.pdf"`
- Body: File stream

**Response (JSON):**

```json
{
  "data": {
    "exportId": "export_789",
    "jobId": "job_123",
    "format": "json",
    "downloadUrl": "/api/v1/exports/export_789/download",
    "expiresAt": "2026-01-16T11:00:00Z"
  }
}
```

---

## Webhooks API

### Create Webhook

**Endpoint:** `POST /api/v1/webhooks`

**Request:**

```json
{
  "url": "https://your-app.com/webhooks/settler",
  "events": ["reconciliation.completed", "reconciliation.mismatch", "reconciliation.error"],
  "secret": "your_webhook_secret"
}
```

**Response:**

```json
{
  "data": {
    "id": "webhook_123",
    "url": "https://your-app.com/webhooks/settler",
    "events": ["reconciliation.completed", "reconciliation.mismatch"],
    "secret": "whsec_...",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### List Webhooks

**Endpoint:** `GET /api/v1/webhooks`

**Response:**

```json
{
  "data": [
    {
      "id": "webhook_123",
      "url": "https://your-app.com/webhooks/settler",
      "events": ["reconciliation.completed"],
      "status": "active",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### Delete Webhook

**Endpoint:** `DELETE /api/v1/webhooks/:id`

**Response:**

```json
{
  "message": "Webhook deleted successfully"
}
```

---

## Exceptions API

### List Exceptions

**Endpoint:** `GET /api/v1/exceptions?jobId=job_123&resolution_status=open&page=1&limit=100`

**Query Parameters:**

- `jobId` (string, UUID) - Filter by job ID
- `resolution_status` (string, enum: "open", "resolved", "escalated") - Filter by status
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 100) - Items per page

**Response:**

```json
{
  "data": [
    {
      "id": "exception_123",
      "jobId": "job_123",
      "sourceId": "order_124",
      "targetId": null,
      "amount": 49.99,
      "currency": "USD",
      "reason": "No matching transaction found",
      "confidence": 0.0,
      "resolution_status": "open",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### Resolve Exception

**Endpoint:** `POST /api/v1/exceptions/:id/resolve`

**Request:**

```json
{
  "resolution": "auto-match",
  "notes": "Matched after processing delay"
}
```

**Response:**

```json
{
  "data": {
    "id": "exception_123",
    "resolution_status": "resolved",
    "resolvedAt": "2026-01-15T11:00:00Z"
  }
}
```

---

## Currency API

### Get FX Rate

**Endpoint:** `GET /api/v1/currency/fx-rate?fromCurrency=EUR&toCurrency=USD&date=2026-01-15`

**Query Parameters:**

- `fromCurrency` (string, required) - Source currency (ISO 4217)
- `toCurrency` (string, required) - Target currency (ISO 4217)
- `date` (string, ISO 8601, optional) - Historical date

**Response:**

```json
{
  "data": {
    "fromCurrency": "EUR",
    "toCurrency": "USD",
    "rate": 1.08,
    "date": "2026-01-15T00:00:00Z",
    "provider": "ECB"
  }
}
```

---

### Convert Currency

**Endpoint:** `POST /api/v1/currency/convert`

**Request:**

```json
{
  "amount": {
    "value": 100,
    "currency": "EUR"
  },
  "toCurrency": "USD",
  "date": "2026-01-15T00:00:00Z"
}
```

**Response:**

```json
{
  "data": {
    "original": {
      "value": 100,
      "currency": "EUR"
    },
    "converted": {
      "value": 108,
      "currency": "USD"
    },
    "rate": 1.08,
    "provider": "ECB"
  }
}
```

---

### Get Base Currency

**Endpoint:** `GET /api/v1/currency/base-currency`

**Response:**

```json
{
  "data": {
    "baseCurrency": "USD"
  }
}
```

---

### Get All FX Rates

**Endpoint:** `GET /api/v1/currency/fx-rates?date=2026-01-15`

**Response:**

```json
{
  "data": {
    "rates": [
      {
        "fromCurrency": "USD",
        "toCurrency": "EUR",
        "rate": 0.93,
        "rateDate": "2026-01-15T00:00:00Z",
        "provider": "ECB"
      }
    ]
  }
}
```

---

### Sync FX Rates

**Endpoint:** `POST /api/v1/currency/sync-rates`

**Request:**

```json
{
  "baseCurrency": "USD",
  "date": "2026-01-15T00:00:00Z"
}
```

**Response:**

```json
{
  "data": {
    "syncedCount": 7,
    "baseCurrency": "USD",
    "date": "2026-01-15T00:00:00Z",
    "message": "Synced 7 FX rates from external provider"
  }
}
```

---

## Adapters API

### Test Adapter Connection

**Endpoint:** `POST /api/v1/adapters/test`

**Request:**

```json
{
  "adapter": "stripe",
  "config": {
    "apiKey": "sk_test_..."
  }
}
```

**Response:**

```json
{
  "data": {
    "success": true,
    "adapter": "stripe",
    "message": "Connection successful"
  }
}
```

---

## Health API

### Health Check

**Endpoint:** `GET /api/v1/health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00Z",
  "service": "settler-api",
  "version": "1.0.0"
}
```

---

## Request/Response Examples

### Complete Example: Create and Run Job

```bash
# 1. Create job
curl -X POST https://api.settler.io/api/v1/jobs \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Reconciliation",
    "source": {
      "adapter": "shopify",
      "config": {
        "apiKey": "your_shopify_key",
        "shopDomain": "your-shop.myshopify.com"
      }
    },
    "target": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_live_your_stripe_key"
      }
    },
    "rules": {
      "matching": [
        { "field": "order_id", "type": "exact" },
        { "field": "amount", "type": "range", "tolerance": 0.01 }
      ]
    }
  }'

# 2. Run job
curl -X POST https://api.settler.io/api/v1/jobs/job_123/run \
  -H "Authorization: Bearer sk_live_your_api_key"

# 3. Get report
curl https://api.settler.io/api/v1/reports/job_123 \
  -H "Authorization: Bearer sk_live_your_api_key"
```

---

## SDK Usage

### TypeScript/JavaScript SDK

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create job
const job = await settler.jobs.create({
  name: "Daily Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      /* ... */
    },
  },
  target: {
    adapter: "stripe",
    config: {
      /* ... */
    },
  },
  rules: {
    matching: [
      /* ... */
    ],
  },
});

// Run job
const execution = await settler.jobs.run(job.data.id);

// Get report
const report = await settler.reports.get(job.data.id);
```

---

## Webhook Events

### Event Types

- `reconciliation.completed` - Reconciliation job completed
- `reconciliation.mismatch` - Unmatched transaction found
- `reconciliation.error` - Reconciliation job failed
- `reconciliation.started` - Reconciliation job started
- `exception.created` - New exception created
- `exception.resolved` - Exception resolved

### Webhook Payload

```json
{
  "event": "reconciliation.completed",
  "data": {
    "jobId": "job_123",
    "executionId": "exec_456",
    "summary": {
      "matched": 145,
      "unmatched": 3,
      "accuracy": 98.7
    },
    "completedAt": "2026-01-15T10:30:00Z"
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### Webhook Signature Verification

```typescript
import crypto from "crypto";

function verifyWebhookSignature(signature: string, payload: string, secret: string): boolean {
  const [timestamp, hash] = signature.split(",");
  const [t, v1] = hash.split("=");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp.split("=")[1]}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**

- `page` (integer, default: 1) - Page number (1-indexed)
- `limit` (integer, default: 20, max: 1000) - Items per page

**Response:**

```json
{
  "data": [
    /* ... */
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

---

## Filtering & Sorting

### Date Range Filtering

Most endpoints support date range filtering:

```
?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z
```

### Status Filtering

```
?status=completed
?resolution_status=open
```

---

## Rate Limiting

When rate limit is exceeded:

**Response:**

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetAt": "2026-01-15T10:45:00Z",
    "traceId": "trace_123"
  }
}
```

**Headers:**

- `Retry-After: 900` (seconds until reset)

---

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:

- **JSON:** `/api/v1/openapi.json`
- **Swagger UI:** `/api/v1/docs` (if enabled)

---

## Additional Resources

- [API Quick Start Guide](../api-quick-start.md)
- [Error Handling Guide](../error-handling.md)
- [Webhook Setup Guide](../webhook-setup.md)
- [Matching Rules Documentation](../matching-rules.md)
- [Common Workflows](../WORKFLOWS.md)

---

**Last Updated:** January 2026  
**API Version:** v1
