# Enhanced Monitoring & Observability

## Overview

The Settler integration framework includes comprehensive monitoring, alerting, retry mechanisms, data validation, and performance optimizations for production-grade reliability.

## Components

### 1. Prometheus Metrics

**Location**: `packages/adapters/src/metrics/prometheus.ts`

**Metrics Exported**:

- `settler_sync_started_total` - Counter of syncs started
- `settler_sync_completed_total` - Counter of successful syncs
- `settler_sync_failed_total` - Counter of failed syncs
- `settler_sync_duration_seconds` - Histogram of sync durations
- `settler_sync_in_progress` - Gauge of active syncs
- `settler_transactions_synced_total` - Counter of transactions synced
- `settler_accounts_synced_total` - Counter of accounts synced
- `settler_api_calls_total` - Counter of API calls
- `settler_api_call_duration_seconds` - Histogram of API call durations
- `settler_rate_limit_hits_total` - Counter of rate limit hits
- `settler_webhooks_received_total` - Counter of webhooks received
- `settler_webhooks_processed_total` - Counter of processed webhooks
- `settler_webhooks_failed_total` - Counter of failed webhooks
- `settler_token_refreshes_total` - Counter of token refreshes

**Endpoint**: `GET /api/metrics/prometheus`

**Authentication**: Optional Bearer token via `PROMETHEUS_METRICS_TOKEN` env var

**Example**:

```bash
curl -H "Authorization: Bearer $PROMETHEUS_METRICS_TOKEN" \
  http://localhost:3000/api/metrics/prometheus
```

### 2. Alerting System

**Location**: `packages/adapters/src/alerting/alert-manager.ts`

**Alert Rules**:

- **Consecutive Failures (5)**: Warning when 5 consecutive syncs fail
- **Consecutive Failures (10)**: Critical when 10 consecutive syncs fail
- **Error Rate (10%)**: Warning when error rate exceeds 10%
- **Sync Delay (24h)**: Warning when last sync was >24 hours ago
- **Rate Limit Hit**: Info alert when rate limit is hit

**Alert Severities**:

- `critical` - Requires immediate attention
- `warning` - Needs investigation
- `info` - Informational

**Database Table**: `connector_alerts`

**Notification Channels**:

- Webhook (via `ALERT_WEBHOOK_URL` env var)
- Console logging (for development)
- Extensible to email, Slack, PagerDuty, etc.

**Usage**:

```typescript
import { AlertManager } from "@settler/adapters";

const alertManager = new AlertManager(supabaseUrl, supabaseServiceKey);

// Check alerts after sync failure
await alertManager.checkSyncFailure(
  connectorId,
  tenantId,
  consecutiveFailures,
  errorType,
  errorMessage
);

// Get active alerts
const alerts = await alertManager.getActiveAlerts(connectorId, tenantId);

// Resolve alert
await alertManager.resolveAlert(alertId, userId);
```

### 3. Retry Queue System

**Location**: `packages/adapters/src/retry-queue/retry-queue.ts`

**Features**:

- Exponential backoff with jitter
- Configurable max attempts (default: 5)
- Dead letter queue for permanently failed jobs
- Automatic retry scheduling

**Database Table**: `retry_queue`

**Configuration**:

```typescript
const retryQueue = new RetryQueue(supabaseUrl, supabaseServiceKey, {
  maxAttempts: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 3600000, // 1 hour
  backoffMultiplier: 2,
  jitter: true,
});
```

**Retry Schedule**:

- Attempt 1: ~1 second
- Attempt 2: ~2 seconds
- Attempt 3: ~4 seconds
- Attempt 4: ~8 seconds
- Attempt 5: ~16 seconds

**Processor**: `supabase/functions/retry-queue-processor/index.ts`

**Usage**:

```typescript
import { RetryQueue } from "@settler/adapters";

const retryQueue = new RetryQueue(supabaseUrl, supabaseServiceKey);

// Enqueue failed sync
await retryQueue.enqueue(connectorId, tenantId, syncRunId, errorMessage, errorType);

// Get ready jobs
const jobs = await retryQueue.getReadyJobs(100);

// Process job
await retryQueue.processJob(jobId);

// Mark completed
await retryQueue.markCompleted(jobId);

// Mark failed (will retry if attempts remaining)
await retryQueue.markFailed(jobId, errorMessage, errorType);

// Get dead letter queue
const deadLetter = await retryQueue.getDeadLetterQueue(100);
```

### 4. Enhanced Data Validation

**Location**: `packages/adapters/src/validation/data-validator.ts`

**Validation Rules**:

**Transactions**:

- Required: `externalId`, `transactionType`, `amountCents`, `currency`, `occurredAt`
- Valid transaction types: `debit`, `credit`, `transfer`, `fee`, `refund`
- Amount must be non-negative
- Currency must be 3-letter ISO code
- Date must be valid and not too far in future/past
- Warnings for unusual amounts or long descriptions

**Accounts**:

- Required: `providerAccountId`, `accountName`, `currency`
- Currency validation

**Balances**:

- Required: `balanceCents`, `currency`, `snapshotAt`
- Available balance cannot exceed total balance
- Negative balance warnings

**Payouts**:

- Required: `externalId`, `amountCents`, `currency`, `status`, `initiatedAt`
- Amount must be positive
- `completedAt` cannot be before `initiatedAt`
- Net amount cannot exceed gross amount

**Invoices**:

- Required: `externalId`, `amountCents`, `currency`, `status`
- Line items total should match invoice amount (1% tolerance)
- `dueDate` cannot be before `issueDate`

**Subscriptions**:

- Required: `externalId`, `customerId`, `amountCents`, `currency`, `status`
- Period end cannot be before period start

**Tax Estimates**:

- Required: `externalId`, `amountCents`, `taxAmountCents`, `currency`, `occurredAt`
- Tax amount cannot exceed transaction amount
- Tax rate validation (0-100%)

**Usage**:

```typescript
import { validator } from '@settler/adapters';

// Validate single transaction
const result = validator.validateTransaction(transaction);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate all data
const validation = validator.validateAll({
  transactions: [...],
  accounts: [...],
  balances: [...],
  // ...
});

console.log('Valid:', validation.valid);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
console.log('Counts:', validation.counts);
```

### 5. Performance Optimizations

**Location**: `packages/adapters/src/performance/batch-processor.ts`

**Features**:

- Batch processing with configurable batch size
- Concurrency control with semaphore
- Parallel processing with limits
- Memory-efficient streaming for large datasets
- Deduplication utilities

**Batch Processing**:

```typescript
import { processInBatches } from "@settler/adapters";

const { results, errors } = await processInBatches(
  items,
  async (batch) => {
    // Process batch
    return batch.map(processItem);
  },
  {
    batchSize: 100,
    maxConcurrency: 5,
    retryOnFailure: true,
    continueOnError: true,
  }
);
```

**Parallel Processing**:

```typescript
import { processParallel } from "@settler/adapters";

const { results, errors } = await processParallel(
  items,
  async (item) => {
    // Process item
    return processItem(item);
  },
  5 // max concurrency
);
```

**Streaming**:

```typescript
import { streamProcess } from "@settler/adapters";

for await (const result of streamProcess(items, processor, 100)) {
  // Process result
}
```

**Large Dataset Processing**:

```typescript
import { processLargeDataset } from "@settler/adapters";

const { results, processed } = await processLargeDataset(
  items,
  async (batch) => {
    // Process batch
    return batch.map(processItem);
  },
  1000, // batch size
  500 // max memory MB
);
```

## Integration with Connector Runtime

All enhancements are automatically integrated into `ConnectorRuntime`:

1. **Metrics**: Automatically tracked for all syncs
2. **Alerts**: Automatically checked on failures
3. **Retry Queue**: Automatically enqueued on failures
4. **Validation**: Automatically validates all data before saving
5. **Batch Processing**: Automatically used for large datasets (>1000 items)

## Configuration

**Environment Variables**:

```bash
# Prometheus metrics
PROMETHEUS_METRICS_TOKEN=your-token-here

# Alerting
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...

# Retry queue
RETRY_QUEUE_MAX_ATTEMPTS=5
RETRY_QUEUE_INITIAL_DELAY_MS=1000
RETRY_QUEUE_MAX_DELAY_MS=3600000
```

## Monitoring Dashboard

Recommended Grafana dashboard queries:

**Sync Success Rate**:

```promql
rate(settler_sync_completed_total[5m]) / rate(settler_sync_started_total[5m])
```

**Sync Duration (p95)**:

```promql
histogram_quantile(0.95, rate(settler_sync_duration_seconds_bucket[5m]))
```

**Error Rate**:

```promql
rate(settler_sync_failed_total[5m]) / rate(settler_sync_started_total[5m])
```

**Active Syncs**:

```promql
sum(settler_sync_in_progress)
```

## Troubleshooting

### High Error Rate

1. Check `connector_alerts` table for active alerts
2. Review `sync_runs` table for error patterns
3. Check `retry_queue` for pending retries
4. Review connector logs for specific errors

### Slow Syncs

1. Check `settler_sync_duration_seconds` histogram
2. Review batch processing configuration
3. Check database indexes
4. Consider increasing batch size or concurrency

### Retry Queue Backlog

1. Check `retry_queue` table for pending jobs
2. Verify retry queue processor is running
3. Review retry configuration (max attempts, delays)
4. Check for systemic issues causing repeated failures

## Best Practices

1. **Monitor Metrics**: Set up alerts on key metrics (error rate, duration)
2. **Review Alerts**: Regularly review and resolve alerts
3. **Tune Retry Config**: Adjust retry settings based on connector behavior
4. **Validate Data**: Always validate data before processing
5. **Batch Large Syncs**: Use batch processing for datasets >1000 items
6. **Monitor Dead Letter Queue**: Regularly review permanently failed jobs
