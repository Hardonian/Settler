# Settler API Reference

Complete API reference for the Settler Reconciliation API.

## Base URL

- **Production:** `https://api.settler.io`
- **Staging:** `https://api-staging.settler.io`
- **Local:** `http://localhost:3000`

## Authentication

Settler API supports two authentication methods:

### API Key Authentication

Include your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: sk_your_api_key" https://api.settler.io/api/v1/jobs
```

### JWT Token Authentication

Include your JWT token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer your_jwt_token" https://api.settler.io/api/v1/jobs
```

**Getting a JWT Token:**

```bash
# Login
curl -X POST https://api.settler.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response includes accessToken and refreshToken
```

## API Versioning

The API uses URL versioning:

- `/api/v1/` - Current stable version
- `/api/v2/` - Future version (currently mirrors v1)

## Rate Limiting

Rate limits are tier-based:

| Tier | RPM | Concurrent Jobs | Monthly Recons |
|------|-----|----------------|----------------|
| Free | 100 | 1 | 100 |
| Starter | 1,000 | 5 | 10,000 |
| Pro | 10,000 | 20 | 100,000 |
| Business | 50,000 | 100 | 1,000,000 |
| Enterprise | 1,000,000 | 1,000 | Unlimited |

Rate limit headers:
- `X-RateLimit-Limit` - Request limit per minute
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time (Unix timestamp)

## Endpoints

### Jobs

#### List Jobs

```http
GET /api/v1/jobs?page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": "job_1234567890",
      "userId": "user_123",
      "name": "Shopify-Stripe Reconciliation",
      "status": "active",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### Get Job

```http
GET /api/v1/jobs/:id
```

#### Create Job

```http
POST /api/v1/jobs
Content-Type: application/json
X-API-Key: sk_your_api_key

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
      "apiKey": "sk_your_stripe_secret_key"
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

**Response:**

```json
{
  "data": {
    "id": "job_1234567890",
    "userId": "user_123",
    "name": "Shopify-Stripe Reconciliation",
    "source": { ... },
    "target": { ... },
    "rules": { ... },
    "schedule": "0 2 * * *",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  },
  "message": "Reconciliation job created successfully"
}
```

#### Run Job

```http
POST /api/v1/jobs/:id/run
X-API-Key: sk_your_api_key
```

**Response:**

```json
{
  "data": {
    "id": "exec_1234567890",
    "jobId": "job_1234567890",
    "status": "running",
    "startedAt": "2026-01-15T10:00:00Z"
  },
  "message": "Job execution started"
}
```

#### Delete Job

```http
DELETE /api/v1/jobs/:id
X-API-Key: sk_your_api_key
```

### Reports

#### Get Reconciliation Report

```http
GET /api/v1/reports/:jobId?startDate=2026-01-01&endDate=2026-01-31&format=json
X-API-Key: sk_your_api_key
```

**Response:**

```json
{
  "data": {
    "jobId": "job_1234567890",
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

#### List Reports

```http
GET /api/v1/reports
X-API-Key: sk_your_api_key
```

### Webhooks

#### Create Webhook

```http
POST /api/v1/webhooks
Content-Type: application/json
X-API-Key: sk_your_api_key

{
  "url": "https://your-app.com/webhooks/reconcile",
  "events": [
    "reconciliation.matched",
    "reconciliation.mismatch",
    "reconciliation.error"
  ],
  "secret": "optional_webhook_secret"
}
```

**Response:**

```json
{
  "data": {
    "id": "wh_1234567890",
    "userId": "user_123",
    "url": "https://your-app.com/webhooks/reconcile",
    "events": ["reconciliation.matched", "reconciliation.mismatch"],
    "secret": "whsec_abc123",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "message": "Webhook created successfully"
}
```

#### List Webhooks

```http
GET /api/v1/webhooks
X-API-Key: sk_your_api_key
```

#### Webhook Events

- `reconciliation.matched` - Transaction matched successfully
- `reconciliation.mismatch` - Transaction mismatch detected
- `reconciliation.error` - Reconciliation error occurred
- `reconciliation.completed` - Reconciliation job completed
- `reconciliation.failed` - Reconciliation job failed

#### Webhook Signature Verification

Webhooks are signed with HMAC-SHA256. Verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Adapters

#### List Adapters

```http
GET /api/v1/adapters
X-API-Key: sk_your_api_key
```

**Response:**

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

#### Get Adapter

```http
GET /api/v1/adapters/:id
X-API-Key: sk_your_api_key
```

### Health Checks

#### Basic Health Check

```http
GET /health
```

#### Detailed Health Check

```http
GET /health/detailed
```

**Response:**

```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "redis": {
      "status": "healthy",
      "latency": 2
    },
    "sentry": {
      "status": "healthy"
    }
  },
  "timestamp": "2026-01-15T10:00:00Z"
}
```

## Error Responses

All errors follow a standardized format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ],
  "traceId": "trace-id-for-debugging"
}
```

### Error Codes

- `VALIDATION_ERROR` (400) - Invalid input
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## Pagination

List endpoints support cursor-based pagination:

```http
GET /api/v1/jobs?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMSIsImlkIjoiMTIzIn0=&limit=20
```

**Response includes:**

- `nextCursor` - Cursor for next page
- `prevCursor` - Cursor for previous page
- `hasMore` - Boolean indicating more results

## OpenAPI Specification

Complete OpenAPI 3.0 specification available at:

- JSON: `/api/v1/openapi.json`
- Swagger UI: `/api/v1/docs`

## SDKs

Official SDKs available:

- **TypeScript/JavaScript:** `npm install @settler/sdk`
- **Python:** `pip install settler-sdk`
- **Go:** `go get github.com/settler/settler-go`
- **Ruby:** `gem install settler`

See [API Quick Start Guide](./api-quick-start.md) for usage examples.

## Support

- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Issues:** [GitHub Issues](https://github.com/shardie-github/Settler-API/issues)
- **Email:** support@settler.io
