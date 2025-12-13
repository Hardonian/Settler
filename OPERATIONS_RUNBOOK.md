# Settler.dev — Operations Runbook

**Version:** 1.0  
**Date:** January 2026  
**Audience:** Solo Operator, Future Team Members

---

## Purpose

This runbook enables **solo-operator resilience**—ensuring Settler can operate even if the founder is unavailable for 48+ hours. It covers:

- Where logs live
- How to detect billing failures
- How to recover from webhook issues
- How to rotate secrets
- Day-2 operations

---

## Critical Systems Overview

### Infrastructure Stack

- **Hosting:** Vercel (serverless)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash (Redis)
- **Billing:** Stripe
- **Monitoring:** [To be implemented - Sentry planned]

### Key URLs

- **Production API:** `https://api.settler.dev` (or Vercel URL)
- **Production Web:** `https://settler.dev`
- **Stripe Dashboard:** `https://dashboard.stripe.com`
- **Supabase Dashboard:** `https://supabase.com/dashboard`
- **Vercel Dashboard:** `https://vercel.com/dashboard`

---

## Logs & Monitoring

### Where Logs Live

**Vercel Logs:**
- Access: Vercel Dashboard → Project → Functions → Logs
- Retention: 30 days (free tier), 90 days (pro tier)
- Format: JSON structured logs

**Supabase Logs:**
- Access: Supabase Dashboard → Logs
- Retention: 7 days (free tier), 30 days (pro tier)
- Format: PostgreSQL logs, query logs

**Application Logs:**
- Currently: Console logs (stdout/stderr)
- Planned: Sentry integration for error tracking
- Planned: Structured logging to external service

### How to Access Logs

**Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# View logs
vercel logs [project-name] --follow
```

**Supabase CLI:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# View logs (if available)
supabase logs
```

### Key Metrics to Monitor

**API Health:**
- Request rate
- Error rate (target: <1%)
- p95 latency (target: <200ms)
- Availability (target: >99.9%)

**Database:**
- Connection pool usage (target: <80%)
- Query latency (target: <100ms p95)
- Disk usage (target: <80%)

**Billing:**
- Stripe webhook success rate (target: >99%)
- Failed payment rate (target: <5%)
- Subscription churn rate (target: <5% monthly)

---

## Billing & Stripe Operations

### Detecting Billing Failures

**Stripe Dashboard:**
1. Go to `https://dashboard.stripe.com`
2. Check "Payments" → "Failed" tab
3. Check "Subscriptions" → Filter by "Past Due" or "Unpaid"

**Database Check:**
```sql
-- Check for past due subscriptions
SELECT 
  s.id,
  s.status,
  s."stripeSubscriptionId",
  ba.email,
  ba.name
FROM subscription s
JOIN "billingAccount" ba ON s."billingAccountId" = ba.id
WHERE s.status IN ('past_due', 'unpaid', 'canceled')
ORDER BY s."updatedAt" DESC;
```

**Webhook Event Check:**
```sql
-- Check for failed webhook events
SELECT 
  "eventId",
  type,
  status,
  error,
  "processedAt"
FROM "stripeEvent"
WHERE status = 'failed'
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Recovering from Webhook Issues

**Problem:** Stripe webhook events not processing

**Investigation:**
1. Check webhook endpoint: `https://settler.dev/api/stripe/webhook`
2. Check Stripe Dashboard → Developers → Webhooks → Recent events
3. Check database for failed events (see query above)

**Common Causes & Solutions:**

**Webhook Secret Mismatch:**
```bash
# Verify webhook secret matches Stripe dashboard
# Stripe Dashboard → Developers → Webhooks → Signing secret
# Compare with: Vercel Environment Variables → STRIPE_WEBHOOK_SECRET
```

**Database Connection Issues:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# If connection fails, check Supabase dashboard
# Supabase Dashboard → Settings → Database → Connection string
```

**Event Processing Failures:**
```sql
-- Manually retry failed events (if needed)
-- First, identify the event
SELECT "eventId", type, status, error
FROM "stripeEvent"
WHERE status = 'failed'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Then, manually trigger webhook from Stripe dashboard
-- Stripe Dashboard → Developers → Webhooks → [Event] → Send test webhook
```

**Idempotency Issues:**
- Stripe webhook handler uses database-backed idempotency (`stripe_events` table)
- If event already processed, handler returns `{ received: true, duplicate: true }`
- No manual intervention needed for duplicates

### Payment Recovery

**Failed Payment:**
1. Stripe automatically retries failed payments (3 attempts over 3 days)
2. If all retries fail, subscription status changes to `past_due`
3. Customer receives email notification from Stripe

**Manual Recovery:**
```bash
# Option 1: Use Stripe Customer Portal
# Customer can update payment method via: https://settler.dev/console/billing

# Option 2: Manually update payment method (Stripe Dashboard)
# Stripe Dashboard → Customers → [Customer] → Payment Methods → Add payment method

# Option 3: Send payment recovery email
# Stripe Dashboard → Customers → [Customer] → Send payment recovery email
```

### Subscription Management

**Check Subscription Status:**
```sql
-- Active subscriptions
SELECT 
  s.id,
  s.status,
  s."planName",
  ba.email,
  s."currentPeriodStart",
  s."currentPeriodEnd"
FROM subscription s
JOIN "billingAccount" ba ON s."billingAccountId" = ba.id
WHERE s.status = 'active'
ORDER BY s."createdAt" DESC;
```

**Cancel Subscription:**
- Customer can cancel via Customer Portal: `https://settler.dev/console/billing`
- Or manually via Stripe Dashboard → Subscriptions → Cancel

**Refund:**
- Stripe Dashboard → Payments → [Payment] → Refund
- Or via API: `stripe.refunds.create({ payment_intent: 'pi_xxx' })`

---

## Secret Rotation

### When to Rotate Secrets

- **Security incident:** Immediately
- **Regular rotation:** Every 90 days (recommended)
- **Team member departure:** Immediately
- **Suspected compromise:** Immediately

### Secrets to Rotate

**JWT Secret:**
```bash
# Generate new secret
openssl rand -base64 32

# Update in Vercel Environment Variables
# Vercel Dashboard → Project → Settings → Environment Variables → JWT_SECRET

# Note: Rotating JWT secret will invalidate all existing sessions
# Users will need to re-authenticate
```

**Encryption Key:**
```bash
# Generate new encryption key (32 characters)
openssl rand -hex 16

# Update in Vercel Environment Variables
# Vercel Dashboard → Project → Settings → Environment Variables → ENCRYPTION_KEY

# Warning: Rotating encryption key will make encrypted data unreadable
# Only rotate if you have a migration plan for existing encrypted data
```

**Stripe API Keys:**
```bash
# Stripe Dashboard → Developers → API Keys
# Create new key → Update in Vercel Environment Variables
# Revoke old key after confirming new key works

# Update: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

**Database Credentials:**
```bash
# Supabase Dashboard → Settings → Database → Reset database password
# Update: SUPABASE_SERVICE_ROLE_KEY (if changed)
```

**Redis Credentials:**
```bash
# Upstash Dashboard → Database → Settings → Reset password
# Update: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

### Secret Rotation Checklist

- [ ] Generate new secret
- [ ] Update in Vercel Environment Variables
- [ ] Deploy new version (Vercel auto-deploys on env var change)
- [ ] Test functionality (API, billing, webhooks)
- [ ] Revoke old secret (if applicable)
- [ ] Document rotation date

---

## Day-2 Operations

### Daily Checks

**Morning Routine (5 minutes):**
1. Check Vercel deployment status
2. Check Stripe dashboard for failed payments
3. Check error logs (Vercel logs, Sentry if configured)
4. Check database connection (Supabase dashboard)

**Weekly Checks:**
1. Review subscription churn (Stripe dashboard)
2. Review API usage trends (if metrics available)
3. Review error rates (target: <1%)
4. Check database disk usage (target: <80%)

**Monthly Checks:**
1. Review billing reconciliation (Stripe → Database sync)
2. Review security logs (if available)
3. Review infrastructure costs (Vercel, Supabase, Upstash)
4. Update documentation if processes changed

### Common Tasks

**Deploy New Version:**
```bash
# Push to main branch (triggers Vercel deployment)
git push origin main

# Or manually deploy
vercel --prod
```

**Check API Health:**
```bash
curl https://api.settler.dev/health
# Expected: { "status": "healthy", ... }
```

**Check Database Health:**
```bash
# Via Supabase Dashboard → Database → Health
# Or via SQL:
psql $DATABASE_URL -c "SELECT version();"
```

**Check Redis Health:**
```bash
# Via Upstash Dashboard → Database → Health
# Or via API:
curl -X GET "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

---

## Incident Response

### Severity Levels

**P0 - Critical:**
- Complete service outage
- Data loss
- Security breach
- **Response:** Immediate

**P1 - High:**
- Major feature degradation
- Billing failures
- High error rates
- **Response:** 15 minutes

**P2 - Medium:**
- Minor feature issues
- Performance degradation
- **Response:** 1 hour

**P3 - Low:**
- UI bugs
- Documentation issues
- **Response:** 4 hours

### Incident Response Process

1. **Detect:** Monitoring alerts, customer reports, manual checks
2. **Triage:** Assess severity, create incident ticket
3. **Investigate:** Check logs, dashboards, recent changes
4. **Communicate:** Update status page, notify customers if P0/P1
5. **Resolve:** Implement fix, verify, deploy
6. **Post-Mortem:** Document incident, identify improvements

### Common Incidents

**API Down:**
- Check Vercel deployment status
- Check database connectivity
- Check recent deployments
- Rollback if needed: `vercel rollback [deployment-url]`

**Billing Failures:**
- Check Stripe webhook events
- Check database subscription status
- Manually sync if needed (see "Recovering from Webhook Issues")

**High Error Rates:**
- Check application logs
- Check database query performance
- Check external API dependencies (Stripe, Shopify)
- Scale up if needed (Vercel auto-scales)

---

## Backup & Recovery

### What to Backup

**Database:**
- Supabase provides automated daily backups (free tier: 7 days retention)
- Manual backup: `pg_dump $DATABASE_URL > backup.sql`

**Secrets:**
- Store in password manager (1Password, LastPass)
- Document in secure location (not in git)

**Configuration:**
- Environment variables: Documented in `.env.example`
- Code: Version controlled in git

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from Supabase backup
# Supabase Dashboard → Database → Backups → Restore

# Or restore from manual backup
psql $DATABASE_URL < backup.sql
```

**Code Recovery:**
```bash
# Rollback to previous deployment
vercel rollback [deployment-url]

# Or rollback git commit
git revert [commit-hash]
git push origin main
```

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 1 hour

---

## Emergency Contacts

**Founder:** [To be filled in]  
**Stripe Support:** `https://support.stripe.com`  
**Supabase Support:** `https://supabase.com/support`  
**Vercel Support:** `https://vercel.com/support`

---

## Automation Opportunities

### Future Improvements

**Monitoring:**
- [ ] Set up Sentry for error tracking
- [ ] Set up Datadog/New Relic for APM
- [ ] Set up PagerDuty for on-call alerts

**Automation:**
- [ ] Automated daily health checks (cron job)
- [ ] Automated billing reconciliation (daily sync)
- [ ] Automated secret rotation (90-day schedule)

**Documentation:**
- [ ] Runbook for each critical system
- [ ] Troubleshooting guides
- [ ] Architecture diagrams

---

**Last Updated:** January 2026  
**Next Review:** Monthly or upon significant changes
