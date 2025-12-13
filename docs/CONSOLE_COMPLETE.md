# Console Module - Complete Implementation Guide

## Overview

The Console module is now fully implemented with:
- ✅ Complete authentication integration
- ✅ Real-time activity logging
- ✅ Comprehensive error handling (never returns 500)
- ✅ CLI tools for management
- ✅ Full UI/UX polish
- ✅ Activity feed with real data
- ✅ Proper logging infrastructure

## Features Implemented

### 1. Authentication & Security
- **Authenticated Supabase client** (no admin client)
- **RLS policies** for tenant isolation
- **Billing account verification** on all queries
- **Graceful auth handling** (no 500s on unauthenticated access)

### 2. Activity Logging
- **Real-time activity feed** connected to database
- **Activity logging** for all Console operations
- **Audit trail** for compliance
- **Live updates** every 10 seconds

### 3. Error Handling
- **Never returns 500** - all errors handled gracefully
- **Empty states** instead of crashes
- **User-friendly error messages**
- **Proper status codes** (401, 403, 404, 200)

### 4. CLI Tools
- **API key management** (`settler console api-keys`)
- **Usage statistics** (`settler console usage`)
- **Health checks** (`settler console health`)

### 5. UI/UX Improvements
- **Loading states** on all pages
- **Empty states** with helpful CTAs
- **Error boundaries** for graceful failures
- **Responsive design** (mobile + desktop)

## Database Migrations

### Required Migrations

1. **Console RLS Fixes** (`20260125000000_console_rls_fixes.sql`)
   - Fixes RLS policies for user-based queries
   - Adds `current_user_id()` helper

2. **Activity Logging** (`20260125000001_console_activity_logging.sql`)
   - Creates `console_activities` table
   - Adds logging functions
   - Sets up RLS policies

**Apply migrations:**
```bash
# Automatic (recommended)
# Migrations run automatically on PR push and merge

# Manual (if needed)
supabase db push
```

## API Routes

All Console API routes:
- ✅ Return proper status codes
- ✅ Never return 500 (graceful degradation)
- ✅ Handle auth errors (401)
- ✅ Handle permission errors (403)
- ✅ Return empty arrays/null on errors

### Routes

- `GET /api/console/api-keys` - List API keys
- `POST /api/console/api-keys` - Create API key
- `DELETE /api/console/api-keys/[id]` - Revoke API key
- `GET /api/console/usage` - Get usage statistics
- `GET /api/console/receipts` - List receipts
- `GET /api/console/receipts/[id]` - Get receipt detail
- `GET /api/console/feature-flags` - List feature flags
- `GET /api/console/activities` - Get recent activities
- `GET /api/health/console` - Health check

## CLI Commands

### Setup

```bash
# Install CLI
npm install -g @settler/cli

# Set API key
export SETTLER_API_KEY=your_api_key_here
export SETTLER_BASE_URL=https://your-domain.com  # Optional
```

### Commands

```bash
# API Keys
settler console api-keys list
settler console api-keys create --name "My Key" --scopes "read,write"
settler console api-keys revoke <key-id>

# Usage
settler console usage summary --days 7

# Health Check
settler console health
```

## Activity Logging

### Automatic Logging

All Console operations are automatically logged:
- API key creation/revocation
- Feature flag toggles
- Receipt parsing
- Usage queries

### Manual Logging

```typescript
import { logActivity } from '@/lib/console/activity-logger';

await logActivity({
  activityType: 'api_key',
  action: 'created',
  title: 'Created API key: My Key',
  status: 'success',
  resourceId: keyId,
  resourceType: 'api_key',
});
```

## UI Components

### Live Activity Feed

Connected to real database, updates every 10 seconds:
- Shows recent Console activities
- Displays activity types with icons
- Shows status (success/processing/failed)
- Responsive design

### Pages

All Console pages:
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Responsive design
- ✅ Dark mode support

## Testing

### Manual Testing

1. **Health Check**:
   ```bash
   curl https://your-domain.com/api/health/console
   ```

2. **Console Page** (unauthenticated):
   ```bash
   curl -I https://your-domain.com/console
   # Should return 200, not 500
   ```

3. **API Keys** (authenticated):
   ```bash
   curl -H "Cookie: session-cookie" https://your-domain.com/api/console/api-keys
   ```

### Automated Testing

```bash
# Run smoke tests
npm run test:smoke

# Run E2E tests
npm run test:e2e
```

## Monitoring

### Health Check Endpoint

Monitor Console health:
```bash
curl https://your-domain.com/api/health/console
```

Returns:
```json
{
  "status": "healthy",
  "checks": {
    "env": { "status": "ok" },
    "supabase": { "status": "ok" },
    "auth": { "status": "ok" }
  }
}
```

### Activity Monitoring

Query recent activities:
```sql
SELECT * FROM console_activities 
WHERE billing_account_id = 'your-id'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Console Returns 500

1. Check `/api/health/console` endpoint
2. Verify database migrations applied
3. Check server logs
4. Verify environment variables

### Activities Not Showing

1. Verify `console_activities` table exists
2. Check RLS policies are enabled
3. Verify user has billing account
4. Check activity logging is working

### CLI Commands Fail

1. Verify `SETTLER_API_KEY` is set
2. Check API endpoint is accessible
3. Verify authentication works
4. Check network connectivity

## Security

- ✅ All queries use authenticated client
- ✅ RLS policies enforce tenant isolation
- ✅ Billing account verification on all operations
- ✅ No secrets in logs or errors
- ✅ Proper error handling (no info leakage)

## Performance

- ✅ Activity feed polls every 10 seconds
- ✅ Pagination on large datasets
- ✅ Indexed database queries
- ✅ Efficient RLS policies
- ✅ Cached user/billing account lookups

## Next Steps

1. **Apply migrations** (automatic on push/merge)
2. **Test Console** functionality
3. **Monitor health** endpoint
4. **Use CLI tools** for management
5. **Review activity logs** regularly

## Support

- See `CONSOLE_500_FIX_REPORT.md` for technical details
- See `AUTOMATIC_MIGRATIONS.md` for migration setup
- Check GitHub Actions for migration status
- Review server logs for errors
