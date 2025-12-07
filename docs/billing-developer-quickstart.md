# Billing System Developer Quick Start

Quick reference guide for developers working with the billing system.

## Architecture Overview

```
┌─────────────────┐
│   Web UI        │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  (Express)      │
│  /api/billing/* │
└────────┬────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  Supabase    │   │   Stripe      │
│  Database    │   │   API         │
└──────────────┘   └──────────────┘
         │
         ▼
┌──────────────┐
│ Edge Functions│
│ (Deno)        │
└──────────────┘
```

## Key Concepts

### 1. Billing Account
- One per user
- Links user to Stripe customer
- Stores billing preferences

### 2. Subscription
- Active subscription to base plan
- Tracks current billing period
- Links to Stripe subscription

### 3. Add-On Purchase
- Premium feature purchase
- Links to Stripe subscription item
- Enables specific integrations/features

### 4. Usage Events
- Individual usage occurrences
- Logged in real-time
- Aggregated daily for billing

## Common Tasks

### Create Billing Account

```typescript
POST /api/billing/create-customer
{
  "email": "user@example.com",
  "name": "John Doe"
}

Response:
{
  "billing_account_id": "uuid",
  "stripe_customer_id": "cus_...",
  "email": "user@example.com",
  "status": "active"
}
```

### Subscribe to Base Plan

```typescript
POST /api/billing/subscribe
{
  "billing_account_id": "uuid"
}

Response:
{
  "subscription_id": "uuid",
  "stripe_subscription_id": "sub_...",
  "status": "active",
  "client_secret": "pi_..." // For payment setup
}
```

### Purchase Add-On

```typescript
POST /api/billing/addon/purchase
{
  "billing_account_id": "uuid",
  "add_on_id": "uuid"
}

Response:
{
  "purchase_id": "uuid",
  "add_on_id": "uuid",
  "integration_id": "tiktok-shop",
  "name": "TikTok Shop + TikTok Ads",
  "status": "active"
}
```

### Log Usage Event

```typescript
POST /api/billing/usage/report
{
  "billing_account_id": "uuid",
  "event_type": "reconciliation_job",
  "quantity": 1,
  "integration_id": "stripe",
  "metadata": {
    "job_id": "uuid"
  }
}
```

### Get Estimated Bill

```typescript
GET /api/billing/invoice/estimate?billing_account_id=uuid&start_date=2025-01-01&end_date=2025-01-31

Response:
{
  "billing_account_id": "uuid",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "base_subscription_cost": 49.95,
  "add_on_costs": 39.95,
  "usage_costs": 15.00,
  "total_cost": 104.90,
  "currency": "usd"
}
```

## Feature Gating

### Gate a Route

```typescript
import { featureGate } from "../middleware/billing-gating";

router.post("/premium-feature",
  authMiddleware,
  featureGate("advanced_analytics"), // Requires Pro plan
  async (req, res) => {
    // Route handler
  }
);
```

### Check Integration Access

```typescript
import { checkIntegrationAccess } from "../middleware/billing-gating";

router.post("/integrations/:integrationId/sync",
  authMiddleware,
  checkIntegrationAccess(":integrationId"),
  async (req, res) => {
    // Route handler
  }
);
```

### Check Usage Quota

```typescript
import { checkUsageQuota } from "../middleware/billing-gating";

router.post("/jobs",
  authMiddleware,
  async (req, res, next) => {
    await checkUsageQuota(req, res, next, "reconciliation_job", 1);
  },
  async (req, res) => {
    // Create job
  }
);
```

## Usage Tracking

### Log Usage in Route

```typescript
import { logUsageEvent } from "../utils/usage-tracker";

router.post("/reconcile", authMiddleware, async (req: AuthRequest, res: Response) => {
  // Get billing account
  const billingAccount = await getBillingAccount(req.user.id);
  
  // Execute operation
  const result = await performReconciliation();
  
  // Log usage
  await logUsageEvent({
    billingAccountId: billingAccount.id,
    eventType: "reconciliation_job",
    quantity: 1,
    projectId: req.body.projectId,
    userId: req.user.id,
    tenantId: req.user.tenantId,
    integrationId: "stripe",
    metadata: { job_id: result.id },
  });
  
  return res.json(result);
});
```

### Get Current Usage

```typescript
import { getCurrentUsage } from "../utils/usage-tracker";

const usage = await getCurrentUsage(
  billingAccountId,
  "reconciliation_job",
  periodStart,
  periodEnd
);
```

## Database Queries

### Get Billing Account

```typescript
const { data: billingAccount } = await supabase
  .from("billing_accounts")
  .select("*")
  .eq("user_id", userId)
  .eq("status", "active")
  .single();
```

### Get Active Subscription

```typescript
const { data: subscription } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("billing_account_id", billingAccountId)
  .eq("status", "active")
  .single();
```

### Get Purchased Add-Ons

```typescript
const { data: addOns } = await supabase
  .from("add_on_purchases")
  .select("*, add_ons(*)")
  .eq("billing_account_id", billingAccountId)
  .eq("status", "active");
```

### Get Usage for Period

```typescript
const { data: usage } = await supabase
  .from("usage_aggregate_daily")
  .select("*")
  .eq("billing_account_id", billingAccountId)
  .eq("event_type", "reconciliation_job")
  .gte("date", startDate)
  .lte("date", endDate);
```

## Edge Functions

### Call Edge Function

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/log-usage`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    billing_account_id: billingAccountId,
    event_type: "reconciliation_job",
    quantity: 1,
  }),
});
```

## Stripe Integration

### Create Customer

```typescript
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: {
    user_id: userId,
    tenant_id: tenantId,
  },
});
```

### Create Subscription

```typescript
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: basePriceId }],
  payment_behavior: "default_incomplete",
  expand: ["latest_invoice.payment_intent"],
});
```

### Add Subscription Item (Add-On)

```typescript
const subscriptionItem = await stripe.subscriptionItems.create({
  subscription: subscriptionId,
  price: addOnPriceId,
  quantity: 1,
});
```

### Create Usage Record (Metered Billing)

```typescript
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  {
    quantity: usageQuantity,
    timestamp: Math.floor(Date.now() / 1000),
    action: "set",
  }
);
```

## Error Handling

### Handle Billing Errors

```typescript
try {
  // Billing operation
} catch (error) {
  if (error.type === "StripeCardError") {
    return res.status(402).json({
      error: "Payment Failed",
      message: error.message,
    });
  }
  
  if (error.code === "PGRST116") {
    return res.status(404).json({
      error: "Not Found",
      message: "Billing account not found",
    });
  }
  
  // Generic error
  return res.status(500).json({
    error: "Internal Server Error",
    message: "Billing operation failed",
  });
}
```

## Testing

### Mock Billing Account

```typescript
jest.mock("../infrastructure/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: "billing-account-id",
              user_id: "user-id",
              stripe_customer_id: "cus_test",
            },
          })),
        })),
      })),
    })),
  },
}));
```

### Mock Stripe

```typescript
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({
        id: "cus_test",
        email: "test@example.com",
      }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: "sub_test",
        status: "active",
      }),
    },
  }));
});
```

## Common Patterns

### Pattern 1: Check Access Before Operation

```typescript
router.post("/feature", authMiddleware, async (req, res) => {
  // 1. Get billing account
  const billingAccount = await getBillingAccount(req.user.id);
  if (!billingAccount) {
    return res.status(403).json({ error: "Billing account required" });
  }
  
  // 2. Check subscription
  const subscription = await getActiveSubscription(billingAccount.id);
  if (!subscription) {
    return res.status(403).json({ error: "Active subscription required" });
  }
  
  // 3. Check feature access
  if (subscription.plan_id !== "pro") {
    return res.status(403).json({ error: "Pro plan required" });
  }
  
  // 4. Perform operation
  const result = await performOperation();
  
  // 5. Log usage
  await logUsageEvent({...});
  
  return res.json(result);
});
```

### Pattern 2: Gate Multiple Features

```typescript
router.post("/advanced",
  authMiddleware,
  featureGate("advanced_analytics"),
  featureGate("realtime_dashboards"),
  async (req, res) => {
    // Both features required
  }
);
```

### Pattern 3: Conditional Feature Access

```typescript
const hasAccess = await checkFeatureAccess(
  billingAccountId,
  "tiktok_integration"
);

if (!hasAccess) {
  return res.status(403).json({
    error: "Add-on required",
    add_on: "tiktok-shop",
  });
}
```

## Troubleshooting

### Issue: "Billing account not found"
**Solution:** Create billing account first via `/api/billing/create-customer`

### Issue: "Active subscription required"
**Solution:** Subscribe to base plan via `/api/billing/subscribe`

### Issue: "Add-on required"
**Solution:** Purchase add-on via `/api/billing/addon/purchase`

### Issue: "Usage quota exceeded"
**Solution:** Upgrade plan or wait for next billing period

### Issue: "Stripe webhook signature verification failed"
**Solution:** Ensure webhook endpoint uses raw body, not parsed JSON

## Resources

- **Strategy Document:** `/docs/settler-pricing-strategy.md`
- **Implementation Progress:** `/docs/billing-implementation-progress.md`
- **Usage Tracking Examples:** `/docs/usage-tracking-integration-example.md`
- **API Routes:** `/packages/api/src/routes/billing.ts`
- **Feature Gating:** `/packages/api/src/middleware/billing-gating.ts`
- **Usage Tracker:** `/packages/api/src/utils/usage-tracker.ts`
