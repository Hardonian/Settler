# Billing & Monetization Setup Guide

This guide covers setting up Stripe integration, testing billing flows, and understanding the monetization system.

## Overview

Settler uses Stripe for subscription management with the following features:
- **Plan Tiers**: Free, Pro ($99/month), Scale ($499/month)
- **Usage Tracking**: Ingestion jobs, exports, reconciliations, receipts, feature flags
- **Entitlement Enforcement**: Server-side middleware checks limits before operations
- **Customer Portal**: Self-serve subscription management via Stripe Customer Portal
- **Demo Mode**: Graceful fallback when Stripe is not configured

## Setup Steps

### 1. Stripe Account Setup

1. Create a Stripe account at https://stripe.com
2. Navigate to **Products** in Stripe Dashboard
3. Create products for each plan:
   - **Pro Plan**: $99/month (or $990/year)
   - **Scale Plan**: $499/month (or $4,990/year)

### 2. Environment Variables

Add the following environment variables:

```bash
# Stripe API Keys (from Stripe Dashboard > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_...  # Test mode key for development
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional, for client-side Stripe.js

# Stripe Price IDs (from Products > Pricing)
STRIPE_PRICE_ID_PRO=price_...  # Pro plan monthly price ID
STRIPE_PRICE_ID_SCALE=price_...  # Scale plan monthly price ID

# Webhook Secret (after configuring webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=https://settler.dev
NEXT_PUBLIC_SITE_URL=https://settler.dev
```

### 3. Webhook Configuration

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Database Setup

The billing schema is already defined in Prisma. Run migrations:

```bash
npx prisma migrate dev
```

Key tables:
- `billing_accounts`: User billing accounts
- `subscriptions`: Active subscriptions
- `usage_events`: Individual usage events
- `usage_aggregate_daily`: Daily aggregated usage
- `usage_counters`: Period-based usage counters

## Plan Limits

### Free Plan
- **Reconciliations**: 1,000/month
- **Receipts**: 100/month
- **Feature Flags**: 100k evaluations/month
- **Ingestions**: 100/month
- **Exports**: 50/month

### Pro Plan ($99/month)
- **Reconciliations**: 100,000/month
- **Receipts**: 10,000/month
- **Feature Flags**: 1M evaluations/month
- **Ingestions**: 10,000/month
- **Exports**: 5,000/month
- **AI Tokens**: 100k/month included
- **AI Insights**: Enabled
- **Priority Support**: Enabled

### Scale Plan ($499/month)
- **Reconciliations**: 1M/month
- **Receipts**: 100k/month
- **Feature Flags**: 10M evaluations/month
- **Ingestions**: 100k/month
- **Exports**: 50k/month
- **AI Tokens**: 1M/month included
- **AI Insights**: Enabled
- **Priority Support**: Enabled
- **Custom Integrations**: Enabled

## Testing with Stripe Test Mode

### Test Cards

Use these test card numbers in Stripe Checkout:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`
- Expiry: Any future date
- CVC: Any 3 digits

**Declined Card:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

**Insufficient Funds:**
- Card: `4000 0000 0000 9995`
- Expiry: Any future date
- CVC: Any 3 digits

### Testing Flow

1. **Start Checkout:**
   - Navigate to `/pricing`
   - Click "Upgrade Now" on Pro or Scale plan
   - Should redirect to Stripe Checkout

2. **Complete Payment:**
   - Use test card `4242 4242 4242 4242`
   - Complete checkout
   - Should redirect to `/console/billing?success=true`

3. **Verify Subscription:**
   - Check `/console/billing` page
   - Should show active subscription
   - Usage limits should reflect new plan

4. **Test Usage Limits:**
   - Create ingestion jobs until limit is reached
   - Should see 403 error with upgrade prompt when limit exceeded

5. **Test Customer Portal:**
   - Click "Manage Billing" on `/console/billing`
   - Should open Stripe Customer Portal
   - Can cancel, update payment method, etc.

### Testing Webhooks Locally

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
```

## Demo Mode

If `STRIPE_SECRET_KEY` is not set, the app runs in **demo mode**:

- Checkout sessions return mock URLs
- Customer portal returns mock URLs
- No actual Stripe API calls are made
- App continues to function normally
- Usage tracking still works (for testing)

To enable demo mode, simply omit `STRIPE_SECRET_KEY` from environment variables.

## Usage Tracking

Usage is tracked automatically when:
- **Ingestions**: Created via `/api/v1/ingestion/upload` or ingestion sources
- **Exports**: Created via `/api/v1/ingestion/exports`
- **Reconciliations**: Tracked via reconciliation service
- **Receipts**: Tracked via receipt parsing API
- **Feature Flags**: Tracked via feature flag evaluations

Usage events are stored in `usage_events` table and aggregated daily in `usage_aggregate_daily`.

## Entitlement Enforcement

### Server-Side Middleware

API routes use middleware to check limits:

```typescript
import { checkIngestionLimit, checkExportLimit } from '@/middleware/usage-enforcement';

router.post('/upload', checkIngestionLimit(), async (req, res) => {
  // Route handler
});
```

### Client-Side Checks

Frontend checks entitlements before showing UI:

```typescript
import { checkEntitlement } from '@/domain/billing/entitlements';

const result = await checkEntitlement(billingAccountId, 'ingestions');
if (!result.allowed) {
  // Show upgrade prompt
}
```

## Retention Features

### Lifecycle Hooks

The system includes hooks for retention (currently stubbed, ready for implementation):

1. **Trial Ending**: Triggered when trial period ends
2. **Approaching Limit**: Triggered at 75% and 90% of usage limits
3. **Inactive User**: Triggered after 7 days of inactivity

### Email Notifications

Email hooks are stubbed in:
- `packages/api/src/routes/billing.ts` (webhook handlers)
- Can be extended with email service integration

## Troubleshooting

### Checkout Not Working

1. Verify `STRIPE_SECRET_KEY` is set
2. Check `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_SCALE` match Stripe Dashboard
3. Verify webhook endpoint is configured
4. Check browser console for errors

### Usage Not Tracking

1. Verify billing account exists for user
2. Check `usage_events` table for events
3. Verify event types match: `settler-ingestions:create`, `settler-exports:create`
4. Check aggregation job is running (if using daily aggregation)

### Subscription Not Syncing

1. Verify webhook secret matches Stripe Dashboard
2. Check webhook events are being received (Stripe Dashboard > Webhooks)
3. Check application logs for webhook processing errors
4. Verify `billingAccountId` is in subscription metadata

## Production Checklist

Before going live:

- [ ] Switch to Stripe **Live Mode** API keys
- [ ] Update `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_SCALE` to live price IDs
- [ ] Configure production webhook endpoint
- [ ] Test checkout flow with real card (use small amount)
- [ ] Test subscription cancellation
- [ ] Test upgrade/downgrade flows
- [ ] Verify usage tracking is accurate
- [ ] Set up monitoring/alerts for failed payments
- [ ] Configure email notifications for billing events
- [ ] Review Stripe Dashboard settings (tax, invoices, etc.)

## Support

For billing-related issues:
- Check Stripe Dashboard for payment status
- Review application logs for webhook processing
- Verify database state matches Stripe state
- Use Stripe CLI for local testing

## References

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
