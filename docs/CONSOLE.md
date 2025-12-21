# Settler Developer Console

## Overview

The Settler Developer Console provides comprehensive tools for managing your Settler integration, monitoring API usage, and accessing developer resources.

## Access

- **URL**: `/console`
- **Authentication**: Required (sign in required)
- **Subscription**: Active subscription required for full access

## Features

### Developer Tools

#### API Call Logs (`/console/api-logs`)
View and analyze all API calls made to Settler APIs:
- Filter by method, path, status code
- View statistics (total calls, error rate, avg response time)
- Export logs to CSV
- Real-time log viewing

**Access**: All authenticated subscribers

#### API Keys (`/console/api-keys`)
Manage API keys for authenticating requests:
- Create and manage API keys
- View key usage
- Revoke keys

**Access**: Subscribed users

#### Usage & Metrics (`/console/usage`)
Monitor API usage and analytics:
- Usage statistics
- Service breakdown
- Error rates
- Performance metrics

**Access**: Subscribed users

#### Receipts (`/console/receipts`)
Browse parsed receipts:
- View receipt details
- Search receipts
- Export receipt data

**Access**: All authenticated users

### Super Admin Tools

#### Tenant Observability (`/console/admin/tenants`)
Monitor all tenants and their metrics:
- View all tenants
- Aggregate statistics
- Individual tenant metrics
- Health monitoring

**Access**: Super admins only

## API Endpoints

### Developer Endpoints

#### `GET /api/console/api-logs`
Retrieve API call logs for current tenant.

**Query Parameters:**
- `method` - Filter by HTTP method
- `path` - Filter by path pattern
- `statusCode` - Filter by status code
- `startDate` - Start date filter
- `endDate` - End date filter
- `limit` - Results limit (default: 100)
- `offset` - Pagination offset
- `stats` - Return stats only (true/false)

**Response:**
```json
{
  "logs": [...],
  "count": 100,
  "limit": 100,
  "offset": 0
}
```

#### `GET /api/console/api-logs?stats=true`
Get API call statistics.

**Response:**
```json
{
  "stats": {
    "totalCalls": 1234,
    "byMethod": {"GET": 800, "POST": 434},
    "byStatusCode": {200: 1200, 400: 34},
    "averageResponseTime": 45,
    "errorRate": 0.027
  }
}
```

### Super Admin Endpoints

#### `GET /api/console/tenants`
List all tenants with metrics (super admin only).

**Query Parameters:**
- `includeMetrics` - Include tenant metrics (true/false)
- `limit` - Results limit (default: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "tenants": [...],
  "count": 10,
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

### Monitoring Endpoints

#### `GET /api/console/health`
Check system health.

**Response:**
```json
{
  "health": {
    "overall": "healthy",
    "checks": [...]
  },
  "alerts": [...],
  "timestamp": "2024-12-21T..."
}
```

## Access Control

### Authentication
All console routes require authentication. Unauthenticated users are redirected to `/signup?next=/console`.

### Subscription Gating
- **Unsubscribed**: Limited access (receipts only)
- **Subscribed (Unpaid)**: Read-only access
- **Subscribed (Paid)**: Full access
- **Enterprise**: Full access + higher limits

### Super Admin
Super admins have access to:
- Tenant observability dashboard
- All tenant API logs
- Cross-tenant analytics
- System health monitoring

## Privacy & Security

### PII Filtering
All API logs automatically sanitize PII:
- Emails: `user@example.com` → `***@example.com`
- IPs: `192.168.1.1` → `192.***.***.***`
- Authorization headers: Redacted
- Sensitive data: Removed

### Rate Limiting
- API logs: 200 requests/minute
- Console API: 100 requests/minute
- Admin endpoints: 30 requests/minute

### Security Features
- RLS policies enforce tenant isolation
- Server-side access control
- Input validation
- Error sanitization

## Usage Examples

### View API Logs
```bash
# Via API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://settler.dev/api/console/api-logs?limit=50&method=GET"

# Via UI
# Navigate to: https://settler.dev/console/api-logs
```

### View Tenant Observability (Super Admin)
```bash
# Via API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://settler.dev/api/console/tenants?includeMetrics=true"

# Via UI
# Navigate to: https://settler.dev/console/admin/tenants
```

## Troubleshooting

### Cannot Access Console
1. Ensure you're signed in
2. Check subscription status
3. Verify account is active

### API Logs Not Showing
1. Check tenant_id is set correctly
2. Verify RLS policies
3. Check database connection

### Super Admin Access Denied
1. Verify super admin role in user metadata
2. Check email domain (@settler.dev)
3. Contact support if issue persists

## Related Documentation

- [Console Enhancement Summary](../CONSOLE_ENHANCEMENT_SUMMARY.md)
- [Auth Fix Summary](../CONSOLE_AUTH_FIX_SUMMARY.md)
- [Setup Guide](../REMOTE_SETUP_GUIDE.md)
