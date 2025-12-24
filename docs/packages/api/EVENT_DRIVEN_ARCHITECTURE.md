# Event-Driven Architecture Summary

## Overview

Settler's reconciliation system is built on a robust event-driven, event-sourced, CQRS-aligned architecture with saga orchestration for managing complex distributed workflows.

## Architecture Components

### 1. Event Sourcing (`/src/domain/eventsourcing/`, `/src/infrastructure/eventsourcing/`)

- **Event Envelope**: Standard event format with metadata
- **Event Store**: Postgres-backed append-only log
- **Snapshot Service**: Efficient aggregate reconstruction
- **Core Events**: Reconciliation lifecycle events

**Key Files**:
- `EventEnvelope.ts`: Event envelope structure
- `ReconciliationEvents.ts`: Core reconciliation events
- `EventStore.ts`: Postgres event store implementation
- `SnapshotService.ts`: Snapshot management

### 2. CQRS (`/src/application/cqrs/`)

**Write Model**:
- Commands: `StartReconciliation`, `RetryReconciliation`, `CancelReconciliation`
- Command Handlers: Validate and emit events

**Read Model**:
- Projections: `ReconciliationSummary`, `TenantUsageView`, `ErrorHotspotsView`
- Projection Handlers: Update read models from events

**Key Files**:
- `commands/ReconciliationCommands.ts`: Command definitions
- `commands/ReconciliationCommandHandlers.ts`: Command handlers
- `projections/ReconciliationProjections.ts`: Projection handlers

### 3. Saga Orchestration (`/src/application/sagas/`)

- **Saga Orchestrator**: Manages multi-step workflows
- **Shopify-Stripe Saga**: Concrete implementation
- **Compensation**: Automatic rollback on failure
- **Retry Logic**: Exponential backoff

**Key Files**:
- `SagaOrchestrator.ts`: Core saga engine
- `ShopifyStripeReconciliationSaga.ts`: Concrete saga

### 4. Error Handling (`/src/infrastructure/resilience/`)

- **Circuit Breaker**: Prevents cascading failures
- **Dead Letter Queue**: Captures irrecoverable failures
- **Retry Logic**: Built into saga orchestrator

**Key Files**:
- `circuit-breaker.ts`: Circuit breaker implementation
- `DeadLetterQueue.ts`: DLQ management

### 5. Admin Tools (`/src/application/admin/`, `/src/routes/admin.ts`)

- **Admin Service**: Inspect sagas, events, DLQ
- **Admin Routes**: REST API for admin operations
- **CLI Commands**: Command-line interface

**Key Files**:
- `AdminService.ts`: Admin service implementation
- `routes/admin.ts`: Admin REST endpoints
- `cli/src/commands/admin.ts`: CLI commands

## Database Schema

### Event Store Tables

- `event_store`: Append-only event log
- `snapshots`: Aggregate snapshots
- `saga_state`: Saga execution state
- `dead_letter_queue`: Irrecoverable failures

### Read Model Tables

- `reconciliation_summary`: Current reconciliation status
- `tenant_usage_view`: Usage metrics
- `error_hotspots_view`: Error patterns

**Migrations**:
- `db/migrations/event-sourcing.sql`: Event store schema
- `db/migrations/cqrs-projections.sql`: Read model schema

## Usage Examples

### Starting a Reconciliation

```typescript
import { ReconciliationService } from './application/reconciliation/ReconciliationService';

const reconciliationService = new ReconciliationService(...);

await reconciliationService.startReconciliation({
  reconciliation_id: 'recon_123',
  job_id: 'job_456',
  tenant_id: 'tenant_789',
  source_adapter: 'shopify',
  target_adapter: 'stripe',
  date_range: {
    start: '2026-01-01',
    end: '2026-01-31',
  },
});
```

### Querying Read Models

```typescript
// Get reconciliation summary
const summary = await db.query(`
  SELECT * FROM reconciliation_summary
  WHERE reconciliation_id = $1
`, [reconciliationId]);

// Get tenant usage
const usage = await db.query(`
  SELECT * FROM tenant_usage_view
  WHERE tenant_id = $1 AND date >= $2
`, [tenantId, startDate]);
```

### Admin Operations

```typescript
import { AdminService } from './application/admin/AdminService';

const adminService = new AdminService(...);

// Get saga status
const status = await adminService.getSagaStatus(sagaId, sagaType);

// Resume saga
await adminService.resumeSaga(sagaId, sagaType);

// List events
const events = await adminService.listEventsForAggregate(aggregateId, aggregateType);
```

## Event Flow

```
Command → Command Handler → Event Store → Event Bus
                                           ↓
                                    Saga Orchestrator
                                           ↓
                                    Step Execution
                                           ↓
                                    Event Store (events)
                                           ↓
                                    Projection Handlers
                                           ↓
                                    Read Models
```

## Testing

### Test Scenarios

1. **Mid-saga crash**: Verify saga resumes
2. **External API downtime**: Verify circuit breaker and retry
3. **Idempotency**: Verify duplicate commands are handled
4. **Compensation**: Verify rollback on failure
5. **Replay**: Verify aggregate reconstruction

See `docs/SAGAS_AND_RECOVERY.md` for detailed testing examples.

## Documentation

- **RECONCILIATION_PIPELINE.md**: Overall pipeline architecture
- **CQRS_AND_EVENT_SOURCING.md**: CQRS and event sourcing details
- **SAGAS_AND_RECOVERY.md**: Saga patterns and recovery
- **REPLAY.md**: Event replay guide

## Key Features

✅ **Full Audit Trail**: Every operation recorded as events  
✅ **Replay Capability**: Rebuild state from events  
✅ **Saga Orchestration**: Multi-step workflows with compensation  
✅ **Circuit Breaker**: Resilient external API calls  
✅ **Dead Letter Queue**: Manual review of failures  
✅ **Idempotency**: Safe retries and duplicate handling  
✅ **Snapshots**: Efficient aggregate reconstruction  
✅ **Projections**: Optimized read models  

## Next Steps

1. Run migrations: `npm run migrate`
2. Start reconciliation: Use `ReconciliationService`
3. Monitor sagas: Use admin endpoints or CLI
4. Review DLQ: Check for irrecoverable failures
5. Rebuild projections: Use replay tools if needed
