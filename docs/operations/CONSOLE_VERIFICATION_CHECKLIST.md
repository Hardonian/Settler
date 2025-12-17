# Console Fix Verification Checklist

## Pre-Deployment

- [ ] Database migration file created: `supabase/migrations/20260125000000_console_rls_fixes.sql`
- [ ] All domain functions updated to use authenticated client
- [ ] All domain functions have error handling (return empty arrays/null)
- [ ] Health check endpoint created: `/api/health/console`
- [ ] Smoke test updated to check Console route
- [ ] No linter errors
- [ ] GitHub secrets configured (see `docs/AUTOMATIC_MIGRATIONS.md`)

## Deployment Steps

### 1. Apply Database Migration

**✅ Automatic**: Migrations run automatically when you push/merge!

1. **Push to PR**: Migration runs on preview database automatically
2. **Merge PR**: Migration runs on production database automatically

**Manual (if needed)**:
```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql $DATABASE_URL -f supabase/migrations/20260125000000_console_rls_fixes.sql
```

See `docs/AUTOMATIC_MIGRATIONS.md` for full details.

### 2. Verify Environment Variables

Check these are set in Vercel/production:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`
- ✅ `DATABASE_URL` (for Prisma)

**Note**: `SUPABASE_SERVICE_ROLE_KEY` is NOT required for Console (only for admin ops).

### 3. Build & Deploy

```bash
npm run build
# Deploy to Vercel (or your platform)
```

## Post-Deployment Verification

### 1. Health Check Endpoint

```bash
curl https://your-domain.com/api/health/console
```

**Expected**: Status 200, JSON with health status
**Should NOT**: Return 500

### 2. Console Page (Unauthenticated)

```bash
curl -I https://your-domain.com/console
```

**Expected**: Status 200
**Should NOT**: Return 500

Navigate in browser: Should show sign-in prompt or public overview

### 3. Console Page (Authenticated)

1. Sign in to your account
2. Navigate to `/console`
3. **Expected**: Page loads with Console overview
4. **Should NOT**: Return 500 even if no data

### 4. API Keys Endpoint (Unauthenticated)

```bash
curl https://your-domain.com/api/console/api-keys
```

**Expected**: Status 401 (Unauthorized)
**Should NOT**: Return 500

### 5. API Keys Endpoint (Authenticated)

```bash
# Get session cookie from browser after signing in
curl -H "Cookie: your-session-cookie" https://your-domain.com/api/console/api-keys
```

**Expected**: Status 200, JSON with `{ keys: [] }` or array of keys
**Should NOT**: Return 500

### 6. Create API Key (Authenticated)

```bash
curl -X POST https://your-domain.com/api/console/api-keys \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key"}'
```

**Expected**: Status 200, JSON with new key
**Should NOT**: Return 500

### 7. Smoke Tests

```bash
npm run test:smoke
```

**Expected**: All tests pass, including Console tests
**Should NOT**: Console route test fails

## Monitoring

After deployment, monitor:

1. **Error Rate**: Console page should have 0% 500 errors
2. **Health Check**: `/api/health/console` should return `"status": "healthy"`
3. **API Errors**: Console API endpoints should not return 500s
4. **Logs**: Check for any RLS permission errors (should be minimal)

## Rollback Plan

If issues occur:

1. **Database Rollback**:
   ```sql
   DROP POLICY IF EXISTS api_keys_user_access ON api_keys;
   DROP POLICY IF EXISTS billing_accounts_user_access ON billing_accounts;
   DROP POLICY IF EXISTS usage_events_billing_account_access ON usage_events;
   DROP FUNCTION IF EXISTS current_user_id();
   ```

2. **Code Rollback**: Revert to commit before these changes

3. **Redeploy**: Deploy previous version

## Success Criteria

✅ Console page loads without 500 errors
✅ Health check endpoint returns 200
✅ API endpoints return proper status codes (401/403/200)
✅ No secrets leaked in error messages
✅ Tenant isolation working correctly
✅ Smoke tests pass

## Troubleshooting

### Console returns 500
1. Check `/api/health/console` for diagnostics
2. Verify database migration was applied
3. Check server logs for specific error
4. Verify environment variables are set

### RLS Permission Denied
1. Verify `current_user_id()` function exists
2. Check RLS policies are enabled on tables
3. Verify user is authenticated (check JWT claims)

### Health Check Shows "unhealthy"
1. Check environment variables
2. Verify Supabase URL/key are correct
3. Check database connectivity
4. Review health check response for specific issue

## Files Changed Summary

- `packages/web/src/domain/console/apiKeys.ts` - Auth client, error handling
- `packages/web/src/domain/console/receipts.ts` - Billing account verification
- `packages/web/src/domain/console/usage.ts` - Billing account verification
- `packages/web/src/domain/console/featureFlags.ts` - Billing account verification
- `packages/web/src/app/api/console/api-keys/route.ts` - Updated function calls
- `packages/web/src/app/api/console/api-keys/[id]/route.ts` - Updated function calls
- `packages/web/src/app/console/page.tsx` - Updated function calls
- `packages/web/src/app/console/layout.tsx` - Improved error logging
- `supabase/migrations/20260125000000_console_rls_fixes.sql` - NEW RLS policies
- `packages/web/src/app/api/health/console/route.ts` - NEW health check
- `scripts/smoke-test.ts` - Added Console tests
