# Settler API Documentation

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
curl -H "X-API-Key: rk_your_api_key_here" https://api.settler.io/api/v1/jobs
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
      "id": "uuid",
      "name": "Shopify-Stripe Reconciliation",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z"
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
GET /api/v1/jobs/{id}
```

#### Create Job

```http
POST /api/v1/jobs
Content-Type: application/json

{
  "name": "My Reconciliation Job",
  "source": {
    "adapter": "stripe",
    "config": {
      "apiKey": "sk_..."
    }
  },
  "target": {
    "adapter": "shopify",
    "config": {
      "apiKey": "..."
    }
  },
  "rules": {
    "matching": [
      {
        "field": "order_id",
        "type": "exact"
      }
    ]
  }
}
```

#### Run Job

```http
POST /api/v1/jobs/{id}/run
```

### Reports

#### Get Report

```http
GET /api/v1/reports/{jobId}
```

**Response:**

```json
{
  "data": {
    "jobId": "uuid",
    "summary": {
      "matched": 1250,
      "unmatched_source": 5,
      "unmatched_target": 3,
      "accuracy": 99.4
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Webhooks

#### List Webhooks

```http
GET /api/v1/webhooks
```

#### Create Webhook

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/settler",
  "events": ["reconciliation.completed", "reconciliation.failed"]
}
```

### Health

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
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All errors follow a standardized format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {},
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

## Rate Limiting

- Default: 1000 requests per 15 minutes per API key
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

List endpoints support cursor-based pagination:

```http
GET /api/v1/jobs?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMSIsImlkIjoiMTIzIn0=&limit=20
```

**Response includes:**

- `nextCursor` - Cursor for next page
- `prevCursor` - Cursor for previous page
- `hasMore` - Boolean indicating more results

## Webhooks

Webhooks are delivered via HTTP POST with signature verification:

```http
POST https://your-app.com/webhooks/settler
X-Webhook-Signature: sha256=...
X-Webhook-Timestamp: 1234567890
Content-Type: application/json

{
  "event": "reconciliation.completed",
  "data": {
    "jobId": "uuid",
    "summary": {...}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Signature Verification:**

The signature is computed as:

```
HMAC-SHA256(timestamp + "." + JSON.stringify(payload), webhook_secret)
```

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

See [SDK Documentation](./sdk.md) for usage examples.

## Support

- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Issues:** [GitHub Issues](https://github.com/settler/settler/issues)
- **Email:** support@settler.io
