# Usage Events Reference

Complete reference for all usage event types tracked by Settler.dev's billing system.

## Event Types

### Core Events

#### reconciliation_job

Tracks reconciliation job executions.

**Unit:** `job`  
**Base Plan Limit:** 10,000/month  
**Overage Price:** $0.05 per job  
**Metadata:**

- `job_id` (string) - Reconciliation job ID
- `source_adapter` (string) - Source adapter name
- `target_adapter` (string) - Target adapter name
- `records_processed` (number) - Number of records processed

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "reconciliation_job",
  quantity: 1,
  integrationId: "stripe",
  metadata: {
    job_id: "job_123",
    source_adapter: "shopify",
    target_adapter: "stripe",
    records_processed: 150,
  },
});
```

#### api_request

Tracks API requests made to Settler API.

**Unit:** `request`  
**Base Plan Limit:** 100,000/month  
**Overage Price:** $0.001 per request  
**Metadata:**

- `endpoint` (string) - API endpoint path
- `method` (string) - HTTP method
- `status_code` (number) - HTTP status code

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "api_request",
  quantity: 1,
  metadata: {
    endpoint: "/api/v1/jobs",
    method: "POST",
    status_code: 200,
  },
});
```

#### webhook_event

Tracks webhook events processed.

**Unit:** `event`  
**Base Plan Limit:** 50,000/month  
**Overage Price:** $0.002 per event  
**Metadata:**

- `webhook_id` (string) - Webhook configuration ID
- `source` (string) - Webhook source
- `event_type` (string) - Webhook event type

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "webhook_event",
  quantity: 1,
  metadata: {
    webhook_id: "webhook_123",
    source: "stripe",
    event_type: "charge.succeeded",
  },
});
```

#### db_query

Tracks database queries executed.

**Unit:** `query`  
**Base Plan Limit:** 500,000/month  
**Overage Price:** $0.0001 per query  
**Metadata:**

- `query_type` (string) - SELECT, INSERT, UPDATE, DELETE
- `table` (string) - Table name
- `duration_ms` (number) - Query duration in milliseconds

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "db_query",
  quantity: 1,
  metadata: {
    query_type: "SELECT",
    table: "jobs",
    duration_ms: 45,
  },
});
```

#### ai_request

Tracks AI-powered operations.

**Unit:** `request`  
**Base Plan Limit:** 1,000/month  
**Overage Price:** $0.10 per request  
**Metadata:**

- `ai_model` (string) - AI model used
- `tokens_used` (number) - Number of tokens consumed
- `analysis_type` (string) - Type of AI analysis

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "ai_request",
  quantity: 1,
  metadata: {
    ai_model: "gpt-4",
    tokens_used: 1500,
    analysis_type: "anomaly_detection",
  },
});
```

#### auth_user_created

Tracks user creation events.

**Unit:** `user`  
**Base Plan Limit:** 1,000/month  
**Overage Price:** $0.01 per user  
**Metadata:**

- `user_id` (string) - Created user ID
- `role` (string) - User role

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "auth_user_created",
  quantity: 1,
  metadata: {
    user_id: "user_123",
    role: "developer",
  },
});
```

### Integration Events

#### integration_sync

Tracks integration data synchronization.

**Unit:** Varies by integration  
**Base Plan Limit:** N/A (varies by integration)  
**Overage Price:** Varies by integration  
**Metadata:**

- `integration` (string) - Integration name
- `sync_type` (string) - Type of sync (full, incremental, etc.)
- `records_synced` (number) - Number of records synced

**Example:**

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "integration_sync",
  quantity: 150,
  integrationId: "stripe",
  unit: "transaction",
  metadata: {
    integration: "stripe",
    sync_type: "full",
    records_synced: 150,
  },
});
```

#### stripe_sync

Tracks Stripe-specific synchronization.

**Unit:** `transaction`  
**Metadata:**

- `transaction_count` (number) - Number of transactions synced
- `sync_type` (string) - Type of sync

#### shopify_sync

Tracks Shopify-specific synchronization.

**Unit:** `order`  
**Metadata:**

- `order_count` (number) - Number of orders synced
- `sync_type` (string) - Type of sync

#### tiktok_order_sync

Tracks TikTok Shop order synchronization (add-on).

**Unit:** `order`  
**Add-On:** TikTok Shop + TikTok Ads  
**Usage Price:** $0.02 per order  
**Metadata:**

- `order_count` (number) - Number of orders synced
- `shop_id` (string) - TikTok Shop ID

#### tiktok_ad_sync

Tracks TikTok Ads spend synchronization (add-on).

**Unit:** `event`  
**Add-On:** TikTok Shop + TikTok Ads  
**Usage Price:** $0.01 per event  
**Metadata:**

- `campaign_count` (number) - Number of campaigns synced
- `total_spend` (number) - Total ad spend

#### wix_order_sync

Tracks Wix Stores order synchronization (add-on).

**Unit:** `order`  
**Add-On:** Wix Stores  
**Usage Price:** $0.01 per order  
**Metadata:**

- `order_count` (number) - Number of orders synced
- `store_id` (string) - Wix store ID

#### ga4_event_sync

Tracks GA4 event synchronization (add-on).

**Unit:** `event`  
**Add-On:** Google Analytics GA4 Deep Sync  
**Usage Price:** $0.005 per event  
**Metadata:**

- `event_count` (number) - Number of events synced
- `property_id` (string) - GA4 property ID

#### paypal_payout

Tracks PayPal payout processing (add-on).

**Unit:** `payout`  
**Add-On:** PayPal Payouts + Automation  
**Usage Price:** $0.03 per payout  
**Metadata:**

- `payout_batch_id` (string) - PayPal payout batch ID
- `recipient_count` (number) - Number of recipients
- `total_amount` (number) - Total payout amount

#### whatsapp_message

Tracks WhatsApp message processing (add-on).

**Unit:** `message`  
**Add-On:** WhatsApp Business + Telegram Messaging  
**Usage Price:** $0.001 per message  
**Metadata:**

- `message_count` (number) - Number of messages
- `message_type` (string) - Type of message

#### telegram_message

Tracks Telegram message processing (add-on).

**Unit:** `message`  
**Add-On:** WhatsApp Business + Telegram Messaging  
**Usage Price:** $0.001 per message  
**Metadata:**

- `message_count` (number) - Number of messages
- `chat_id` (string) - Telegram chat ID

## Usage Patterns

### High-Frequency Events

For high-frequency events (API requests, webhook events), batch logging is recommended:

```typescript
// Batch multiple events
const events = [
  { eventType: "api_request", quantity: 100 },
  { eventType: "webhook_event", quantity: 50 },
];

await logUsageEventsBatch(
  events.map((e) => ({
    billingAccountId: "uuid",
    ...e,
  }))
);
```

### Integration-Specific Events

When logging integration events, always include the `integrationId`:

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "integration_sync",
  quantity: orderCount,
  integrationId: "shopify", // Required for integration-specific billing
  unit: "order",
});
```

### Add-On Events

For add-on specific events, include the `addOnId`:

```typescript
await logUsageEvent({
  billingAccountId: "uuid",
  eventType: "tiktok_order_sync",
  quantity: orderCount,
  integrationId: "tiktok-shop",
  addOnId: "addon_uuid", // Links to purchased add-on
  unit: "order",
});
```

## Best Practices

1. **Log After Success**: Only log usage after successful operations
2. **Include Metadata**: Add relevant context for debugging and analytics
3. **Use Correct Units**: Specify the correct unit for the event type
4. **Batch When Possible**: Batch multiple events for efficiency
5. **Handle Errors Gracefully**: Don't fail operations if usage logging fails

## Event Aggregation

Events are automatically aggregated daily via the `aggregate_daily_usage()` function, which:

1. Groups events by billing account, date, event type, and integration
2. Sums quantities and counts events
3. Marks events as aggregated
4. Stores results in `usage_aggregate_daily` table

## Cost Calculation

Usage costs are calculated based on:

1. **Base Plan Limits**: Included in monthly subscription
2. **Overage Pricing**: Applied when limits are exceeded
3. **Add-On Pricing**: Base monthly fee + per-unit usage fees

Example calculation:

- Base plan: $49.95/month (includes 10,000 jobs)
- Usage: 12,000 jobs
- Overage: 2,000 jobs × $0.05 = $100.00
- **Total**: $49.95 + $100.00 = $149.95

## Monitoring

All usage events are:

- Logged in real-time to `usage_events` table
- Aggregated daily to `usage_aggregate_daily` table
- Synced to Stripe for metered billing (if applicable)
- Available via usage dashboard UI
