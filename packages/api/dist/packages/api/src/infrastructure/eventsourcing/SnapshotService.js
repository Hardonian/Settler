"use strict";
/**
 * Snapshot Service
 * Manages snapshots for event-sourced aggregates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotService = void 0;
class SnapshotService {
    eventStore;
    policy;
    constructor(eventStore, policy = {
        snapshotEveryNEvents: 100,
        maxEventsWithoutSnapshot: 200,
    }) {
        this.eventStore = eventStore;
        this.policy = policy;
    }
    /**
     * Check if a snapshot should be created for an aggregate
     */
    async shouldCreateSnapshot(aggregateId, aggregateType, currentEventCount) {
        const snapshot = await this.eventStore.getLatestSnapshot(aggregateId, aggregateType);
        if (!snapshot) {
            // No snapshot exists, create one if we've exceeded max events
            return currentEventCount >= this.policy.maxEventsWithoutSnapshot;
        }
        // Check if we've exceeded the snapshot interval
        const eventsSinceSnapshot = await this.eventStore.getEventsAfterSnapshot(aggregateId, aggregateType, snapshot.snapshot_version);
        return eventsSinceSnapshot.length >= this.policy.snapshotEveryNEvents;
    }
    /**
     * Create a snapshot for an aggregate
     */
    async createSnapshot(aggregateId, aggregateType, snapshotData, eventId) {
        const latestSnapshot = await this.eventStore.getLatestSnapshot(aggregateId, aggregateType);
        const nextVersion = latestSnapshot
            ? latestSnapshot.snapshot_version + 1
            : 1;
        const snapshot = {
            aggregate_id: aggregateId,
            aggregate_type: aggregateType,
            snapshot_data: snapshotData,
            snapshot_version: nextVersion,
            event_id: eventId,
            created_at: new Date(),
        };
        await this.eventStore.saveSnapshot(snapshot);
    }
    /**
     * Rebuild aggregate from snapshot + events
     */
    async rebuildAggregate(aggregateId, aggregateType, initialState, applyEvent) {
        const snapshot = await this.eventStore.getLatestSnapshot(aggregateId, aggregateType);
        let state = initialState;
        if (snapshot) {
            state = snapshot.snapshot_data;
            const events = await this.eventStore.getEventsAfterSnapshot(aggregateId, aggregateType, snapshot.snapshot_version);
            for (const event of events) {
                state = applyEvent(state, event.data);
            }
        }
        else {
            // No snapshot, rebuild from all events
            const events = await this.eventStore.getEvents(aggregateId, aggregateType);
            for (const event of events) {
                state = applyEvent(state, event.data);
            }
        }
        return state;
    }
}
exports.SnapshotService = SnapshotService;
//# sourceMappingURL=SnapshotService.js.map