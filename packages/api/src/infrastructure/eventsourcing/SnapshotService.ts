/**
 * Snapshot Service
 * Manages snapshots for event-sourced aggregates
 */

import { IEventStore } from './EventStore';
import { SnapshotEnvelope } from '../../domain/eventsourcing/EventEnvelope';

export interface SnapshotPolicy {
  snapshotEveryNEvents: number;
  maxEventsWithoutSnapshot: number;
}

export class SnapshotService {
  constructor(
    private eventStore: IEventStore,
    private policy: SnapshotPolicy = {
      snapshotEveryNEvents: 100,
      maxEventsWithoutSnapshot: 200,
    }
  ) {}

  /**
   * Check if a snapshot should be created for an aggregate
   */
  async shouldCreateSnapshot(
    aggregateId: string,
    aggregateType: string,
    currentEventCount: number
  ): Promise<boolean> {
    const snapshot = await this.eventStore.getLatestSnapshot(aggregateId, aggregateType);

    if (!snapshot) {
      // No snapshot exists, create one if we've exceeded max events
      return currentEventCount >= this.policy.maxEventsWithoutSnapshot;
    }

    // Check if we've exceeded the snapshot interval
    const eventsSinceSnapshot =
      await this.eventStore.getEventsAfterSnapshot(
        aggregateId,
        aggregateType,
        snapshot.snapshot_version
      );

    return eventsSinceSnapshot.length >= this.policy.snapshotEveryNEvents;
  }

  /**
   * Create a snapshot for an aggregate
   */
  async createSnapshot<T>(
    aggregateId: string,
    aggregateType: string,
    snapshotData: T,
    eventId: string
  ): Promise<void> {
    const latestSnapshot = await this.eventStore.getLatestSnapshot(
      aggregateId,
      aggregateType
    );

    const nextVersion = latestSnapshot
      ? latestSnapshot.snapshot_version + 1
      : 1;

    const snapshot: SnapshotEnvelope<T> = {
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
  async rebuildAggregate<T>(
    aggregateId: string,
    aggregateType: string,
    initialState: T,
    applyEvent: (state: T, event: unknown) => T
  ): Promise<T> {
    const snapshot = await this.eventStore.getLatestSnapshot(
      aggregateId,
      aggregateType
    );

    let state: T = initialState;

    if (snapshot) {
      state = snapshot.snapshot_data as T;
      const events = await this.eventStore.getEventsAfterSnapshot(
        aggregateId,
        aggregateType,
        snapshot.snapshot_version
      );

      for (const event of events) {
        state = applyEvent(state, event.data);
      }
    } else {
      // No snapshot, rebuild from all events
      const events = await this.eventStore.getEvents(aggregateId, aggregateType);
      for (const event of events) {
        state = applyEvent(state, event.data);
      }
    }

    return state;
  }
}
