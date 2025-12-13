# Production Deployment Checklist

Complete this checklist before deploying Settler.dev to production.

## Pre-Deployment

### Environment Variables

- [ ] `STRIPE_SECRET_KEY` set (use `sk_live_xxx` for production)
- [ ] `STRIPE_WEBHOOK_SECRET` set (from Stripe dashboard)
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY` set
- [ ] `STRIPE_PRICE_ID_PRO_ANNUAL` set
- [ ] `STRIPE_PRICE_ID_SCALE_MONTHLY` set
- [ ] `STRIPE_PRICE_ID_SCALE_ANNUAL` set
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `SENTRY_DSN` set
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain

### Stripe Configuration

- [ ] Stripe products created (Pro, Scale)
- [ ] Monthly prices created
- [ ] Annual prices created
- [ ] Webhook endpoint configured: `https://settler.dev/api/stripe/webhook`
- [ ] Webhook events selected (all required events)
- [ ] Webhook signing secret copied to environment variables
- [ ] Test webhook delivery successful

### Database

- [ ] All migrations applied
- [ ] `stripe_events` table exists
- [ ] `billing_accounts` table exists
- [ ] `subscriptions` table exists
- [ ] `usage_events` table exists
- [ ] RLS policies enabled
- [ ] Database backups configured

### Monitoring

- [ ] Sentry project created
- [ ] Sentry DSN configured
- [ ] Sentry alerts configured (critical errors, billing errors, payment failures)
- [ ] Slack integration configured (optional)
- [ ] PagerDuty integration configured (optional)
- [ ] Error dashboard created

### Testing

- [ ] E2E tests pass locally
- [ ] E2E tests pass in CI/CD
- [ ] Manual checkout flow tested
- [ ] Annual billing tested
- [ ] Usage limit enforcement tested
- [ ] Webhook events tested
- [ ] Error handling tested

---

## Deployment Steps

### 1. Build Verification

```bash
npm run build
npm run typecheck
npm run lint
```

- [ ] Build succeeds without errors
- [ ] Type checking passes
- [ ] Linting passes

### 2. Deploy to Staging

- [ ] Deploy to staging environment
- [ ] Verify staging URL is accessible
- [ ] Run E2E tests against staging
- [ ] Test checkout flow in staging
- [ ] Verify webhook endpoint in staging

### 3. Final Verification

- [ ] All tests pass
- [ ] No critical errors in logs
- [ ] Webhook endpoint responding
- [ ] Checkout flow working
- [ ] Usage limits enforced

### 4. Deploy to Production

- [ ] Deploy to production
- [ ] Verify production URL is accessible
- [ ] Monitor error rates
- [ ] Verify webhook deliveries
- [ ] Test checkout flow in production

---

## Post-Deployment

### Immediate Checks (First 5 Minutes)

- [ ] Application is accessible
- [ ] No 500 errors in logs
- [ ] Webhook endpoint responding
- [ ] Checkout flow working
- [ ] Sentry receiving events

### First Hour

- [ ] Monitor error rates
- [ ] Check webhook delivery success rate
- [ ] Verify checkout completions
- [ ] Check payment processing
- [ ] Review Sentry alerts

### First Day

- [ ] Review error logs
- [ ] Check conversion funnel metrics
- [ ] Verify revenue tracking
- [ ] Review usage limit events
- [ ] Check customer feedback

---

## Rollback Plan

If issues are detected:

1. **Immediate Rollback:**
   - Revert deployment in Vercel
   - Restore previous version
   - Verify rollback successful

2. **Investigation:**
   - Review error logs
   - Check Sentry for errors
   - Review recent changes
   - Identify root cause

3. **Fix and Redeploy:**
   - Fix identified issues
   - Test fixes locally
   - Deploy fix
   - Verify resolution

---

## Monitoring Checklist

### Daily

- [ ] Check error rates in Sentry
- [ ] Review webhook delivery success rate
- [ ] Check payment failure rate
- [ ] Review usage limit events
- [ ] Check conversion funnel metrics

### Weekly

- [ ] Review business metrics
- [ ] Analyze error patterns
- [ ] Review customer feedback
- [ ] Check system performance
- [ ] Review security alerts

### Monthly

- [ ] Review error trends
- [ ] Analyze conversion rates
- [ ] Review churn rate
- [ ] Check system capacity
- [ ] Review security posture

---

## Emergency Contacts

- **Engineering:** engineering@settler.dev
- **Operations:** ops@settler.dev
- **Billing:** billing@settler.dev
- **On-Call:** Check PagerDuty

---

## Documentation

- [ ] Deployment guide reviewed
- [ ] Runbooks updated
- [ ] Team trained on procedures
- [ ] Monitoring dashboards accessible
- [ ] Alert procedures documented

---

## Sign-Off

- [ ] Technical Lead: ________________
- [ ] DevOps: ________________
- [ ] Product: ________________
- [ ] Date: ________________

---

**Status:** Ready for production deployment ✅
