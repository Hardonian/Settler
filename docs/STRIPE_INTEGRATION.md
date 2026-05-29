# Stripe Integration - Settler

**Date:** 2026-04-10  
**Status:** Active

---

## Pricing Tiers

| Tier       | Price  | Transactions |
| ---------- | ------ | ------------ |
| Free       | $0/mo  | 100/mo       |
| Starter    | $29/mo | 1,000/mo     |
| Growth     | $99/mo | 10,000/mo    |
| Enterprise | Custom | Unlimited    |

---

## Integration Flow

### 1. Subscription Creation

```typescript
// Package: @settler/billing
import { stripe } from "./stripe";

async function createSubscription(customerId: string, planId: string) {
  const plan = PLANS[planId];

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: plan.priceId }],
    metadata: {
      org_id: customerId,
      plan: planId,
    },
    expand: ["latest_invoice.payment_intent"],
  });

  return subscription;
}
```

### 2. Usage Tracking

```typescript
// Track usage via API
async function recordUsage(orgId: string, action: string) {
  const price = USAGE_PRICES[action]; // $0.01 per transaction

  await stripe.usageRecords.create(price, {
    quantity: 1,
    timestamp: Math.floor(Date.now() / 1000),
    metadata: { org_id: orgId },
  });
}

// Or batch
async function recordUsageBatch(orgId: string, transactions: Transaction[]) {
  await stripe.usageRecords.create(USAGE_PRICE, {
    quantity: transactions.length,
    timestamp: Math.floor(Date.now() / 1000),
  });
}
```

### 3. Webhook Handler

```typescript
// API: /api/stripe/webhook
async function handleWebhook(payload: string, signature: string) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
  }
}
```

### 4. Usage Calculation

```typescript
// Calculate monthly cost
async function calculateMonthlyCost(orgId: string): Promise<number> {
  const org = await db.organizations.findUnique({ where: { id: orgId } });
  const plan = PLANS[org.plan];

  const usage = await stripe.usageRecords.list(plan.priceId, {
    limit: 100,
  });

  let totalUsage = 0;
  for (const record of usage.data) {
    totalUsage += record.quantity;
  }

  const basePrice = plan.price;
  const usagePrice = totalUsage * 0.01;

  return basePrice + usagePrice;
}
```

---

## Revenue Metrics

```typescript
// Revenue dashboard queries
async function getRevenueMetrics() {
  const mrr = await stripe.subscriptions
    .list({
      status: "active",
      limit: 100,
    })
    .then(
      (subs) =>
        subs.data.reduce((sum, sub) => sum + (sub.items.data[0].price.unit_amount || 0), 0) / 100
    );

  const arr = mrr * 12;
  const churn = await getChurnRate(); // Calculate from cancelled subs

  return { mrr, arr, churn };
}
```

---

## Customer Portal

```typescript
// Generate billing portal link
async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}
```

---

## Environment Variables

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
```

---

_Status: Ready for production_
