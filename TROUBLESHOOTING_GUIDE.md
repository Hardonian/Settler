# Troubleshooting Guide — Common Issues & Solutions

**Quick reference for common problems**

---

## Infrastructure Issues

### Sentry Not Working

**Symptoms:** Errors not appearing in Sentry dashboard

**Solutions:**
1. Check `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel
2. Verify DSN format: `https://xxx@sentry.io/xxx`
3. Check browser console for Sentry initialization errors
4. Verify Sentry package installed: `npm list @sentry/nextjs`
5. Check Sentry dashboard → Settings → Client Keys

**Prevention:** Test Sentry integration after setup

---

### Stripe Webhooks Not Working

**Symptoms:** Subscriptions not syncing, payments not processing

**Solutions:**
1. **Check Webhook Secret:**
   - Stripe Dashboard → Developers → Webhooks
   - Copy signing secret (starts with `whsec_`)
   - Verify matches `STRIPE_WEBHOOK_SECRET` in Vercel

2. **Check Webhook Endpoint:**
   - Verify URL: `https://settler.dev/api/stripe/webhook`
   - Test endpoint: Stripe Dashboard → Webhooks → Send test webhook

3. **Check Database:**
   - Verify `stripe_events` table exists
   - Check for failed events: `SELECT * FROM stripe_events WHERE status = 'failed';`
   - Check for duplicate events: `SELECT eventId, COUNT(*) FROM stripe_events GROUP BY eventId HAVING COUNT(*) > 1;`

4. **Check Logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for webhook processing errors
   - Check Sentry for errors

**Prevention:** Test webhook after setup, monitor failed events

---

### Database Connection Issues

**Symptoms:** API errors, "Connection refused", timeouts

**Solutions:**
1. **Check Supabase Connection:**
   - Supabase Dashboard → Settings → Database
   - Verify connection string matches env vars
   - Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

2. **Check Connection Pool:**
   - Supabase Dashboard → Database → Connection Pooling
   - Verify pool size (default: 20)
   - Check active connections: `SELECT count(*) FROM pg_stat_activity;`

3. **Check Database Limits:**
   - Supabase Dashboard → Settings → Usage
   - Verify not hitting limits (connections, storage, bandwidth)

4. **Check Network:**
   - Verify Supabase is accessible from Vercel
   - Check firewall rules (if self-hosted)

**Prevention:** Monitor connection pool usage, set up alerts

---

## Billing Issues

### Payments Not Processing

**Symptoms:** Checkout completes but subscription not created

**Solutions:**
1. **Check Stripe Dashboard:**
   - Stripe Dashboard → Payments
   - Verify payment succeeded
   - Check for webhook events

2. **Check Webhook Processing:**
   - Stripe Dashboard → Developers → Webhooks → Recent events
   - Verify `checkout.session.completed` event sent
   - Check webhook response (should be 200)

3. **Check Database:**
   - Verify subscription created: `SELECT * FROM subscriptions WHERE stripeSubscriptionId = 'sub_xxx';`
   - Check for webhook events: `SELECT * FROM stripe_events WHERE type = 'checkout.session.completed';`

4. **Manual Recovery:**
   - If webhook failed, manually sync subscription:
     - Stripe Dashboard → Subscriptions → [Subscription] → Copy ID
     - Use Stripe API to fetch subscription
     - Manually create subscription in database (if needed)

**Prevention:** Monitor webhook success rate, set up alerts

---

### Subscription Not Syncing

**Symptoms:** Subscription exists in Stripe but not in database

**Solutions:**
1. **Check Webhook Events:**
   - Stripe Dashboard → Developers → Webhooks → Recent events
   - Look for `customer.subscription.created` or `customer.subscription.updated`
   - Verify webhook processed successfully

2. **Check Database:**
   - Verify `subscriptions` table exists
   - Check for subscription: `SELECT * FROM subscriptions WHERE stripeSubscriptionId = 'sub_xxx';`

3. **Manual Sync:**
   - Stripe Dashboard → Subscriptions → [Subscription]
   - Copy subscription ID
   - Trigger webhook manually: Stripe Dashboard → Webhooks → Send test webhook
   - Or manually create subscription in database

**Prevention:** Monitor webhook processing, set up alerts

---

## API Issues

### API Returns 500 Errors

**Symptoms:** API endpoints returning 500 status codes

**Solutions:**
1. **Check Sentry:**
   - Sentry Dashboard → Issues
   - Look for recent errors
   - Check error details and stack trace

2. **Check Vercel Logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for error messages
   - Check function execution time (timeout?)

3. **Check Database:**
   - Verify database connection
   - Check for connection pool exhaustion
   - Verify queries are not timing out

4. **Check Environment Variables:**
   - Verify all required env vars set
   - Check for typos in variable names
   - Verify values are correct

**Prevention:** Set up Sentry alerts, monitor error rates

---

### API Slow Response Times

**Symptoms:** API takes >2 seconds to respond

**Solutions:**
1. **Check Database Queries:**
   - Supabase Dashboard → Database → Query Performance
   - Look for slow queries
   - Add indexes if needed

2. **Check External APIs:**
   - Verify adapter APIs are responding quickly
   - Check for rate limiting
   - Verify circuit breakers not opening

3. **Check Function Timeout:**
   - Vercel Dashboard → Functions → Settings
   - Verify timeout set appropriately (default: 10s)
   - Consider increasing if needed

4. **Check Caching:**
   - Verify Redis/Upstash is working
   - Check cache hit rates
   - Increase cache TTL if appropriate

**Prevention:** Monitor response times, set up performance alerts

---

## Adapter Issues

### Adapter Authentication Failing

**Symptoms:** "Authentication failed", "Invalid credentials"

**Solutions:**
1. **Verify Credentials:**
   - Check API keys are correct
   - Verify keys are not expired
   - Check key permissions/scopes

2. **Check OAuth Flow:**
   - Verify OAuth redirect URLs match
   - Check access tokens are valid
   - Verify refresh tokens work

3. **Check API Status:**
   - Verify external API is not down
   - Check API status page (Stripe, Shopify, etc.)
   - Verify API version is correct

4. **Check Circuit Breaker:**
   - Verify circuit breaker not open
   - Check failure count
   - Reset circuit breaker if needed

**Prevention:** Test adapters regularly, monitor failure rates

---

### Adapter Rate Limiting

**Symptoms:** "Rate limit exceeded", 429 errors

**Solutions:**
1. **Check Rate Limits:**
   - Verify rate limits in adapter documentation
   - Check current usage
   - Implement exponential backoff (already done)

2. **Reduce Request Frequency:**
   - Increase delay between requests
   - Batch requests if possible
   - Use webhooks instead of polling

3. **Request Higher Limits:**
   - Contact API provider
   - Request rate limit increase
   - Upgrade API plan if needed

**Prevention:** Monitor rate limit usage, set up alerts

---

## User Experience Issues

### Errors Not User-Friendly

**Symptoms:** Users see technical error messages

**Solutions:**
1. **Check Error Handling:**
   - Verify `toUserFriendlyError` is being used
   - Check error boundaries are in place
   - Verify toast notifications working

2. **Test Error Scenarios:**
   - Trigger various errors (network, timeout, server)
   - Verify user-friendly messages appear
   - Verify retry buttons work

**Prevention:** Test error handling regularly, review user feedback

---

### Loading States Not Showing

**Symptoms:** No loading indicators, users confused

**Solutions:**
1. **Check Loading State Manager:**
   - Verify `globalLoadingState` is being used
   - Check `LoadingSpinner` component is imported
   - Verify loading states are set correctly

2. **Check Component Implementation:**
   - Verify components use `useLoadingState` hook
   - Check loading states are set before async operations
   - Verify loading states are cleared after completion

**Prevention:** Test loading states, review UX regularly

---

## Quick Fixes

### Reset Circuit Breaker

```typescript
import { getCircuitBreaker } from '@/lib/resilience/circuit-breaker';

const breaker = getCircuitBreaker('service-name');
breaker.reset();
```

### Manually Sync Stripe Subscription

1. Stripe Dashboard → Subscriptions → [Subscription] → Copy ID
2. Use Stripe API to fetch subscription
3. Manually create/update in database (if webhook failed)

### Check Environment Variables

```bash
# In Vercel Dashboard → Settings → Environment Variables
# Or locally:
cat .env | grep STRIPE
cat .env | grep SENTRY
cat .env | grep SUPABASE
```

### Test Webhook Locally

```bash
# Use Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

---

## Emergency Procedures

### Complete Service Outage

1. **Check Vercel Status:**
   - https://vercel-status.com/
   - Check if Vercel is down

2. **Check Supabase Status:**
   - https://status.supabase.com/
   - Check if Supabase is down

3. **Check Stripe Status:**
   - https://status.stripe.com/
   - Check if Stripe is down

4. **Rollback Deployment:**
   - Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "Promote to Production"

5. **Notify Users:**
   - Update status page
   - Send email to affected users (if critical)

### Data Loss Suspected

1. **Stop All Operations:**
   - Pause new signups (if possible)
   - Stop processing new data

2. **Check Backups:**
   - Supabase Dashboard → Database → Backups
   - Verify backups exist
   - Check backup dates

3. **Restore from Backup:**
   - Supabase Dashboard → Database → Backups → Restore
   - Or use `pg_restore` command

4. **Investigate Cause:**
   - Check logs for suspicious activity
   - Review recent changes
   - Document incident

### Security Breach Suspected

1. **Immediate Actions:**
   - Rotate all secrets (JWT_SECRET, ENCRYPTION_KEY, API keys)
   - Revoke compromised API keys
   - Isolate affected systems

2. **Investigation:**
   - Review access logs
   - Check for unauthorized access
   - Document incident

3. **Notification:**
   - Notify affected users (if PII/data breach)
   - Report to authorities (if required by law)
   - Post-mortem and remediation

---

## Getting Help

### Internal Resources
- `OPERATIONS_RUNBOOK.md` — Detailed operations procedures
- `INVESTOR_OVERVIEW.md` — Business context
- `PRODUCT_OVERVIEW.md` — Product details

### External Resources
- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support
- **Sentry Support:** https://sentry.io/support

### Communities
- **Stripe Discord:** https://discord.gg/stripe
- **Supabase Discord:** https://discord.supabase.com
- **Next.js Discord:** https://nextjs.org/discord

---

**Last Updated:** January 2026
