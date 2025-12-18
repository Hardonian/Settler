# Settler Runbook

This runbook provides step-by-step procedures for common incidents and operational tasks.

## Table of Contents

- [Common Incidents](#common-incidents)
- [Diagnosis with trace_id](#diagnosis-with-trace_id)
- [Rollback Procedures](#rollback-procedures)
- [Emergency Contacts](#emergency-contacts)

## Common Incidents

### Webhook Failing

**Symptoms:**
- Stripe webhooks not processing
- Subscription status not updating
- Billing events not reflected in system

**Diagnosis:**
1. Check Stripe webhook logs:
   ```bash
   # View recent webhook events in Stripe dashboard
   # Or check database:
   SELECT * FROM stripe_events 
   WHERE status = 'failed' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

2. Check application logs for trace_id:
   ```bash
   # Search logs for failed webhook events
   grep "Stripe webhook processing failed" logs/*.log
   ```

3. Verify webhook secret:
   ```bash
   # Check environment variable
   echo $STRIPE_WEBHOOK_SECRET
   ```

**Resolution:**
1. Check webhook endpoint is accessible:
   ```bash
   curl -X POST https://settler.dev/api/stripe/webhook \
     -H "stripe-signature: test" \
     -d '{}'
   ```

2. Verify webhook secret matches Stripe dashboard

3. Replay failed events:
   ```sql
   -- Mark failed events for retry
   UPDATE stripe_events 
   SET status = 'received' 
   WHERE status = 'failed' 
   AND created_at > NOW() - INTERVAL '24 hours';
   ```

4. Test webhook locally:
   ```bash
   npm run stripe:test checkout.session.completed
   ```

### Database Down

**Symptoms:**
- 503 errors on API endpoints
- Health check shows database error
- Application logs show connection errors

**Diagnosis:**
1. Check health endpoint:
   ```bash
   curl https://settler.dev/api/health
   ```

2. Check database connectivity:
   ```bash
   npm run doctor
   ```

3. Check Supabase status:
   - Visit Supabase dashboard
   - Check connection pool status
   - Review recent errors

**Resolution:**
1. Check database URL:
   ```bash
   echo $DATABASE_URL
   echo $SUPABASE_DATABASE_URL
   ```

2. Verify network connectivity:
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. Check connection pool limits:
   - Review Supabase dashboard for connection pool usage
   - Consider increasing pool size if needed

4. Restart application if needed:
   - Vercel: Redeploy
   - Self-hosted: Restart service

### Environment Variables Missing

**Symptoms:**
- Application fails to start
- Features not working
- Health check shows missing env vars

**Diagnosis:**
1. Run doctor script:
   ```bash
   npm run doctor
   ```

2. Check Vercel environment variables:
   - Visit Vercel dashboard
   - Check project settings → Environment Variables

3. Check application logs for missing env errors

**Resolution:**
1. Identify missing variables:
   ```bash
   npm run doctor
   ```

2. Add missing variables to Vercel:
   - Go to Project Settings → Environment Variables
   - Add required variables
   - Redeploy

3. For local development:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with required values
   ```

### 500 Error Spike

**Symptoms:**
- High error rate in monitoring
- Users reporting errors
- Application logs show many 500s

**Diagnosis:**
1. Check error logs with trace_id:
   ```bash
   # Search logs for recent errors
   grep "ERROR" logs/*.log | tail -100
   ```

2. Check metrics endpoint:
   ```bash
   curl https://settler.dev/api/metrics \
     -H "Authorization: Bearer $METRICS_AUTH_TOKEN"
   ```

3. Review error patterns:
   - Group by trace_id
   - Identify common routes
   - Check for database errors

**Resolution:**
1. Identify root cause:
   - Check most common error messages
   - Review stack traces
   - Check database query performance

2. Apply hotfix if needed:
   - Deploy fix to staging first
   - Verify fix works
   - Deploy to production

3. Monitor after fix:
   - Watch error rate decrease
   - Verify affected users can use system

## Diagnosis with trace_id

All requests include a `trace_id` that can be used to correlate logs across services.

### Finding trace_id

1. **From API response:**
   ```bash
   curl -v https://settler.dev/api/health
   # Look for x-trace-id header
   ```

2. **From error response:**
   ```json
   {
     "error": "Something went wrong",
     "trace_id": "abc123...",
     "timestamp": "2026-01-30T12:00:00Z"
   }
   ```

3. **From browser:**
   - Check Network tab → Response Headers → `x-trace-id`
   - Check localStorage → `trace-id` cookie

### Using trace_id

1. **Search logs:**
   ```bash
   grep "trace_id.*abc123" logs/*.log
   ```

2. **Query database:**
   ```sql
   SELECT * FROM audit_log 
   WHERE trace_id = 'abc123...'
   ORDER BY created_at;
   ```

3. **Check Stripe events:**
   ```sql
   SELECT * FROM stripe_events 
   WHERE metadata->>'trace_id' = 'abc123...';
   ```

## Rollback Procedures

### Code Rollback

1. **Identify last known good version:**
   ```bash
   git log --oneline -10
   ```

2. **Create rollback branch:**
   ```bash
   git checkout -b rollback-$(date +%Y%m%d)
   git revert <commit-hash>
   git push origin rollback-$(date +%Y%m%d)
   ```

3. **Deploy rollback:**
   - Create PR from rollback branch
   - Merge to main
   - Vercel will auto-deploy

### Database Migration Rollback

1. **Identify migration to rollback:**
   ```bash
   # List applied migrations
   npm run db:migrate:status
   ```

2. **Create rollback migration:**
   ```bash
   npm run db:new
   # Edit migration file to reverse changes
   ```

3. **Apply rollback:**
   ```bash
   npm run db:migrate:apply
   ```

### Feature Flag Rollback

1. **Disable feature flag:**
   ```sql
   UPDATE feature_flags 
   SET enabled = false 
   WHERE id = 'feature-id';
   ```

2. **Or via API:**
   ```bash
   curl -X PATCH https://settler.dev/api/v1/feature-flags/feature-id \
     -H "Authorization: Bearer $API_KEY" \
     -d '{"enabled": false}'
   ```

## Emergency Contacts

- **On-Call Engineer**: Check PagerDuty
- **CTO**: [Contact Info]
- **Support**: support@settler.dev
- **Stripe Support**: https://support.stripe.com

## Monitoring

- **Application Logs**: Vercel Dashboard → Logs
- **Database**: Supabase Dashboard
- **Stripe**: Stripe Dashboard → Webhooks
- **Metrics**: `/api/metrics` endpoint (requires auth)

## Post-Incident

After resolving an incident:

1. Document what happened
2. Identify root cause
3. Create follow-up tasks to prevent recurrence
4. Update this runbook if needed
