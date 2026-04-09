# Technical Due Diligence: API Model

## API Overview

### Base URL

- **Production:** `https://api.settler.io/api/v1`
- **Staging:** `https://api-staging.settler.io/api/v1`
- **Development:** `http://localhost:3000/api/v1`

### Authentication

**API Key:**

```http
X-API-Key: sk_your_api_key
```

**JWT Token:**

```http
Authorization: Bearer your_jwt_token
```

## Core Endpoints

### Reconciliation Jobs

```http
POST   /api/v1/recon/jobs              # Create job
GET    /api/v1/recon/jobs              # List jobs
GET    /api/v1/recon/jobs/:id          # Get job
POST   /api/v1/recon/jobs/:id/execute  # Execute job
DELETE /api/v1/recon/jobs/:id          # Delete job
```

### Reconciliation Results

```http
GET    /api/v1/recon/jobs/:id/results  # List results
GET    /api/v1/recon/results/:id       # Get result
```

### Webhooks

```http
POST   /api/v1/webhooks                # Create webhook
GET    /api/v1/webhooks                # List webhooks
GET    /api/v1/webhooks/:id            # Get webhook
DELETE /api/v1/webhooks/:id            # Delete webhook
```

### Workflows

```http
POST   /api/v1/workflows               # Create workflow
GET    /api/v1/workflows               # List workflows
POST   /api/v1/workflows/:id/execute   # Execute workflow
```

### Templates

```http
GET    /api/v1/templates/recon         # List recon templates
GET    /api/v1/templates/mapping       # List mapping templates
GET    /api/v1/templates/transform     # List transform recipes
```

## Request/Response Format

### Request Example

```json
{
  "name": "Monthly Reconciliation",
  "sourceAdapter": "stripe",
  "targetAdapter": "internal_ledger",
  "reconStrategy": "deterministic"
}
```

### Response Example

```json
{
  "data": {
    "id": "job_123",
    "name": "Monthly Reconciliation",
    "status": "active"
  },
  "message": "Job created successfully"
}
```

### Error Response

```json
{
  "error": "ValidationError",
  "message": "Invalid adapter configuration",
  "traceId": "trace_123"
}
```

## Rate Limits

| Tier       | RPM       | Concurrent Jobs | Monthly Recons |
| ---------- | --------- | --------------- | -------------- |
| Free       | 100       | 1               | 100            |
| Starter    | 1,000     | 5               | 10,000         |
| Pro        | 10,000    | 20              | 100,000        |
| Business   | 50,000    | 100             | 1,000,000      |
| Enterprise | 1,000,000 | 1,000           | Unlimited      |

## SDKs

- **JavaScript/TypeScript:** `@settler/sdk`
- **Python:** `settler-sdk`
- **Go:** `github.com/settler/sdk-go`
- **Ruby:** `settler-sdk`

---

**Next:** [Security Posture](./SECURITY.md)
