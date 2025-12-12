# Stripe Webhook Configuration Guide

## Overview

This guide walks you through configuring Stripe webhooks for the Settler billing system. The webhook endpoint handles subscription lifecycle events and ensures idempotent processing.

---

## Step 1: Configure Webhook Endpoint in Stripe Dashboard

### For Production
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://settler.dev/api/stripe/webhook`
   - Replace `settler.dev` with your actual domain
4. **Description**: "Settler Billing Webhook"

### For Development/Testing
1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Or use Stripe test mode webhook endpoint:
   - URL: `https://your-preview-url.vercel.app/api/stripe/webhook`

---

## Step 2: Select Events to Subscribe

Subscribe to the following events:

### Required Events
- ✅ `checkout.session.completed` - When checkout completes
- ✅ `customer.subscription.created` - New subscription created
- ✅ `customer.subscription.updated` - Subscription updated (plan change, etc.)
- ✅ `customer.subscription.deleted` - Subscription cancelled
- ✅ `invoice.paid` - Invoice payment succeeded
- ✅ `invoice.payment_failed` - Invoice payment failed

### Optional Events (Recommended)
- `customer.updated` - Customer metadata updates

### How to Add Events
1. In webhook endpoint settings, click **Select events**
2. Search and select each event above
3. Click **Add events**
4. Click **Add endpoint** to save

---

## Step 3: Get Webhook Signing Secret

### Production
1. After creating the webhook endpoint, click on it
2. In the **Signing secret** section, click **Reveal**
3. Copy the secret (starts with `whsec_`)

### Development (Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Output will show: Ready! Your webhook signing secret is whsec_...
```

---

## Step 4: Set Environment Variable

### Vercel (Production/Preview)
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (from Step 3)
   - **Environment**: Production, Preview, Development (as needed)
3. Click **Save**

### Local Development (.env.local)
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### GitHub Secrets (for CI/CD)
If using GitHub Actions:
1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Add repository secret:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...`

---

## Step 5: Verify Webhook Configuration

### Test Webhook Delivery
1. In Stripe Dashboard → **Webhooks** → Your endpoint
2. Click **Send test webhook**
3. Select event: `checkout.session.completed`
4. Click **Send test webhook**

### Check Logs
- **Vercel**: Go to **Deployments** → **Functions** → `/api/stripe/webhook` → **Logs**
- **Local**: Check terminal output
- **Expected**: `200 OK` response

### Verify Database
After sending test webhook, check database:
```sql
SELECT event_id, type, status, received_at, processed_at 
FROM stripe_events 
ORDER BY received_at DESC 
LIMIT 5;
```

Expected: Event recorded with `status = 'processed'`

---

## Step 6: Test End-to-End Flow

### 1. Create Test Checkout Session
```bash
# Via API or UI
curl -X POST https://settler.dev/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "planCode": "pro",
    "successUrl": "https://settler.dev/billing/success?session_id={CHECKOUT_SESSION_ID}",
    "cancelUrl": "https://settler.dev/pricing?canceled=1"
  }'
```

### 2. Complete Checkout in Stripe Test Mode
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### 3. Verify Webhook Received
- Check Stripe Dashboard → **Webhooks** → **Recent deliveries**
- Should show `checkout.session.completed` event
- Status should be `200 OK`

### 4. Verify Subscription Created
```sql
SELECT id, plan_name, status, stripe_subscription_id 
FROM subscriptions 
WHERE billing_account_id = 'your-billing-account-id'
ORDER BY created_at DESC 
LIMIT 1;
```

### 5. Verify Console Shows Subscription
- Visit `/console/billing`
- Should show active subscription

---

## Troubleshooting

### Webhook Returns 400: "Missing stripe-signature header"
- **Cause**: Webhook not configured correctly
- **Fix**: Ensure webhook URL is correct and Stripe is sending signature header

### Webhook Returns 400: "Webhook Error: No signatures found"
- **Cause**: Signature verification failed
- **Fix**: Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard secret

### Webhook Returns 500: "Webhook processing failed"
- **Cause**: Error processing event (check logs)
- **Fix**: 
  1. Check Vercel function logs
  2. Verify database connection
  3. Check `stripe_events` table exists
  4. Verify billing account exists

### Duplicate Events Processed
- **Cause**: Idempotency not working
- **Fix**: 
  1. Verify `stripe_events` table exists
  2. Check unique constraint on `event_id`
  3. Verify webhook code uses database idempotency

### Events Not Appearing in Database
- **Cause**: Webhook not receiving events or database error
- **Fix**:
  1. Check Stripe Dashboard → Webhooks → Recent deliveries
  2. Verify webhook endpoint is active
  3. Check database connection
  4. Review function logs for errors

---

## Monitoring

### Stripe Dashboard
- **Webhooks** → **Recent deliveries**: See all webhook attempts
- **Events**: See all Stripe events (not just webhooks)

### Database Monitoring
```sql
-- Recent webhook events
SELECT 
  event_id,
  type,
  status,
  received_at,
  processed_at,
  error
FROM stripe_events
ORDER BY received_at DESC
LIMIT 20;

-- Failed events
SELECT *
FROM stripe_events
WHERE status = 'failed'
ORDER BY received_at DESC;

-- Processing time
SELECT 
  type,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at))) as avg_processing_seconds,
  COUNT(*) as count
FROM stripe_events
WHERE processed_at IS NOT NULL
GROUP BY type;
```

### Vercel Logs
- **Deployments** → **Functions** → `/api/stripe/webhook` → **Logs**
- Filter for: `[Stripe Webhook]`

---

## Security Best Practices

1. ✅ **Always verify webhook signature** (already implemented)
2. ✅ **Use HTTPS** for webhook endpoint (required by Stripe)
3. ✅ **Store webhook secret securely** (environment variable, not in code)
4. ✅ **Idempotent processing** (database-backed, already implemented)
5. ✅ **Log all events** (stripe_events table for audit trail)
6. ✅ **Handle failures gracefully** (return 500 for retries, log errors)

---

## Webhook Endpoint Details

- **URL**: `/api/stripe/webhook`
- **Method**: `POST`
- **Runtime**: Node.js (required for Prisma)
- **Auth**: None (bypassed in middleware)
- **Body**: Raw (required for signature verification)

---

## Next Steps

After webhook is configured:

1. ✅ Test with Stripe test mode
2. ✅ Monitor first few production events
3. ✅ Set up alerts for failed webhooks
4. ✅ Document webhook event handling for team

---

Generated: 2025-01-21
