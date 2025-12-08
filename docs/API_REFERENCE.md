# Settler.dev API Reference

**Version:** 1.0.0  
**Base URL:** `https://api.settler.io/api/v1`

---

## Authentication

All API requests require authentication via API key or JWT token.

### API Key

Include your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: sk_your_api_key" https://api.settler.io/api/v1/recon/jobs
```

### JWT Token

Include a Bearer token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer your_jwt_token" https://api.settler.io/api/v1/recon/jobs
```

---

## Recon Core API

### Create Reconciliation Job

```http
POST /api/v1/recon/jobs
```

**Request Body:**
```json
{
  "name": "Monthly Stripe Reconciliation",
  "description": "Reconcile Stripe payments with internal ledger",
  "sourceAdapter": "stripe",
  "sourceConfigEncrypted": "encrypted_config",
  "targetAdapter": "internal_ledger",
  "targetConfigEncrypted": "encrypted_config",
  "reconStrategy": "deterministic",
  "mappingTemplateId": "template_id",
  "transformRecipeId": "recipe_id",
  "validationRules": [],
  "scheduleCron": "0 0 1 * *",
  "metadata": {}
}
```

**Response:**
```json
{
  "data": {
    "id": "job_id",
    "name": "Monthly Stripe Reconciliation",
    "status": "active",
    "createdAt": "2025-01-20T00:00:00Z"
  }
}
```

### List Reconciliation Jobs

```http
GET /api/v1/recon/jobs?status=active&limit=100&offset=0
```

### Get Reconciliation Job

```http
GET /api/v1/recon/jobs/:jobId
```

### Execute Reconciliation Job

```http
POST /api/v1/recon/jobs/:jobId/execute
```

**Request Body:**
```json
{
  "dryRun": false,
  "skipValidation": false,
  "customRules": []
}
```

### Get Reconciliation Results

```http
GET /api/v1/recon/jobs/:jobId/results
```

### Get Reconciliation Result

```http
GET /api/v1/recon/results/:resultId
```

---

## Webhooks

### Create Webhook

```http
POST /api/v1/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["recon.completed", "recon.failed", "drift.detected"]
}
```

### List Webhooks

```http
GET /api/v1/webhooks
```

### Delete Webhook

```http
DELETE /api/v1/webhooks/:webhookId
```

### Webhook Events

- `recon.completed` - Reconciliation job completed
- `recon.failed` - Reconciliation job failed
- `drift.detected` - Schema drift detected
- `validation.failed` - Validation failed
- `mapping.suggested` - Mapping suggestion available
- `workflow.failed` - Workflow execution failed
- `audit.ready` - Audit report ready

### Webhook Signature Verification

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

---

## Rate Limits

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

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ErrorCode",
  "message": "Human-readable error message",
  "traceId": "correlation_id"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## SDKs

Official SDKs available:

- **JavaScript/TypeScript:** `@settler/sdk`
- **Python:** `settler-sdk`
- **Go:** `github.com/settler/sdk-go`
- **Ruby:** `settler-sdk`

---

**For OpenAPI specification, see `/api/v1/openapi.json`**
