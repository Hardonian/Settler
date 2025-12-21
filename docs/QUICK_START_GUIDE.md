# Quick Start Guide - Console Enhancement

## 🚀 Quick Setup (5 Minutes)

### 1. Run Database Migrations

```bash
# Apply all migrations
supabase migration up

# Or manually via SQL
psql -d your_database -f supabase/migrations/20241201000000_create_api_call_logs.sql
psql -d your_database -f supabase/migrations/20241201000001_optimize_api_call_logs.sql
psql -d your_database -f supabase/migrations/20241201000002_add_log_retention_policy.sql
psql -d your_database -f supabase/migrations/20241201000003_enhance_rls_policies.sql
```

### 2. Configure Super Admin

Choose one method:

**Option A: Via Billing Account Metadata**
```sql
UPDATE billing_accounts
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{role}', '"SUPER_ADMIN"')
WHERE user_id = 'YOUR_USER_ID';
```

**Option B: Via Email Domain**
Users with `@settler.dev` email automatically get super admin access.

**Option C: Via User Metadata**
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'), 
  '{role}', 
  '"SUPER_ADMIN"'
)
WHERE id = 'YOUR_USER_ID';
```

### 3. Enable API Logging (Optional)

API logging is already enabled for routes using `withApiLogging()`. To enable globally:

Add to `packages/web/middleware.ts`:
```typescript
import { logApiRequest } from '@/middleware/api-logger';

// In middleware function, after creating response:
await logApiRequest(request, response, {
  tenantId: await getTenantFromRequest(request),
  userId: await getUserId(request),
  startTime: Date.now(),
});
```

### 4. Test the Setup

```bash
# Test health check
curl http://localhost:3000/api/console/health

# Test API logs (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/console/api-logs

# Test tenant observability (requires super admin)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/console/tenants
```

## 📋 Feature Checklist

- [x] API call logging middleware
- [x] Rate limiting (configurable per endpoint)
- [x] Response caching (configurable TTL)
- [x] Request validation
- [x] Enhanced error handling
- [x] Health checks and monitoring
- [x] Alerting system
- [x] Database optimizations
- [x] RLS policy enhancements
- [x] PII filtering
- [x] Super admin access control

## 🎯 Key Endpoints

### Developer Endpoints
- `GET /api/console/api-logs` - View API call logs
- `GET /api/console/api-logs?stats=true` - Get statistics
- `GET /console/api-logs` - UI for viewing logs

### Super Admin Endpoints
- `GET /api/console/tenants` - List all tenants
- `GET /api/console/tenants?includeMetrics=true` - With metrics
- `GET /console/admin/tenants` - UI dashboard

### Monitoring Endpoints
- `GET /api/console/health` - System health check

## ⚙️ Configuration

### Rate Limits
Edit `packages/web/src/lib/security/rate-limiter.ts`:
```typescript
export const RATE_LIMIT_CONFIGS = {
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // Adjust as needed
  },
  // ... other configs
};
```

### Cache TTL
Edit `packages/web/src/lib/cache/api-cache.ts`:
```typescript
export const CACHE_CONFIGS = {
  logs: {
    ttl: 10 * 1000, // 10 seconds - adjust as needed
  },
  // ... other configs
};
```

### Log Retention
Edit `supabase/migrations/20241201000002_add_log_retention_policy.sql`:
```sql
-- Change 90 days to your preferred retention period
WHERE created_at < NOW() - INTERVAL '90 days'
```

## 🔧 Troubleshooting

### Logs Not Appearing
1. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'api_call_logs';`
2. Verify tenant_id: Check billing_accounts table
3. Check service role permissions

### Rate Limiting Too Strict
1. Increase limits in `RATE_LIMIT_CONFIGS`
2. Clear rate limit store (restart server)
3. Check rate limit headers in response

### Cache Not Working
1. Verify cache TTL settings
2. Check cache key generation
3. Clear cache: `clearAllCache()` in code

### Health Checks Failing
1. Check Supabase connection
2. Verify database permissions
3. Check API logging table exists

## 📊 Monitoring

### View Active Alerts
```typescript
import { getActiveAlerts } from '@/lib/monitoring/alerts';
const alerts = getActiveAlerts();
```

### Check System Health
```bash
curl http://localhost:3000/api/console/health
```

### View Recent Logs
```sql
SELECT * FROM api_call_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

## 🎓 Next Steps

1. **Review** `IMPLEMENTATION_COMPLETE.md` for full details
2. **Test** all endpoints with your credentials
3. **Monitor** health checks and alerts
4. **Adjust** rate limits and cache TTLs as needed
5. **Set up** log retention cleanup (cron job)

## 📚 Documentation

- **Full Implementation:** `IMPLEMENTATION_COMPLETE.md`
- **Console Enhancement:** `CONSOLE_ENHANCEMENT_SUMMARY.md`
- **Auth Fix:** `CONSOLE_AUTH_FIX_SUMMARY.md`

## ✅ Production Checklist

Before deploying:

- [ ] All migrations applied
- [ ] Super admin configured
- [ ] Rate limits tested
- [ ] Cache TTLs optimized
- [ ] Health checks passing
- [ ] Alerts configured
- [ ] Log retention set
- [ ] RLS policies verified
- [ ] PII filtering tested
- [ ] Error handling verified

---

**Ready to go!** 🎉
