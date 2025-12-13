# Stripe Webhook Setup Guide

This guide explains how to configure and verify Stripe webhook endpoints for Settler.dev.

## Prerequisites

1. Stripe account (test or live)
2. Application deployed with webhook endpoint accessible
3. `STRIPE_WEBHOOK_SECRET` configured in environment variables

## Webhook Endpoint Configuration

### Production Endpoint

**URL:** `https://settler.dev/api/stripe/webhook`

**Events to Listen For:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription_schedule.created`
- ✅ `customer.subscription_schedule.updated`
- ✅ `customer.subscription_schedule.released`
- ✅ `customer.updated`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`
- ✅ `invoice.upcoming`
- ✅ `payment_method.attached`

---

## Setup Steps

### 1. Create Webhook Endpoint in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://settler.dev/api/stripe/webhook`
4. Select events to listen for (see list above)
5. Click "Add endpoint"

### 2. Get Webhook Signing Secret

1. After creating endpoint, click on it
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add to environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```

### 3. Test Webhook Endpoint

#### Using Stripe CLI (Recommended)

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Linux/Windows
   # Download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local endpoint:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Trigger test events:**
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed
   
   # Test subscription creation
   stripe trigger customer.subscription.created
   
   # Test payment failure
   stripe trigger invoice.payment_failed
   ```

#### Using Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your endpoint
3. Click "Send test webhook"
4. Select event type
5. Click "Send test webhook"
6. Check application logs for webhook processing

---

## Webhook Event Handling

### Event Processing Flow

```
Stripe Event → Webhook Endpoint → Signature Verification → Idempotency Check → Process Event → Update Database → Track Metrics
```

### Idempotency

All webhook events are processed idempotently:
- Events are stored in `stripe_events` table
- Duplicate events are detected and skipped
- Status tracked: `received`, `processed`, `failed`

### Error Handling

- **Signature Verification Failure:** Returns 400, event rejected
- **Processing Error:** Returns 500, Stripe retries automatically
- **Database Error:** Event marked as `failed`, logged for investigation

---

## Verification Checklist

### ✅ Endpoint Accessibility

- [ ] Webhook endpoint is publicly accessible
- [ ] HTTPS enabled (required by Stripe)
- [ ] Endpoint returns 200 for valid events
- [ ] Endpoint returns 400 for invalid signatures

### ✅ Event Processing

- [ ] `checkout.session.completed` creates subscription
- [ ] `customer.subscription.created` syncs to database
- [ ] `invoice.paid` updates subscription status
- [ ] `invoice.payment_failed` marks subscription as past_due
- [ ] `customer.subscription.deleted` cancels subscription

### ✅ Idempotency

- [ ] Duplicate events are detected
- [ ] Duplicate events return 200 without processing
- [ ] Events are stored in database

### ✅ Error Handling

- [ ] Invalid signatures return 400
- [ ] Processing errors return 500
- [ ] Failed events are logged
- [ ] Failed events can be retried

### ✅ Monitoring

- [ ] Webhook events are tracked in Sentry
- [ ] Payment failures trigger alerts
- [ ] Revenue events are tracked
- [ ] Business metrics are updated

---

## Testing Webhook Events

### Test Event: Checkout Completed

**Trigger:**
```bash
stripe trigger checkout.session.completed
```

**Expected Behavior:**
1. Webhook receives event
2. Subscription created in database
3. Billing account updated
4. Checkout completion tracked
5. Revenue tracked (if applicable)

**Verify:**
- Check database: `subscriptions` table has new record
- Check logs: "Checkout completed" message
- Check analytics: Conversion funnel updated

---

### Test Event: Payment Failed

**Trigger:**
```bash
stripe trigger invoice.payment_failed
```

**Expected Behavior:**
1. Webhook receives event
2. Subscription status updated to `past_due`
3. Payment failure tracked
4. Alert sent (if configured)

**Verify:**
- Check database: Subscription status is `past_due`
- Check Sentry: Payment failure event logged
- Check alerts: Notification received

---

### Test Event: Subscription Deleted

**Trigger:**
```bash
stripe trigger customer.subscription.deleted
```

**Expected Behavior:**
1. Webhook receives event
2. Subscription status updated to `canceled`
3. Cancellation tracked
4. Business metrics updated

**Verify:**
- Check database: Subscription status is `canceled`
- Check analytics: Cancellation tracked
- Check metrics: Churn rate updated

---

## Monitoring Webhook Health

### Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your endpoint
3. View "Recent deliveries" tab
4. Check for:
   - ✅ Successful deliveries (200 responses)
   - ⚠️ Failed deliveries (4xx/5xx responses)
   - ⏱️ Response times

### Application Logs

Monitor logs for:
- `[Stripe Webhook] Event received`
- `[Stripe Webhook] Event already processed`
- `[Stripe Webhook] Error processing webhook`

### Database Monitoring

Query `stripe_events` table:
```sql
-- Check recent events
SELECT event_id, type, status, created_at 
FROM stripe_events 
ORDER BY created_at DESC 
LIMIT 100;

-- Check failed events
SELECT event_id, type, error, created_at 
FROM stripe_events 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Issue: Webhook Not Receiving Events

**Possible Causes:**
1. Endpoint URL incorrect
2. Endpoint not publicly accessible
3. HTTPS not enabled
4. Firewall blocking requests

**Solutions:**
1. Verify endpoint URL in Stripe dashboard
2. Test endpoint accessibility: `curl https://settler.dev/api/stripe/webhook`
3. Check SSL certificate is valid
4. Review firewall rules

---

### Issue: Signature Verification Failing

**Possible Causes:**
1. `STRIPE_WEBHOOK_SECRET` not set
2. Wrong webhook secret
3. Request body modified

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` in environment variables
2. Copy correct signing secret from Stripe dashboard
3. Ensure raw request body is used (not parsed JSON)

---

### Issue: Events Not Processing

**Possible Causes:**
1. Database connection issues
2. Event processing errors
3. Idempotency check failing

**Solutions:**
1. Check database connectivity
2. Review error logs
3. Check `stripe_events` table for failed events
4. Manually retry failed events if needed

---

## Production Checklist

Before going live:

- [ ] Webhook endpoint configured in Stripe
- [ ] All required events selected
- [ ] `STRIPE_WEBHOOK_SECRET` set in production
- [ ] Endpoint tested with Stripe CLI
- [ ] Test events processed successfully
- [ ] Monitoring configured (Sentry, alerts)
- [ ] Error handling verified
- [ ] Idempotency verified
- [ ] Database migrations applied
- [ ] Documentation reviewed

---

## Security Best Practices

1. **Always verify signatures:** Never process webhooks without signature verification
2. **Use HTTPS:** Stripe requires HTTPS for webhook endpoints
3. **Keep secrets secure:** Never commit `STRIPE_WEBHOOK_SECRET` to version control
4. **Monitor failures:** Set up alerts for webhook processing failures
5. **Rate limiting:** Consider rate limiting webhook endpoint (Stripe has built-in rate limiting)

---

## Next Steps

1. ✅ Configure webhook endpoint in Stripe dashboard
2. ✅ Add `STRIPE_WEBHOOK_SECRET` to environment variables
3. ✅ Test webhook endpoint with Stripe CLI
4. ✅ Verify event processing
5. ✅ Set up monitoring and alerts
6. ✅ Document webhook handling procedures

For questions or issues, contact: ops@settler.dev
