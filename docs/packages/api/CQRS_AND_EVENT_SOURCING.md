# CQRS and Event Sourcing Architecture

## Overview

Settler uses CQRS (Command Query Responsibility Segregation) and Event Sourcing to provide a robust, scalable, and auditable reconciliation system.

## Event Sourcing

### Core Principles

1. **Append-Only Event Store**: All changes are recorded as events, never modified
2. **Event Replay**: Aggregates are rebuilt by replaying events
3. **Full Audit Trail**: Complete history of all operations
4. **Time Travel**: Can reconstruct state at any point in time

### Event Envelope Structure

```typescript
interface EventEnvelope {
  id: string; // Unique event ID
  aggregate_id: string; // Reconciliation ID
  aggregate_type: string; // 'reconciliation'
  event_type: string; // 'ReconciliationStarted', etc.
  event_version: number; // Schema version
  data: unknown; // Event-specific data
  metadata: {
    tenant_id: string;
    user_id?: string;
    timestamp: string;
    correlation_id: string; // Groups related events
    causation_id?: string; // Parent event ID
  };
  created_at: Date;
}
```

### Event Store Schema

```sql
CREATE TABLE event_store (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Snapshot Mechanism

For large aggregates, snapshots are created periodically:

- **Snapshot Policy**: Every N events (default: 100)
- **Reconstruction**: Load snapshot + replay events after snapshot
- **Storage**: `snapshots` table with version tracking

```typescript
// Rebuild aggregate from snapshot + events
const snapshot = await eventStore.getLatestSnapshot(aggregateId, aggregateType);
let state = snapshot ? snapshot.snapshot_data : initialState;

const events = snapshot
  ? await eventStore.getEventsAfterSnapshot(aggregateId, aggregateType, snapshot.snapshot_version)
  : await eventStore.getEvents(aggregateId, aggregateType);

for (const event of events) {
  state = applyEvent(state, event.data);
}
```

## CQRS Architecture

### Write Model (Commands)

Commands represent intentions to change state:

```typescript
// Commands
interface StartReconciliationCommand {
  reconciliation_id: string;
  job_id: string;
  tenant_id: string;
  source_adapter: string;
  target_adapter: string;
  date_range: { start: string; end: string };
  correlation_id?: string;
}
```

**Command Handler Responsibilities**:

1. Validate permissions and input
2. Check current state (if needed)
3. Emit events (do NOT directly modify state)
4. Publish to event bus for projections

```typescript
async handleStartReconciliation(command: StartReconciliationCommand) {
  // Validate
  await this.validatePermissions(command);

  // Emit event
  const event = ReconciliationEvents.ReconciliationStarted(...);
  await this.eventStore.append(event);

  // Publish for projections
  await this.eventBus.publish(event);
}
```

### Read Model (Projections)

Projections are updated by event handlers:

```typescript
// Projection Handler
async handleReconciliationStarted(event: EventEnvelope) {
  await db.query(`
    INSERT INTO reconciliation_summary (
      reconciliation_id,
      status,
      started_at
    ) VALUES ($1, 'running', NOW())
  `, [event.aggregate_id]);
}
```

**Read Model Tables**:

- `reconciliation_summary`: Current status and statistics
- `tenant_usage_view`: Usage metrics per tenant/day
- `error_hotspots_view`: Error patterns

### Event Handlers

Event handlers update projections:

```typescript
// Subscribe to events
eventBus.subscribe("ReconciliationStarted", async (event) => {
  await projectionHandlers.handleReconciliationStarted(event);
});

eventBus.subscribe("RecordMatched", async (event) => {
  await projectionHandlers.handleRecordMatched(event);
});
```

## Benefits

### 1. Scalability

- **Write Scaling**: Commands can be processed independently
- **Read Scaling**: Read models can be replicated/sharded
- **Event Store**: Append-only writes are highly performant

### 2. Auditability

- **Complete History**: Every change is recorded
- **Correlation**: Track related operations via correlation_id
- **Causation**: Understand event chains via causation_id

### 3. Flexibility

- **New Projections**: Add new read models without changing write model
- **Replay**: Rebuild projections from scratch
- **Time Travel**: Query state at any point in time

### 4. Resilience

- **Event Replay**: Recover from failures by replaying events
- **Idempotency**: Events can be safely replayed
- **Snapshots**: Fast recovery for large aggregates

## Query Patterns

### Get Events for Aggregate

```typescript
const events = await eventStore.getEvents(reconciliationId, "reconciliation");
```

### Get Events by Correlation ID

```typescript
const events = await eventStore.getEventsByCorrelationId(correlationId);
```

### Query Read Model

```typescript
const summary = await db.query(
  `
  SELECT * FROM reconciliation_summary
  WHERE reconciliation_id = $1
`,
  [reconciliationId]
);
```

## Best Practices

### 1. Event Design

- **Immutable**: Events never change
- **Versioned**: Use event_version for schema evolution
- **Rich Data**: Include all necessary context

### 2. Command Design

- **Idempotent**: Same command can be safely repeated
- **Validated**: Validate before emitting events
- **Minimal Reads**: Commands should do minimal direct reads

### 3. Projection Design

- **Denormalized**: Optimize for read patterns
- **Eventually Consistent**: Accept temporary inconsistencies
- **Rebuildable**: Can be rebuilt from events

### 4. Snapshot Strategy

- **Frequency**: Balance between storage and reconstruction time
- **Size**: Keep snapshots reasonably sized
- **Versioning**: Track snapshot schema versions

## Migration Strategy

When evolving event schemas:

1. **Add New Event Types**: Old events remain unchanged
2. **Version Events**: Use event_version for breaking changes
3. **Upgrade Handlers**: Handle multiple event versions
4. **Migrate Snapshots**: Rebuild snapshots with new schema

## Performance Optimization

1. **Batch Events**: Append multiple events atomically
2. **Async Projections**: Update read models asynchronously
3. **Snapshot Frequency**: Tune based on event volume
4. **Indexing**: Index event store for common queries

## Monitoring

Key metrics:

- Event append rate
- Projection lag
- Snapshot frequency
- Event store size
- Read model query performance
