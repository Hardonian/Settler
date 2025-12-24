# Event Replay Guide

## Overview

Event replay allows you to rebuild read models from scratch and test new algorithms using historical events.

## Rebuilding Read Models

### Full Rebuild

Rebuild all projections from the event store:

```typescript
import { PostgresEventStore } from '../infrastructure/eventsourcing/EventStore';
import { ReconciliationProjectionHandlers } from '../application/cqrs/projections/ReconciliationProjections';

const eventStore = new PostgresEventStore();
const projectionHandlers = new ReconciliationProjectionHandlers();

// Get all reconciliation events
const events = await eventStore.getEventsByType('ReconciliationStarted');

for (const event of events) {
  const reconciliationId = event.aggregate_id;
  const allEvents = await eventStore.getEvents(reconciliationId, 'reconciliation');
  
  // Replay events to rebuild projection
  for (const e of allEvents) {
    switch (e.event_type) {
      case 'ReconciliationStarted':
        await projectionHandlers.handleReconciliationStarted(e);
        break;
      case 'OrdersFetched':
        await projectionHandlers.handleOrdersFetched(e);
        break;
      case 'PaymentsFetched':
        await projectionHandlers.handlePaymentsFetched(e);
        break;
      case 'RecordMatched':
        await projectionHandlers.handleRecordMatched(e);
        break;
      case 'RecordUnmatched':
        await projectionHandlers.handleRecordUnmatched(e);
        break;
      case 'ReconciliationCompleted':
        await projectionHandlers.handleReconciliationCompleted(e);
        break;
      case 'ReconciliationFailed':
        await projectionHandlers.handleReconciliationFailed(e);
        break;
    }
  }
}
```

### Incremental Rebuild

Rebuild projections for a specific reconciliation:

```typescript
async function rebuildReconciliationProjection(reconciliationId: string) {
  // Clear existing projection
  await db.query('DELETE FROM reconciliation_summary WHERE reconciliation_id = $1', [reconciliationId]);
  
  // Get all events
  const events = await eventStore.getEvents(reconciliationId, 'reconciliation');
  
  // Replay events
  for (const event of events) {
    await applyEventToProjection(event);
  }
}
```

## Replaying Historical Events

### Dry-Run Reconciliation

Test new matching algorithms using historical events:

```typescript
import { AdminService } from '../application/admin/AdminService';

const adminService = new AdminService(...);

// Get historical events for a reconciliation
const events = await adminService.listEventsForAggregate(
  reconciliationId,
  'reconciliation'
);

// Extract orders and payments from events
const ordersFetchedEvent = events.find(e => e.event_type === 'OrdersFetched');
const paymentsFetchedEvent = events.find(e => e.event_type === 'PaymentsFetched');

const orders = ordersFetchedEvent.data.orders;
const payments = paymentsFetchedEvent.data.payments;

// Test new matching algorithm
const newMatches = newMatchingAlgorithm(orders, payments);

// Compare with original matches
const originalMatches = events.filter(e => e.event_type === 'RecordMatched');
console.log(`Original: ${originalMatches.length}, New: ${newMatches.length}`);
```

### Replay Specific Event Range

Replay events within a time range:

```typescript
async function replayEventsInRange(startDate: Date, endDate: Date) {
  const query = `
    SELECT * FROM event_store
    WHERE created_at >= $1 AND created_at <= $2
    ORDER BY created_at ASC
  `;
  
  const events = await db.query(query, [startDate, endDate]);
  
  for (const event of events) {
    await applyEventToProjection(event);
  }
}
```

## Using Snapshots

### Rebuild from Snapshot

For large aggregates, use snapshots for faster reconstruction:

```typescript
import { SnapshotService } from '../infrastructure/eventsourcing/SnapshotService';

const snapshotService = new SnapshotService(eventStore);

// Rebuild aggregate from snapshot + tail events
const state = await snapshotService.rebuildAggregate(
  reconciliationId,
  'reconciliation',
  initialState,
  applyEvent
);
```

### Create Snapshot

Manually create a snapshot:

```typescript
const snapshot = await snapshotService.createSnapshot(
  reconciliationId,
  'reconciliation',
  currentState,
  lastEventId
);
```

## CLI Commands

### Rebuild All Projections

```bash
npm run admin:rebuild-projections
```

### Rebuild Single Reconciliation

```bash
npm run admin:rebuild-projection --reconciliation-id=<id>
```

### Replay Events

```bash
npm run admin:replay-events --correlation-id=<id>
```

### Dry-Run Reconciliation

```bash
npm run admin:dry-run --reconciliation-id=<id>
```

## Admin API Endpoints

### List Events for Aggregate

```http
GET /admin/events/reconciliation/{reconciliationId}
```

### List Events by Correlation ID

```http
GET /admin/events/correlation/{correlationId}
```

### Dry-Run Reconciliation

```http
POST /admin/dry-run
Content-Type: application/json

{
  "reconciliation_id": "recon_123",
  "events": [...]
}
```

## Testing New Algorithms

### Step 1: Extract Historical Data

```typescript
const events = await eventStore.getEvents(reconciliationId, 'reconciliation');
const orders = extractOrders(events);
const payments = extractPayments(events);
```

### Step 2: Run New Algorithm

```typescript
const newMatches = newMatchingAlgorithm(orders, payments, newRules);
```

### Step 3: Compare Results

```typescript
const originalMatches = extractMatches(events);
const comparison = compareMatches(originalMatches, newMatches);

console.log({
  originalCount: originalMatches.length,
  newCount: newMatches.length,
  differences: comparison.differences,
  accuracy: comparison.accuracy
});
```

### Step 4: Validate

```typescript
if (comparison.accuracy > threshold) {
  // New algorithm is better, deploy it
  await deployNewAlgorithm();
} else {
  // Keep original algorithm
  console.log('New algorithm does not improve accuracy');
}
```

## Best Practices

1. **Always Backup**: Backup projections before rebuilding
2. **Test Incrementally**: Test on small datasets first
3. **Monitor Performance**: Track rebuild time and resource usage
4. **Validate Results**: Compare rebuilt projections with originals
5. **Schedule Rebuilds**: Rebuild during low-traffic periods

## Troubleshooting

### Projection Out of Sync

If projections are out of sync with events:

```typescript
// 1. Identify discrepancies
const discrepancies = await findDiscrepancies();

// 2. Rebuild affected projections
for (const reconciliationId of discrepancies) {
  await rebuildReconciliationProjection(reconciliationId);
}
```

### Missing Events

If events are missing:

```typescript
// Check event store for gaps
const gaps = await findEventGaps(reconciliationId);

// Replay from last known good event
if (gaps.length > 0) {
  await replayFromEvent(gaps[0].previousEventId);
}
```

### Snapshot Corruption

If snapshot is corrupted:

```typescript
// Rebuild from all events (ignore snapshot)
const events = await eventStore.getEvents(reconciliationId, 'reconciliation');
const state = rebuildFromEvents(events, initialState);

// Create new snapshot
await snapshotService.createSnapshot(reconciliationId, 'reconciliation', state, lastEventId);
```

## Performance Tips

1. **Use Snapshots**: For aggregates with >100 events
2. **Batch Processing**: Process events in batches
3. **Parallel Replay**: Replay multiple reconciliations in parallel
4. **Index Optimization**: Ensure event store indexes are optimal
5. **Connection Pooling**: Use connection pooling for database operations
