# Review and Deployment Guide

This guide walks through reviewing, testing, and deploying the production readiness changes.

## ✅ Pre-Deployment Checklist

### 1. Code Review

**New Files to Review:**

- [ ] `packages/web/src/lib/observability/*` - Observability utilities
- [ ] `packages/web/src/lib/api/auth-gate.ts` - Auth gating
- [ ] `scripts/doctor.ts` - Health check script
- [ ] `scripts/stripe-test-harness.ts` - Stripe testing
- [ ] `supabase/migrations/20260130000000_audit_logging.sql` - Audit log table
- [ ] `.github/workflows/security.yml` - Security scanning
- [ ] `.github/workflows/release.yml` - Release automation
- [ ] Documentation files in `/docs`

**Modified Files to Review:**

- [ ] `packages/web/middleware.ts` - Trace ID propagation
- [ ] `packages/web/src/lib/api/error-handler.ts` - Trace ID in errors
- [ ] `packages/web/src/app/api/stripe/webhook/route.ts` - Enhanced logging
- [ ] `packages/web/src/app/api/health/route.ts` - Trace ID added
- [ ] `package.json` - New scripts

### 2. Testing

#### Local Testing

```bash
# 1. Install dependencies
npm ci

# 2. Run doctor script (will show warnings for missing env vars - expected)
npm run doctor

# 3. Run linting
npm run lint

# 4. Run type checking
npm run typecheck

# 5. Run tests
npm test

# 6. Build
npm run build
```

#### Stripe Webhook Testing

```bash
# Set up Stripe CLI (if not already installed)
# Install: https://stripe.com/docs/stripe-cli

# Get webhook secret
stripe listen --print-secret

# Set environment variable
export STRIPE_WEBHOOK_SECRET="whsec_..."

# Test webhook locally
npm run stripe:test checkout.session.completed
```

#### QA Testing

```bash
# Run smoke tests
npm run test:smoke

# Run QA crawler (requires local server running)
npm run dev
# In another terminal:
npm run qa:crawl:local
```

### 3. Environment Variables

**Required for Production:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL` or `SUPABASE_DATABASE_URL`

**Optional but Recommended:**

- `METRICS_AUTH_TOKEN` - For `/api/metrics` endpoint
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

### 4. Database Migration

**Apply Audit Log Migration:**

```bash
# Using Supabase CLI
supabase migration up

# Or via SQL directly in Supabase dashboard
# Run: supabase/migrations/20260130000000_audit_logging.sql
```

**Verify Migration:**

```sql
-- Check audit_log table exists
SELECT * FROM audit_log LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'audit_log';
```

### 5. CI/CD Setup

**Verify GitHub Actions:**

1. Check `.github/workflows/security.yml` is active
2. Check `.github/workflows/release.yml` is configured
3. Verify Gitleaks is working (may need GitHub token)

**Test Secret Scanning:**

```bash
# Install Gitleaks locally
# https://github.com/gitleaks/gitleaks

# Run scan
gitleaks detect --verbose
```

## 🚀 Deployment Steps

### Staging Deployment

1. **Merge to `develop` branch:**

   ```bash
   git checkout develop
   git merge feature/production-readiness
   git push origin develop
   ```

2. **Vercel will auto-deploy** (if connected to `develop` branch)

3. **Verify Deployment:**

   ```bash
   # Check health endpoint
   curl https://staging.settler.dev/api/health

   # Should return JSON with trace_id
   ```

4. **Run Smoke Tests:**

   ```bash
   E2E_BASE_URL=https://staging.settler.dev npm run test:smoke
   ```

5. **Test Stripe Webhooks:**
   - Configure webhook endpoint in Stripe dashboard
   - Test with `stripe trigger checkout.session.completed`
   - Verify events are processed

### Production Deployment

1. **Merge to `main` branch:**

   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Vercel will auto-deploy** (if connected to `main` branch)

3. **Monitor Deployment:**
   - Watch Vercel deployment logs
   - Check health endpoint: `https://settler.dev/api/health`
   - Monitor error rates

4. **Post-Deployment Verification:**

   ```bash
   # Run doctor script against production
   # (Set production env vars first)
   npm run doctor

   # Check metrics endpoint
   curl https://settler.dev/api/metrics \
     -H "Authorization: Bearer $METRICS_AUTH_TOKEN"
   ```

5. **Monitor for 30 minutes:**
   - Check error logs
   - Verify webhook processing
   - Check billing operations
   - Monitor performance metrics

## 📋 Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Verify all endpoints return trace_id headers
- [ ] Check structured logging is working
- [ ] Verify Stripe webhooks are processing
- [ ] Test error boundaries work
- [ ] Confirm metrics endpoint is accessible

### Week 1

- [ ] Review error logs for patterns
- [ ] Check trace_id correlation works
- [ ] Verify audit logging captures events
- [ ] Test rollback procedures
- [ ] Review security scan results

### Month 1

- [ ] Full security audit
- [ ] Review threat model
- [ ] Update runbook based on incidents
- [ ] Review and optimize RLS policies
- [ ] Performance review

## 🔍 Verification Commands

### Check Trace ID Propagation

```bash
# Test API endpoint
curl -v https://settler.dev/api/health

# Should see x-trace-id header in response
```

### Check Structured Logging

```bash
# View logs (Vercel dashboard or local)
# Should see JSON logs with trace_id
```

### Check Metrics

```bash
curl https://settler.dev/api/metrics \
  -H "Authorization: Bearer $METRICS_AUTH_TOKEN"

# Should return metrics summary
```

### Check Audit Logging

```sql
-- View recent audit logs
SELECT * FROM audit_log
ORDER BY created_at DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Doctor Script Fails

**Issue**: Node version check fails
**Solution**: Update Node.js to v24+ (or adjust requirement in script)

**Issue**: Missing environment variables
**Solution**: Set required env vars in Vercel dashboard

### Stripe Webhook Test Fails

**Issue**: `STRIPE_WEBHOOK_SECRET not set`
**Solution**: Get secret from `stripe listen --print-secret`

**Issue**: Signature verification fails
**Solution**: Ensure webhook secret matches Stripe dashboard

### Trace ID Not Appearing

**Issue**: No `x-trace-id` header in responses
**Solution**: Check middleware is running, verify trace.ts imports

### Metrics Endpoint Returns 401

**Issue**: Unauthorized access
**Solution**: Set `METRICS_AUTH_TOKEN` or authenticate as user

## 📚 Documentation Review

Before deploying, review:

1. **Runbook** (`docs/RUNBOOK.md`) - Incident procedures
2. **Threat Model** (`docs/THREAT_MODEL.md`) - Security analysis
3. **Ops Checklist** (`docs/OPS_CHECKLIST.md`) - Maintenance tasks
4. **RLS Verification** (`docs/RLS_POLICY_VERIFICATION.md`) - Database security

## ✅ Sign-Off

Before production deployment:

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Documentation reviewed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CI/CD pipelines green
- [ ] Staging deployment verified
- [ ] Team trained on runbook

---

**Ready for Production**: ✅ All checks complete
