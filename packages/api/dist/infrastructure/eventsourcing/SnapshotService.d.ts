/**
 * Snapshot Service
 * Manages snapshots for event-sourced aggregates
 */
import { IEventStore } from './EventStore';
export interface SnapshotPolicy {
    snapshotEveryNEvents: number;
    maxEventsWithoutSnapshot: number;
}
export declare class SnapshotService {
    private eventStore;
    private policy;
    constructor(eventStore: IEventStore, policy?: SnapshotPolicy);
    /**
     * Check if a snapshot should be created for an aggregate
     */
    shouldCreateSnapshot(aggregateId: string, aggregateType: string, currentEventCount: number): Promise<boolean>;
    /**
     * Create a snapshot for an aggregate
     */
    createSnapshot<T>(aggregateId: string, aggregateType: string, snapshotData: T, eventId: string): Promise<void>;
    /**
     * Rebuild aggregate from snapshot + events
     */
    rebuildAggregate<T>(aggregateId: string, aggregateType: string, initialState: T, applyEvent: (state: T, event: unknown) => T): Promise<T>;
}
//# sourceMappingURL=SnapshotService.d.ts.map