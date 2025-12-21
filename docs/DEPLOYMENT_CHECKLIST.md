# Deployment Checklist

## Pre-Deployment Verification

### Database ✅
- [x] All migrations applied
- [x] Indexes created
- [x] RLS policies active
- [x] Cleanup function exists
- [x] Super admin configured

### Code ✅
- [x] All routes created
- [x] All components created
- [x] All utilities created
- [x] Navigation updated
- [x] Error handling comprehensive

### Testing ✅
- [x] Setup tests passed
- [x] API route tests passed
- [x] Integration tests passed
- [x] End-to-end tests passed
- [x] Route verification passed

### Security ✅
- [x] Authentication required
- [x] Subscription gate active
- [x] RLS policies enforced
- [x] PII filtering active
- [x] Rate limiting active

### Performance ✅
- [x] Indexes optimized
- [x] Caching configured
- [x] Query optimization done
- [x] Response times acceptable

## Deployment Steps

1. **Verify Environment Variables**
   ```bash
   # Required:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (server only)
   ```

2. **Run Migrations** (if not already done)
   ```bash
   export DATABASE_URL="your-connection-string"
   npx tsx scripts/run-migrations-remote.ts
   ```

3. **Configure Super Admin** (if not already done)
   ```bash
   export DATABASE_URL="your-connection-string"
   export USER_EMAIL="admin@settler.dev"
   npx tsx scripts/configure-super-admin.ts
   ```

4. **Verify Setup**
   ```bash
   export DATABASE_URL="your-connection-string"
   npx tsx scripts/test-setup.ts
   ```

5. **Build Application**
   ```bash
   cd packages/web
   pnpm build
   ```

6. **Start Application**
   ```bash
   pnpm start
   ```

7. **Verify Endpoints**
   ```bash
   # Health check
   curl http://localhost:3000/api/console/health
   
   # API logs (requires auth)
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/console/api-logs
   ```

## Post-Deployment Verification

- [ ] Health endpoint returns 200
- [ ] API logs endpoint accessible (with auth)
- [ ] Tenant observability accessible (super admin only)
- [ ] Console pages load correctly
- [ ] Navigation links work
- [ ] No console errors
- [ ] No 500 errors

## Monitoring Setup

1. **Set Up Health Check Monitoring**
   - Monitor `/api/console/health` endpoint
   - Alert on unhealthy status

2. **Set Up Log Retention**
   - Schedule `cleanup_old_api_logs()` function
   - Or run manually: `SELECT cleanup_old_api_logs();`

3. **Monitor API Logs**
   - Track error rates
   - Monitor response times
   - Alert on anomalies

## Rollback Plan

If issues occur:

1. **Database Rollback**
   ```sql
   -- Drop table (if needed)
   DROP TABLE IF EXISTS api_call_logs CASCADE;
   ```

2. **Code Rollback**
   - Revert to previous commit
   - Remove new routes/components
   - Restore previous navigation

## Support

For issues:
1. Check health endpoint: `/api/console/health`
2. Review logs: `SELECT * FROM api_call_logs ORDER BY created_at DESC LIMIT 100;`
3. Check super admin: Verify user metadata
4. Review error logs: Check application logs

---

**Status**: ✅ Ready for deployment
**Last Verified**: All tests passing
**Confidence Level**: High
