# Settler API Documentation

## Base URL

- **Production**: `https://api.settler.dev`
- **Staging**: `https://api-staging.settler.dev`

## Authentication

All API requests require authentication via API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.settler.dev/v1/receipts
```

Get your API key from the [Developer Console](/console/api-keys).

## Console API Endpoints

### API Call Logs

#### `GET /api/console/api-logs`
Retrieve API call logs for your tenant.

**Authentication**: Required (session or API key)
**Subscription**: Required

**Query Parameters:**
- `method` (string, optional) - Filter by HTTP method (GET, POST, etc.)
- `path` (string, optional) - Filter by path pattern
- `statusCode` (number, optional) - Filter by HTTP status code
- `startDate` (ISO date, optional) - Start date filter
- `endDate` (ISO date, optional) - End date filter
- `limit` (number, optional) - Results limit (default: 100, max: 1000)
- `offset` (number, optional) - Pagination offset
- `stats` (boolean, optional) - Return statistics only

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "method": "GET",
      "path": "/api/v1/receipts",
      "statusCode": 200,
      "responseTime": 45,
      "timestamp": "2024-12-21T...",
      "headers": {...},
      "query": {...}
    }
  ],
  "count": 100,
  "limit": 100,
  "offset": 0
}
```

**Statistics Response** (`stats=true`):
```json
{
  "stats": {
    "totalCalls": 1234,
    "byMethod": {"GET": 800, "POST": 434},
    "byStatusCode": {200: 1200, 400: 34},
    "byPath": {"/api/v1/receipts": 500},
    "averageResponseTime": 45,
    "errorRate": 0.027
  }
}
```

### Tenant Observability (Super Admin)

#### `GET /api/console/tenants`
List all tenants with metrics (super admin only).

**Authentication**: Required (super admin)
**Subscription**: Super admin access required

**Query Parameters:**
- `includeMetrics` (boolean, optional) - Include tenant metrics
- `limit` (number, optional) - Results limit (default: 100)
- `offset` (number, optional) - Pagination offset

**Response:**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "status": "active",
      "createdAt": "2024-01-01T...",
      "metrics": {
        "apiCalls": 1234,
        "activeUsers": 5
      }
    }
  ],
  "count": 10,
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

### Health Check

#### `GET /api/console/health`
Check system health and status.

**Authentication**: Not required

**Response:**
```json
{
  "health": {
    "overall": "healthy",
    "checks": [
      {
        "service": "supabase",
        "status": "healthy",
        "latency": 45
      }
    ],
    "timestamp": "2024-12-21T..."
  },
  "alerts": [],
  "activeAlerts": []
}
```

## Rate Limits

- **API Logs**: 200 requests/minute
- **Console API**: 100 requests/minute
- **Admin Endpoints**: 30 requests/minute
- **Health Check**: No limit

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (ISO 8601)

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {...}
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401) - Not authenticated
- `SUBSCRIPTION_REQUIRED` (403) - Subscription required
- `FORBIDDEN` (403) - Access denied (super admin required)
- `VALIDATION_ERROR` (400) - Invalid request parameters
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## Privacy & Security

### PII Filtering
All API logs automatically sanitize PII:
- Email addresses are redacted (domain preserved)
- IP addresses are partially redacted
- Authorization headers are redacted
- Sensitive data is removed

### Tenant Isolation
- Users can only see logs for their tenant
- Super admins can see all logs
- RLS policies enforce isolation at database level

## Related Documentation

- [Console Documentation](./CONSOLE.md)
- [API Reference](./API_REFERENCE.md)
- [Authentication Guide](./AUTH.md)
