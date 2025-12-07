# Stripe Catalog Configuration

Reference for Stripe products, prices, and webhook configuration.

## Products

### Base Plan Product

**Product ID:** `prod_base_plan` (configurable via env)  
**Name:** Settler Core  
**Description:** Base reconciliation plan with 5 standard integrations

**Monthly Price:**

- Price ID: `price_base_plan` (configurable via env)
- Amount: $49.95/month
- Billing: Recurring monthly
- Currency: USD

### Premium Add-On Products

#### TikTok Shop + TikTok Ads

**Product ID:** `prod_tiktok`  
**Name:** TikTok Shop + TikTok Ads  
**Prices:**

- Monthly: $39.95/month (recurring)
- Usage: $0.02 per order (metered)
- Usage: $0.01 per ad event (metered)

#### Wix Stores

**Product ID:** `prod_wix`  
**Name:** Wix Stores  
**Prices:**

- Monthly: $19.95/month (recurring)
- Usage: $0.01 per order (metered)

#### Google Analytics GA4 Deep Sync

**Product ID:** `prod_ga4`  
**Name:** Google Analytics GA4 Deep Sync  
**Prices:**

- Monthly: $29.95/month (recurring)
- Usage: $0.005 per event (metered)

#### PayPal Payouts + Automation

**Product ID:** `prod_paypal_payouts`  
**Name:** PayPal Payouts + Automation  
**Prices:**

- Monthly: $49.95/month (recurring)
- Usage: $0.03 per payout (metered)

#### WhatsApp Business + Telegram Messaging

**Product ID:** `prod_whatsapp_telegram`  
**Name:** WhatsApp Business + Telegram Messaging  
**Prices:**

- Monthly: $79.95/month (recurring)
- Usage: $0.001 per message (metered)

## Setup Script

Run the setup script to create all products and prices:

```bash
tsx scripts/setup-stripe-products.ts
```

This script:

1. Creates all products in Stripe
2. Creates monthly recurring prices
3. Creates metered usage prices
4. Outputs product/price IDs for environment variables

## Environment Variables

After running the setup script, add to `.env`:

```bash
# Base Plan
STRIPE_PRODUCT_BASE_PLAN=prod_...
STRIPE_PRICE_BASE_PLAN=price_...

# Add-Ons
STRIPE_PRODUCT_ADDON_TIKTOK=prod_...
STRIPE_PRODUCT_ADDON_WIX=prod_...
STRIPE_PRODUCT_ADDON_GA4=prod_...
STRIPE_PRODUCT_ADDON_PAYPAL_PAYOUTS=prod_...
STRIPE_PRODUCT_ADDON_WHATSAPP_TELEGRAM=prod_...
```

## Webhook Configuration

### Webhook Endpoint

**URL:** `https://your-domain.com/api/billing/webhook`

### Required Events

Subscribe to these events in Stripe Dashboard:

1. **customer.subscription.created**
   - Triggered when subscription is created
   - Creates subscription record in database

2. **customer.subscription.updated**
   - Triggered when subscription changes
   - Updates subscription status, period dates

3. **customer.subscription.deleted**
   - Triggered when subscription is canceled
   - Marks subscription as cancelled

4. **invoice.paid**
   - Triggered when invoice is paid
   - Updates billing account status
   - Sends confirmation email

5. **invoice.payment_failed**
   - Triggered when payment fails
   - Updates billing account status
   - Sends failure notification

6. **invoice.upcoming**
   - Triggered 7 days before invoice
   - Sends reminder email
   - Checks for usage overages

7. **customer.created**
   - Triggered when customer is created
   - Links Stripe customer to billing account

8. **customer.updated**
   - Triggered when customer is updated
   - Updates billing account information

### Webhook Secret

Store webhook secret in environment:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Metered Billing

### Usage Record Creation

Usage records are created via `sync-usage-to-stripe` edge function:

```typescript
await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
  quantity: usageQuantity,
  timestamp: Math.floor(Date.now() / 1000),
  action: "set",
});
```

### Usage Record Timing

- Created daily via scheduled job
- Timestamped for previous day
- Aggregated from `usage_aggregate_daily` table

## Subscription Lifecycle

### Subscription Creation

1. Customer creates billing account
2. Customer subscribes to base plan
3. Stripe creates subscription
4. Webhook creates subscription record
5. Customer can purchase add-ons

### Add-On Purchase

1. Customer purchases add-on via API
2. Add subscription item to Stripe subscription
3. Create add-on purchase record
4. Add-on immediately available

### Subscription Cancellation

1. Customer cancels subscription
2. Stripe sets `cancel_at_period_end`
3. Webhook updates subscription status
4. Access continues until period end
5. Subscription cancelled at period end

## Testing

### Test Mode

Use Stripe test mode for development:

- Test API keys: `sk_test_...`
- Test webhook secret: `whsec_test_...`
- Test cards: https://stripe.com/docs/testing

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Monitoring

### Stripe Dashboard

Monitor in Stripe Dashboard:

- Subscription metrics
- Revenue analytics
- Failed payments
- Webhook delivery

### Application Logs

All Stripe operations are logged:

- Webhook events in `stripe_event_log` table
- API calls in application logs
- Errors in error tracking system

## Security

### Webhook Signature Verification

All webhooks verify HMAC signatures:

```typescript
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
```

### API Key Security

- Store Stripe keys in environment variables
- Never commit keys to version control
- Rotate keys regularly
- Use different keys for test/production

## Best Practices

1. **Idempotency**: All webhook handlers are idempotent
2. **Error Handling**: Failed webhooks are logged and retried
3. **Rate Limiting**: Respect Stripe API rate limits
4. **Webhook Retries**: Stripe automatically retries failed webhooks
5. **Event Logging**: All events logged in `stripe_event_log` table
