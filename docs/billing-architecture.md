# Billing Architecture Documentation

## Overview

Settler.dev's billing system is a comprehensive subscription and usage-based billing platform that integrates with Stripe for payment processing and Supabase for data storage. The system supports base subscriptions, premium add-ons, and metered usage billing.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Web UI (Next.js)                     │
│  /dashboard/billing, /dashboard/addons, /dashboard/usage   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                      │
│  /api/billing/* - Customer, Subscription, Add-Ons, Usage     │
└───────────────┬───────────────────────┬───────────────────┘
                │                         │
                ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   Supabase Database      │  │      Stripe API               │
│  - billing_accounts      │  │  - Customers                  │
│  - subscriptions         │  │  - Subscriptions              │
│  - add_ons               │  │  - Products & Prices          │
│  - add_on_purchases      │  │  - Usage Records               │
│  - usage_events         │  │  - Webhooks                    │
│  - usage_aggregate_daily│  └──────────────────────────────┘
└───────────────┬──────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│              Edge Functions (Deno)                          │
│  - log-usage, compute-bill, sync-usage-to-stripe            │
│  - integration-sync-* (per integration)                     │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

#### billing_accounts
Stores customer billing information and links to Stripe customers.

- `id` (UUID) - Primary key
- `user_id` (UUID) - Links to users table
- `tenant_id` (UUID) - Optional tenant association
- `stripe_customer_id` (VARCHAR) - Stripe customer ID
- `email` (VARCHAR) - Billing email
- `status` (VARCHAR) - active, suspended, cancelled
- `currency` (VARCHAR) - Default currency (default: usd)

#### subscriptions
Tracks active subscriptions to base plans.

- `id` (UUID) - Primary key
- `billing_account_id` (UUID) - Foreign key to billing_accounts
- `stripe_subscription_id` (VARCHAR) - Stripe subscription ID
- `plan_id` (VARCHAR) - base, pro, enterprise
- `plan_name` (VARCHAR) - Human-readable plan name
- `status` (VARCHAR) - active, cancelled, past_due, trialing
- `current_period_start` (TIMESTAMPTZ) - Billing period start
- `current_period_end` (TIMESTAMPTZ) - Billing period end

#### add_ons
Catalog of available add-ons (both standard and premium).

- `id` (UUID) - Primary key
- `integration_id` (VARCHAR) - Unique integration identifier
- `name` (VARCHAR) - Display name
- `base_price_monthly` (DECIMAL) - Monthly base price
- `usage_price_per_unit` (DECIMAL) - Per-unit usage price
- `usage_unit` (VARCHAR) - Unit type (order, event, message, etc.)
- `is_standard` (BOOLEAN) - Included in base plan
- `is_active` (BOOLEAN) - Available for purchase

#### add_on_purchases
Tracks purchased add-ons for each billing account.

- `id` (UUID) - Primary key
- `billing_account_id` (UUID) - Foreign key to billing_accounts
- `add_on_id` (UUID) - Foreign key to add_ons
- `stripe_subscription_item_id` (VARCHAR) - Stripe subscription item ID
- `status` (VARCHAR) - active, cancelled, expired

#### usage_events
Individual usage events logged in real-time.

- `id` (UUID) - Primary key
- `billing_account_id` (UUID) - Foreign key to billing_accounts
- `event_type` (VARCHAR) - Type of event (reconciliation_job, api_request, etc.)
- `quantity` (DECIMAL) - Quantity of usage
- `integration_id` (VARCHAR) - Optional integration identifier
- `add_on_id` (UUID) - Optional add-on identifier
- `timestamp` (TIMESTAMPTZ) - When event occurred
- `aggregated` (BOOLEAN) - Whether event has been aggregated

#### usage_aggregate_daily
Daily aggregated usage for billing calculations.

- `id` (UUID) - Primary key
- `billing_account_id` (UUID) - Foreign key to billing_accounts
- `date` (DATE) - Date of aggregation
- `event_type` (VARCHAR) - Type of event
- `total_quantity` (DECIMAL) - Total quantity for the day
- `event_count` (INTEGER) - Number of events
- `estimated_cost` (DECIMAL) - Estimated cost for this usage

## API Endpoints

### Billing Account Management

#### POST /api/billing/create-customer
Creates or retrieves a billing account and Stripe customer.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "billing_account_id": "uuid",
  "stripe_customer_id": "cus_...",
  "email": "user@example.com",
  "status": "active"
}
```

### Subscription Management

#### POST /api/billing/subscribe
Subscribes a billing account to the base plan.

**Request:**
```json
{
  "billing_account_id": "uuid"
}
```

**Response:**
```json
{
  "subscription_id": "uuid",
  "stripe_subscription_id": "sub_...",
  "status": "active",
  "client_secret": "pi_..." // For payment setup
}
```

### Add-On Management

#### POST /api/billing/addon/purchase
Purchases a premium add-on.

**Request:**
```json
{
  "billing_account_id": "uuid",
  "add_on_id": "uuid"
}
```

**Response:**
```json
{
  "purchase_id": "uuid",
  "add_on_id": "uuid",
  "integration_id": "tiktok-shop",
  "name": "TikTok Shop + TikTok Ads",
  "status": "active"
}
```

### Usage Reporting

#### POST /api/billing/usage/report
Logs a usage event for billing.

**Request:**
```json
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

### Invoice Estimation

#### GET /api/billing/invoice/estimate
Gets estimated bill for current or specified period.

**Query Parameters:**
- `billing_account_id` (required)
- `start_date` (optional)
- `end_date` (optional)

**Response:**
```json
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

### Stripe Webhooks

#### POST /api/billing/webhook
Handles Stripe webhook events.

**Supported Events:**
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.upcoming`

## Database Functions

### log_usage_event()
Logs a usage event for billing and analytics.

**Parameters:**
- `p_billing_account_id` (UUID)
- `p_event_type` (VARCHAR)
- `p_quantity` (DECIMAL, default: 1)
- `p_project_id` (UUID, optional)
- `p_user_id` (UUID, optional)
- `p_tenant_id` (UUID, optional)
- `p_integration_id` (VARCHAR, optional)
- `p_add_on_id` (UUID, optional)
- `p_unit` (VARCHAR, optional)
- `p_metadata` (JSONB, optional)

**Returns:** UUID (event ID)

### aggregate_daily_usage()
Aggregates usage events into daily aggregates.

**Parameters:**
- `p_start_date` (DATE, default: yesterday)
- `p_end_date` (DATE, default: yesterday)

**Returns:** INTEGER (number of aggregates created)

### compute_estimated_bill()
Computes estimated bill for a billing period.

**Parameters:**
- `p_billing_account_id` (UUID)
- `p_start_date` (DATE)
- `p_end_date` (DATE)

**Returns:** JSONB with cost breakdown

### check_upgrade_requirement()
Checks if a billing account should be prompted to upgrade.

**Parameters:**
- `p_billing_account_id` (UUID)

**Returns:** JSONB with upgrade recommendations

## Edge Functions

### log-usage
Logs usage events via HTTP API.

**Endpoint:** `/functions/v1/log-usage`

**Method:** POST

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "billing_account_id": "uuid",
  "event_type": "reconciliation_job",
  "quantity": 1,
  "integration_id": "stripe"
}
```

### compute-bill
Computes estimated bill for a billing account.

**Endpoint:** `/functions/v1/compute-bill`

**Method:** GET

**Query Parameters:**
- `billing_account_id` (required)
- `start_date` (optional)
- `end_date` (optional)

### sync-usage-to-stripe
Syncs usage aggregates to Stripe for metered billing.

**Endpoint:** `/functions/v1/sync-usage-to-stripe`

**Method:** POST

**Body:**
```json
{
  "billing_account_id": "uuid",
  "date": "2025-01-20"
}
```

### integration-sync-*
Integration-specific sync functions that log usage events.

**Endpoints:**
- `/functions/v1/integration-sync-stripe`
- `/functions/v1/integration-sync-shopify`
- `/functions/v1/integration-sync-paypal`
- `/functions/v1/integration-sync-tiktok`
- etc.

## Feature Gating

The system includes middleware for feature gating based on:
- Plan tier (base, pro, enterprise)
- Add-on purchases
- Usage limits

### Usage

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

## Usage Tracking Integration

Usage tracking is integrated into API routes:

```typescript
import { logUsageEvent } from "../utils/usage-tracker";

// After successful operation
await logUsageEvent({
  billingAccountId: billingAccount.id,
  eventType: "reconciliation_job",
  quantity: 1,
  integrationId: "stripe",
});
```

## Scheduled Jobs

### Daily Usage Aggregation
Runs nightly at 3 AM UTC to:
1. Aggregate usage events into daily totals
2. Sync usage to Stripe for metered billing

**Job:** `usage-aggregation`
**Schedule:** `0 3 * * *` (daily at 3 AM UTC)

## Stripe Integration

### Products & Prices

Products are created via setup script:
```bash
tsx scripts/setup-stripe-products.ts
```

This creates:
- Base plan product ($49.95/month)
- 5 premium add-on products with monthly + usage pricing

### Webhook Configuration

Configure webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/billing/webhook`
- Events: `customer.subscription.*`, `invoice.*`

### Metered Billing

Usage is synced to Stripe via `sync-usage-to-stripe` edge function, which creates usage records for metered subscription items.

## Security Considerations

1. **Webhook Signature Verification**: All Stripe webhooks verify HMAC signatures
2. **Authorization**: All billing endpoints require authentication
3. **Tenant Isolation**: Usage and billing data is isolated by tenant
4. **Rate Limiting**: Usage reporting endpoints are rate-limited

## Error Handling

- Usage logging failures don't block main operations
- Webhook processing is idempotent
- Failed Stripe operations are logged and retried
- Database errors are caught and logged

## Monitoring & Observability

- All usage events are logged with metadata
- Stripe webhook events are logged in `stripe_event_log` table
- Usage aggregation jobs log success/failure
- Billing errors are tracked in application logs

## Future Enhancements

1. **Annual Billing**: Support for annual subscription plans
2. **Volume Discounts**: Tiered pricing based on usage volume
3. **Enterprise Contracts**: Custom pricing for enterprise customers
4. **Usage Predictions**: ML-based usage forecasting
5. **Cost Optimization**: Recommendations for cost reduction
