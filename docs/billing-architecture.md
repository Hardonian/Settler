# Billing Architecture

This document describes the billing and subscription system for Settler.dev.

## Overview

Settler.dev uses Stripe for subscription management and billing. The system integrates with existing infrastructure:

- `BillingAccount` - Links users to Stripe customers
- `Subscription` - Tracks active subscriptions and plan details
- `UsageEvent` - Records API usage for quota enforcement
- `ApiKey` - Authenticates API requests and links to billing accounts

## Plan Model

### Plan Codes

- `free` - Free tier with basic limits
- `pro` - Pro tier ($99/month) with higher limits
- `scale` - Scale tier ($499/month) with very high limits

### Service Limits

Each plan includes monthly usage limits for:

1. **Reconcile API**
   - Free: 1,000 calls/month
   - Pro: 100,000 calls/month
   - Scale: 1,000,000 calls/month

2. **Receipts API**
   - Free: 100 parses/month
   - Pro: 10,000 parses/month
   - Scale: 100,000 parses/month

3. **Feature Flags API**
   - Free: 100,000 evaluations/month (generous free tier)
   - Pro: 1,000,000 evaluations/month
   - Scale: 10,000,000 evaluations/month

## Data Model

### BillingAccount ↔ Stripe Customer

- Each `BillingAccount` can have a `stripeCustomerId`
- Stripe customers are created on-demand when needed
- Customer metadata includes `billingAccountId` for webhook processing

### Subscription ↔ Stripe Subscription

- `Subscription` model tracks Stripe subscriptions
- `stripeSubscriptionId` links to Stripe subscription
- `planId` stores legacy plan ID (base/pro/enterprise) for compatibility
- Plan code is derived from metadata or mapped from `planId`

### ApiKey → BillingAccount

- API keys are associated with users via `user_id`
- Users have `BillingAccount` records
- Entitlement checks resolve: `ApiKey` → `user_id` → `BillingAccount` → `Subscription` → `Plan`

## Usage Accounting

### Event Types

Usage events use the format: `{service}:{operation}`

- `settler-reconcile:{operation}` - Reconcile API calls
- `settler-receipts:{operation}` - Receipt parsing operations
- `settler-feature-flags:{operation}` - Feature flag evaluations

### Billing Periods

- **Paid plans**: Uses `Subscription.currentPeriodStart` and `currentPeriodEnd`
- **Free plan**: Uses calendar month (1st to last day of month)

### Usage Aggregation

Usage is aggregated by:

- `billingAccountId`
- `eventType` (service prefix)
- `timestamp` (within billing period)

## Entitlement Enforcement

### Flow

1. API request authenticated via `ApiKey`
2. Resolve `billingAccountId` from API key's `user_id`
3. Get account's plan code (from subscription or default to `free`)
4. Get current period usage for the service
5. Compare usage against plan limits
6. Allow or reject with quota error

### Error Response

When quota is exceeded:

```json
{
  "error": "Plan Limit Exceeded",
  "code": "plan_limit_exceeded",
  "message": "You have exceeded your monthly quota for receipts. Current usage: 101/100.",
  "details": {
    "currentPlan": "free",
    "currentUsage": 101,
    "limit": 100,
    "upgradeUrl": "/console/billing"
  }
}
```

## Stripe Integration

### Checkout Sessions

- Created via `/api/stripe/checkout` endpoint
- Includes `billingAccountId` and `planCode` in metadata
- Redirects to Stripe-hosted checkout page

### Customer Portal

- Created via `/api/stripe/portal` endpoint
- Allows customers to manage payment methods, view invoices, cancel subscriptions
- Redirects to Stripe-hosted portal

### Webhooks

Webhook endpoint: `/api/stripe/webhook`

Handles events:

- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation
- `customer.updated` - Customer metadata updates
- `invoice.payment_succeeded` - Payment confirmation
- `invoice.payment_failed` - Payment failure

Webhook processing:

1. Verify signature with `STRIPE_WEBHOOK_SECRET`
2. Extract `billingAccountId` from subscription metadata
3. Sync subscription state to local `Subscription` model
4. Update `BillingAccount` if needed

## Developer Console

### Billing Page (`/console/billing`)

Shows:

- Current plan and subscription status
- Usage vs limits for all services
- Plan comparison and upgrade options
- Link to Stripe Customer Portal

### Usage Tracking

Usage is displayed in:

- Console Overview (`/console`)
- Usage & Metrics (`/console/usage`)
- Billing page (`/console/billing`)

## Environment Variables

Required Stripe configuration:

```bash
STRIPE_SECRET_KEY=sk_test_... # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
STRIPE_PRICE_ID_PRO=price_... # Pro plan price ID
STRIPE_PRICE_ID_SCALE=price_... # Scale plan price ID
```

## Future Enhancements

1. **Rate Limiting**: Add per-minute rate limits per plan
2. **Overage Billing**: Charge for usage beyond included limits
3. **Annual Plans**: Support annual billing with discounts
4. **Usage Alerts**: Notify users when approaching limits
5. **Usage Analytics**: Detailed usage breakdowns and trends

## Migration Notes

- Existing `Subscription` records use `planId` (base/pro/enterprise)
- New code maps these to `planCode` (free/pro/scale)
- Legacy compatibility maintained via `mapLegacyPlanId()`
- Free plan is default for accounts without subscriptions
