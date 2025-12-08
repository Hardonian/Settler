# Sagas and Recovery Patterns

## Overview

Sagas orchestrate multi-step reconciliation workflows with automatic compensation and retry logic.

## Saga Pattern

A saga is a sequence of local transactions coordinated by a saga orchestrator:

- **Steps**: Each step is a local transaction
- **Compensation**: Each step can have a compensating action
- **Orchestration**: Central orchestrator manages step execution

## Saga Lifecycle

```
┌─────────────┐
│   STARTED   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   RUNNING   │──┐
└──────┬──────┘  │
       │         │ (retry)
       ▼         │
┌─────────────┐  │
│   STEP 1    │──┘
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   STEP 2    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  COMPLETED  │  or │   FAILED    │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │COMPENSATING │
                    └─────────────┘
```

## Saga Definition

```typescript
interface SagaDefinition {
  type: string;
  steps: SagaStep[];
  onComplete?: (state: SagaState) => Promise<void>;
  onFailure?: (state: SagaState, error: Error) => Promise<void>;
}

interface SagaStep {
  name: string;
  execute: (state: SagaState) => Promise<SagaStepResult>;
  compensate?: (state: SagaState) => Promise<void>;
  timeoutMs?: number;
  retryable?: boolean;
  maxRetries?: number;
}
```

## Shopify-Stripe Reconciliation Saga

### Steps

1. **fetch_shopify_orders**
   - Fetches orders from Shopify API
   - Emits `OrdersFetched` event
   - Timeout: 60s, Retryable: Yes, Max Retries: 3

2. **fetch_stripe_payments**
   - Fetches payments from Stripe API
   - Emits `PaymentsFetched` event
   - Timeout: 60s, Retryable: Yes, Max Retries: 3

3. **perform_matching**
   - Matches orders with payments
   - Emits `RecordMatched`/`RecordUnmatched` events
   - Timeout: 300s, Retryable: No (idempotent but expensive)

4. **persist_results**
   - Persists reconciliation results
   - Timeout: 30s, Retryable: Yes, Max Retries: 3

5. **notify_webhooks**
   - Sends webhook notifications
   - Timeout: 30s, Retryable: Yes, Max Retries: 3

### Compensation

If a step fails, previous steps are compensated in reverse order:

```typescript
// Step 3 fails → Compensate steps 2 and 1
compensate(state, 'perform_matching') {
  // Compensate fetch_stripe_payments (step 2)
  // Compensate fetch_shopify_orders (step 1)
}
```

## Retry Logic

### Exponential Backoff

```typescript
const delayMs = Math.min(1000 * Math.pow(2, attempt), 30000);
// Attempt 1: 1s delay
// Attempt 2: 2s delay
// Attempt 3: 4s delay
// Max: 30s delay
```

### Retry Conditions

- **Retryable Errors**: Network timeouts, temporary API failures
- **Non-Retryable Errors**: Validation errors, authentication failures
- **Max Retries**: Configurable per step (default: 3)

### Retry Scheduling

Failed steps are scheduled for retry:

```sql
UPDATE saga_state
SET 
  retry_count = retry_count + 1,
  next_retry_at = NOW() + INTERVAL '1 minute' * POWER(2, retry_count)
WHERE saga_id = $1
```

## Saga State Management

### State Persistence

Saga state is persisted in `saga_state` table:

```sql
CREATE TABLE saga_state (
  saga_id VARCHAR(255) PRIMARY KEY,
  saga_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  current_step VARCHAR(100) NOT NULL,
  state JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  timeout_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### State Structure

```typescript
interface SagaState {
  sagaId: string;
  sagaType: string;
  aggregateId: string;
  currentStep: string;
  stepHistory: Array<{
    step: string;
    status: 'started' | 'completed' | 'failed' | 'compensated';
    timestamp: Date;
  }>;
  data: Record<string, unknown>;
  correlationId: string;
  tenantId: string;
}
```

## Recovery Scenarios

### 1. Mid-Saga Crash

**Scenario**: Saga crashes between steps

**Recovery**:
1. Load saga state from database
2. Identify last completed step
3. Resume from next step

```typescript
async resumeSaga(sagaId: string, sagaType: string) {
  const state = await loadSagaState(sagaId, sagaType);
  await executeSaga(state); // Resumes from current_step
}
```

### 2. External API Downtime

**Scenario**: Shopify/Stripe API is down

**Recovery**:
1. Circuit breaker opens after threshold failures
2. Saga step fails with retryable error
3. Scheduled for retry with exponential backoff
4. When API recovers, saga resumes automatically

### 3. Step Timeout

**Scenario**: Step exceeds timeout

**Recovery**:
1. Timeout error detected
2. If retryable, schedule retry
3. If not retryable, start compensation

### 4. Non-Retryable Failure

**Scenario**: Validation error or permanent failure

**Recovery**:
1. Mark step as failed
2. Execute compensation for completed steps
3. Mark saga as failed
4. Send to dead letter queue if max retries exceeded

## Dead Letter Queue

Irrecoverable failures are sent to DLQ:

```typescript
interface DeadLetterEntry {
  saga_id: string;
  error_type: string;
  error_message: string;
  payload: Record<string, unknown>;
  retry_count: number;
  created_at: Date;
}
```

**DLQ Operations**:
- Manual review
- Root cause analysis
- Manual retry or resolution
- Resolution tracking

## Idempotency

All saga steps are idempotent:

- **Fetch Steps**: Can be safely retried (read-only)
- **Matching Step**: Idempotent algorithm (same input = same output)
- **Persist Step**: Uses upsert operations
- **Notify Step**: Webhook deduplication

## Testing Recovery

### Test: Mid-Saga Crash

```typescript
// 1. Start saga
const sagaId = await orchestrator.startSaga(...);

// 2. Simulate crash (kill process)

// 3. Resume saga
await orchestrator.resumeSaga(sagaId, sagaType);

// 4. Verify saga completes
const state = await orchestrator.getSagaStatus(sagaId, sagaType);
expect(state.status).toBe('completed');
```

### Test: External API Downtime

```typescript
// 1. Mock API to fail
mockShopifyAPI.mockReject(new Error('Service unavailable'));

// 2. Start saga
const sagaId = await orchestrator.startSaga(...);

// 3. Verify saga scheduled for retry
const state = await orchestrator.getSagaStatus(sagaId, sagaType);
expect(state.next_retry_at).toBeDefined();

// 4. Mock API to recover
mockShopifyAPI.mockResolve(mockOrders);

// 5. Resume saga
await orchestrator.resumeSaga(sagaId, sagaType);

// 6. Verify completion
const finalState = await orchestrator.getSagaStatus(sagaId, sagaType);
expect(finalState.status).toBe('completed');
```

### Test: Idempotency

```typescript
// 1. Start reconciliation
await commandHandler.handleStartReconciliation(command);

// 2. Start same reconciliation again (same correlation_id)
await commandHandler.handleStartReconciliation(command);

// 3. Verify only one saga instance exists
const sagas = await db.query('SELECT * FROM saga_state WHERE ...');
expect(sagas.length).toBe(1);
```

## Monitoring

Key metrics:

- **Saga Completion Rate**: % of sagas that complete successfully
- **Average Saga Duration**: Time from start to completion
- **Step Failure Rates**: Failure rate per step
- **Compensation Rate**: % of sagas that require compensation
- **DLQ Size**: Number of entries in dead letter queue
- **Retry Count**: Average retries per saga

## Best Practices

1. **Design Idempotent Steps**: All steps should be safely retryable
2. **Implement Compensation**: Provide compensation for all state-changing steps
3. **Set Appropriate Timeouts**: Balance between reliability and performance
4. **Monitor DLQ**: Regularly review and resolve DLQ entries
5. **Log Comprehensively**: Log all saga state transitions for debugging
