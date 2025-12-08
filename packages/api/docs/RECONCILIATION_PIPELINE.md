# Reconciliation Pipeline Architecture

## Overview

The reconciliation pipeline is built on an event-driven, event-sourced, CQRS-aligned architecture with saga orchestration for managing complex distributed workflows.

## Architecture Components

### 1. Event Sourcing Foundation

All reconciliation operations are recorded as immutable events in the event store:

- **Event Store**: Postgres-backed append-only log
- **Event Envelope**: Standard format with metadata (tenant_id, correlation_id, causation_id)
- **Snapshots**: Periodic snapshots for efficient aggregate reconstruction

### 2. CQRS Layer

**Write Model (Commands)**:
- `StartReconciliation`: Initiate a new reconciliation
- `RetryReconciliation`: Retry a failed reconciliation
- `CancelReconciliation`: Cancel an in-progress reconciliation

**Read Model (Projections)**:
- `ReconciliationSummary`: Current status, counts, timings
- `TenantUsageView`: Usage metrics per tenant/day
- `ErrorHotspotsView`: Error patterns and failure points

### 3. Saga Orchestration

Sagas manage multi-step reconciliation workflows:

- **Steps**: Fetch data → Match → Persist → Notify
- **Compensation**: Automatic rollback on failure
- **Retry Logic**: Exponential backoff with configurable max retries
- **Timeouts**: Per-step timeout handling

### 4. Error Handling & Resilience

- **Circuit Breaker**: Prevents cascading failures from external APIs
- **Dead Letter Queue**: Captures irrecoverable failures for manual review
- **Fallback/Caching**: Graceful degradation when providers are down

## Reconciliation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    StartReconciliation Command              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Emit ReconciliationStarted Event               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Saga Orchestrator                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Step 1: Fetch Shopify Orders                         │  │
│  │   → Emit OrdersFetched Event                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Step 2: Fetch Stripe Payments                        │  │
│  │   → Emit PaymentsFetched Event                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Step 3: Perform Matching                              │  │
│  │   → Emit RecordMatched/RecordUnmatched Events         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Step 4: Persist Results                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Step 5: Notify Webhooks                              │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            Emit ReconciliationCompleted Event               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Update Read Model Projections                  │
│  - ReconciliationSummary                                    │
│  - TenantUsageView                                          │
│  - ErrorHotspotsView                                        │
└─────────────────────────────────────────────────────────────┘
```

## Event Types

### Core Lifecycle Events

1. **ReconciliationStarted**
   - Marks the start of a reconciliation
   - Contains job configuration and date range

2. **OrdersFetched**
   - Records successful fetch from source (e.g., Shopify)
   - Contains order count and fetch duration

3. **PaymentsFetched**
   - Records successful fetch from target (e.g., Stripe)
   - Contains payment count and fetch duration

4. **RecordMatched**
   - Records a successful match between source and target
   - Contains match confidence and matched fields

5. **RecordUnmatched**
   - Records unmatched records (source-only or target-only)
   - Contains reason for mismatch

6. **ReconciliationCompleted**
   - Marks successful completion
   - Contains summary statistics

7. **ReconciliationFailed**
   - Marks failure with error details
   - Contains retryability flag

## Saga State Management

Saga state is persisted in the `saga_state` table:

- **Current Step**: Tracks which step is executing
- **Step History**: Log of all step executions
- **State Data**: Accumulated data from steps
- **Status**: running, completed, failed, cancelled, compensating

## Error Recovery

### Automatic Retry

- Exponential backoff: 1s, 2s, 4s, ... up to 30s
- Configurable max retries per step
- Retryable vs non-retryable errors

### Compensation

On failure, completed steps are compensated in reverse order:

1. Identify failed step
2. Execute compensation for all completed steps before failure
3. Mark saga as failed

### Dead Letter Queue

After max retries, failures are sent to DLQ for:
- Manual review
- Root cause analysis
- Manual retry or resolution

## Idempotency

All operations are idempotent:

- **Event Store**: Append-only, events are never modified
- **Saga Steps**: Can be safely retried
- **Commands**: Duplicate commands with same correlation_id are ignored

## Performance Considerations

- **Snapshots**: Created every N events to speed up aggregate reconstruction
- **Async Processing**: Sagas execute asynchronously
- **Batch Operations**: Multiple events can be appended atomically
- **Indexing**: Event store indexed for efficient queries

## Monitoring

Key metrics to monitor:

- Saga completion rate
- Average saga duration
- Step failure rates
- Dead letter queue size
- Event store growth rate
- Snapshot frequency

## Testing

### Test Scenarios

1. **Mid-saga crash**: Verify saga resumes from last completed step
2. **External API downtime**: Verify circuit breaker opens and saga retries
3. **Idempotency**: Verify duplicate StartReconciliation commands are handled
4. **Compensation**: Verify rollback on failure
5. **Replay**: Verify aggregate can be rebuilt from events
