# Deployment Execution Plan

## Current Status

✅ **Code Changes**: Complete
✅ **TypeScript**: All errors fixed
✅ **Documentation**: Complete
⚠️ **Tests**: CLI package has no tests (expected, not blocking)
✅ **Scripts**: Doctor and Stripe test harness working

## Pre-Deployment Checklist

### 1. Code Review ✅

- [x] All new files reviewed
- [x] All modified files reviewed
- [x] TypeScript errors fixed
- [x] Documentation complete

### 2. Testing Status

- [x] TypeScript compilation: ✅ Passing
- [x] Linting: ⚠️ 1 pre-existing error in CLI (unrelated to our changes)
- [x] Unit tests: ⚠️ CLI package has no tests (expected)
- [ ] Integration tests: ⏳ To be run in staging
- [ ] E2E tests: ⏳ To be run in staging

### 3. Environment Setup

- [ ] Set environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `DATABASE_URL` or `SUPABASE_DATABASE_URL`
  - `METRICS_AUTH_TOKEN` (optional)

### 4. Database Migration

- [ ] Apply migration: `supabase/migrations/20260130000000_audit_logging.sql`
- [ ] Verify `audit_log` table exists
- [ ] Verify RLS policies are active

### 5. Stripe Configuration

- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set webhook secret in environment variables
- [ ] Test webhook processing

## Deployment Steps

### Step 1: Merge to Develop Branch

```bash
# Checkout develop branch
git checkout develop
git pull origin develop

# Merge production readiness branch
git merge cursor/saas-production-readiness-867d

# Resolve any conflicts (if any)
# Push to develop
git push origin develop
```

**Expected Result**: Vercel will auto-deploy to staging (if configured)

### Step 2: Verify Staging Deployment

```bash
# Check deployment status in Vercel dashboard
# Wait for deployment to complete

# Test health endpoint
curl https://staging.settler.dev/api/health

# Should return JSON with trace_id:
# {
#   "status": "healthy",
#   "trace_id": "abc123...",
#   "timestamp": "2026-01-30T...",
#   "checks": {...}
# }
```

**Verification Checklist:**

- [ ] Health endpoint returns trace_id
- [ ] No 500 errors in logs
- [ ] Structured logging working
- [ ] Metrics endpoint accessible (with auth)

### Step 3: Run Staging Tests

```bash
# Set staging URL
export E2E_BASE_URL=https://staging.settler.dev

# Run smoke tests
npm run test:smoke

# Run E2E tests
npm run test:e2e

# Run QA crawler
npm run qa:crawl:live
```

**Expected Results:**

- All smoke tests pass
- E2E tests pass
- QA crawler finds no broken links

### Step 4: Test Stripe Webhooks in Staging

```bash
# Get webhook secret from Stripe dashboard
export STRIPE_WEBHOOK_SECRET="whsec_..."

# Test webhook
npm run stripe:test checkout.session.completed

# Or use Stripe CLI
stripe trigger checkout.session.completed
```

**Verification:**

- [ ] Webhook received and processed
- [ ] Event logged in database
- [ ] Trace ID present in logs
- [ ] No duplicate processing

### Step 5: Monitor Staging (30 minutes)

**Monitor:**

- Error rates (should be low/zero)
- Response times (should be normal)
- Webhook processing (should be successful)
- Database queries (should be fast)

**Check Logs:**

- Structured JSON logs with trace_id
- No sensitive data in logs
- Error logs include trace_id

### Step 6: Merge to Main Branch

**Only after staging verification is successful:**

```bash
# Checkout main branch
git checkout main
git pull origin main

# Merge develop
git merge develop

# Push to main
git push origin main
```

**Expected Result**: Vercel will auto-deploy to production

### Step 7: Verify Production Deployment

```bash
# Check deployment status in Vercel dashboard
# Wait for deployment to complete

# Test health endpoint
curl https://settler.dev/api/health

# Should return JSON with trace_id
```

**Verification Checklist:**

- [ ] Health endpoint returns trace_id
- [ ] No 500 errors in logs
- [ ] Structured logging working
- [ ] Metrics endpoint accessible
- [ ] Webhook processing working
- [ ] Billing operations normal

### Step 8: Monitor Production (First Hour)

**Critical Monitoring:**

- Error rates (alert if > 1%)
- Response times (alert if p95 > 2s)
- Webhook processing (alert on failures)
- Database performance (alert on slow queries)

**Check:**

- Vercel logs for errors
- Stripe dashboard for webhook status
- Database for audit log entries
- Metrics endpoint for performance

## Rollback Plan

If issues are detected:

### Code Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Database Rollback

```sql
-- If audit_log table causes issues (unlikely)
-- Can be dropped if needed:
DROP TABLE IF EXISTS audit_log CASCADE;
```

### Feature Flag Rollback

- Disable new features via feature flags if needed
- Trace IDs are backward compatible (won't break anything)

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Verify all endpoints return trace_id
- [ ] Check structured logging
- [ ] Verify webhook processing
- [ ] Test error boundaries
- [ ] Confirm metrics endpoint

### Week 1

- [ ] Review error logs for patterns
- [ ] Check trace_id correlation
- [ ] Verify audit logging
- [ ] Test rollback procedures
- [ ] Review security scan results

### Month 1

- [ ] Full security audit
- [ ] Review threat model
- [ ] Update runbook based on incidents
- [ ] Performance review

## Success Criteria

✅ **Deployment Successful If:**

- All health checks pass
- No increase in error rates
- Webhook processing works
- Trace IDs appear in logs
- Metrics endpoint accessible
- No user-reported issues

❌ **Rollback If:**

- Error rate > 5%
- Critical functionality broken
- Database issues
- Security concerns

## Emergency Contacts

- **On-Call**: Check PagerDuty
- **CTO**: [Contact Info]
- **Support**: support@settler.dev

## Documentation References

- **Runbook**: `docs/RUNBOOK.md`
- **Threat Model**: `docs/THREAT_MODEL.md`
- **Ops Checklist**: `docs/OPS_CHECKLIST.md`
- **Deployment Guide**: `docs/REVIEW_AND_DEPLOYMENT_GUIDE.md`

---

**Status**: Ready for deployment
**Last Updated**: 2026-01-30
