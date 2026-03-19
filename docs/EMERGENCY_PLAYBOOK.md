# Settler Emergency Playbook

**Version:** 1.0  
**Date:** January 2026  
**Purpose:** Step-by-step procedures for common emergencies

---

## Emergency Contacts

- **Founder:** [To be filled]
- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support
- **Resend Support:** https://resend.com/support

---

## Severity Levels

- **P0 - Critical:** Service down, data loss, security breach → Immediate response
- **P1 - High:** Major feature broken, billing failures → 15 minutes
- **P2 - Medium:** Minor issues, performance degradation → 1 hour
- **P3 - Low:** UI bugs, documentation → 4 hours

---

## P0: Service Down

### Symptoms

- API returns 500 errors
- Console won't load
- Database connection failures

### Immediate Actions

1. **Check Vercel Status**

   ```bash
   vercel logs [project-name] --follow
   ```

   - Look for deployment failures
   - Check recent deployments

2. **Check Supabase Status**
   - Go to Supabase Dashboard → Database → Health
   - Check connection pool usage
   - Review recent migrations

3. **Check Health Checks**

   ```sql
   SELECT * FROM health_checks
   ORDER BY timestamp DESC
   LIMIT 10;
   ```

4. **Rollback if Needed**

   ```bash
   vercel rollback [deployment-url]
   ```

5. **Notify Users**
   - Update status page
   - Send email if P0 persists > 30 minutes

### Recovery Steps

1. Identify root cause from logs
2. Fix issue or rollback
3. Verify health checks pass
4. Monitor for 1 hour
5. Document incident

---

## P0: Security Breach

### Symptoms

- Unauthorized access detected
- Suspicious API activity
- Data exfiltration

### Immediate Actions

1. **Rotate All Secrets** (within 5 minutes)

   ```bash
   # JWT Secret
   openssl rand -base64 32
   # Update in Vercel Environment Variables

   # Encryption Key
   openssl rand -hex 16
   # Update in Vercel Environment Variables

   # Stripe API Keys
   # Revoke in Stripe Dashboard → Create new → Update env vars
   ```

2. **Revoke Compromised API Keys**

   ```sql
   UPDATE api_keys
   SET revoked = TRUE, revoked_at = NOW()
   WHERE id IN ('compromised-key-id');
   ```

3. **Review Access Logs**

   ```sql
   SELECT * FROM activity_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

4. **Check for Data Exfiltration**

   ```sql
   SELECT user_id, COUNT(*) as api_calls
   FROM usage_events
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY user_id
   ORDER BY api_calls DESC
   LIMIT 10;
   ```

5. **Notify Affected Users** (if PII breach)
   - Email affected users within 72 hours
   - Document incident

### Recovery Steps

1. Contain breach (revoke access)
2. Assess damage
3. Fix vulnerability
4. Monitor for 48 hours
5. Post-mortem

---

## P1: Billing Failures

### Symptoms

- Stripe webhooks failing
- Subscriptions not syncing
- Payment failures

### Immediate Actions

1. **Check Stripe Dashboard**
   - Go to Stripe Dashboard → Payments → Failed
   - Check webhook events → Recent events

2. **Check Webhook Processing**

   ```sql
   SELECT * FROM stripe_event_log
   WHERE processed = FALSE
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Check Webhook Secret**
   - Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
   - Test webhook endpoint manually

4. **Manually Sync if Needed**

   ```sql
   -- Get Stripe subscription ID
   SELECT stripe_subscription_id FROM subscriptions WHERE id = 'sub-id';

   -- Manually trigger webhook from Stripe dashboard
   -- Stripe Dashboard → Developers → Webhooks → [Event] → Send test webhook
   ```

5. **Retry Failed Payments**
   - Stripe Dashboard → Customers → [Customer] → Retry payment
   - Or use Stripe API:
   ```bash
   curl https://api.stripe.com/v1/payment_intents/pi_xxx/retry \
     -u sk_live_xxx:
   ```

### Recovery Steps

1. Fix webhook processing
2. Manually sync affected subscriptions
3. Retry failed payments
4. Monitor for 24 hours
5. Document issue

---

## P1: High Error Rates

### Symptoms

- Error rate > 5%
- Multiple 500 errors
- User complaints

### Immediate Actions

1. **Check Error Logs**

   ```bash
   vercel logs [project-name] --follow | grep ERROR
   ```

2. **Run Diagnostics**

   ```bash
   curl https://your-domain.com/api/v1/observability/health
   curl https://your-domain.com/api/v1/observability/metrics
   ```

3. **Check Database Performance**

   ```sql
   SELECT * FROM diagnostics
   WHERE diagnostic_type = 'automated'
   ORDER BY timestamp DESC
   LIMIT 1;
   ```

4. **Check Recent Deployments**
   - Vercel Dashboard → Deployments
   - Rollback if recent deployment caused issue

5. **Scale Up if Needed**
   - Vercel auto-scales, but check limits
   - Supabase: Check connection pool usage

### Recovery Steps

1. Identify error pattern
2. Fix root cause or rollback
3. Monitor error rate
4. Verify fix
5. Document

---

## P2: Performance Degradation

### Symptoms

- Slow API responses (> 1s)
- Database queries slow
- High latency

### Immediate Actions

1. **Check Database Performance**

   ```sql
   SELECT * FROM health_checks
   WHERE results @> '[{"check": "database_performance"}]'
   ORDER BY timestamp DESC
   LIMIT 10;
   ```

2. **Check Query Performance**
   - Supabase Dashboard → Database → Query Performance
   - Look for slow queries

3. **Check Usage Patterns**

   ```sql
   SELECT event_type, COUNT(*) as count
   FROM usage_events
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY event_type;
   ```

4. **Add Indexes if Needed**
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_column
   ON table_name(column_name);
   ```

### Recovery Steps

1. Identify bottleneck
2. Optimize queries or add indexes
3. Monitor performance
4. Document optimization

---

## P2: Email Delivery Failures

### Symptoms

- Emails not sending
- High bounce rate
- Resend API errors

### Immediate Actions

1. **Check Email Service Status**
   - Resend Dashboard → Logs
   - Check API key validity

2. **Check Email Sends**

   ```sql
   SELECT * FROM email_sends
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Verify API Key**

   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json"
   ```

4. **Check Rate Limits**
   - Resend free tier: 3,000 emails/month
   - Check usage in Resend dashboard

### Recovery Steps

1. Fix API key or upgrade plan
2. Retry failed emails
3. Monitor delivery rate
4. Document issue

---

## Kill Switches

### Disable Automated Systems

1. **Disable Trial Provisioning**

   ```sql
   DROP TRIGGER trigger_provision_trial_on_signup ON profiles;
   ```

2. **Disable Automated Emails**
   - Set `ENABLE_AUTOMATED_EMAILS=false` in Vercel env vars
   - Or disable edge function in Supabase

3. **Disable Health Checks**
   - Set `ENABLE_AUTOMATED_HEALTH_CHECKS=false` in Vercel env vars

4. **Disable Usage Tracking**
   - Set `ENABLE_USAGE_TRACKING=false` in Vercel env vars

---

## Post-Incident Checklist

- [ ] Document incident (what happened, why, how fixed)
- [ ] Update runbook with lessons learned
- [ ] Notify affected users (if applicable)
- [ ] Review monitoring/alerting gaps
- [ ] Implement preventive measures
- [ ] Schedule post-mortem (for P0/P1)

---

## Quick Reference

### Database Queries

```sql
-- Check recent errors
SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20;

-- Check user activity
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20;

-- Check subscriptions
SELECT * FROM subscriptions WHERE status = 'active';

-- Check usage
SELECT * FROM usage_events ORDER BY created_at DESC LIMIT 20;
```

### API Endpoints

- Health: `GET /api/health` (basic), `GET /api/health/detailed` (with checks), `GET /api/health/ready` (readiness)
- Observability: `GET /api/v1/observability/health` (detailed), `GET /api/v1/observability/metrics`
- Health: `GET /api/health` or `GET /api/health/detailed`

---

**Last Updated:** January 2026  
**Next Review:** After each incident
