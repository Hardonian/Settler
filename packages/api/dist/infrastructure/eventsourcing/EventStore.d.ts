/**
 * Event Store Repository
 * Append-only event store backed by Postgres
 */
import { Pool } from 'pg';
import { EventEnvelope, SnapshotEnvelope } from '../../domain/eventsourcing/EventEnvelope';
export interface IEventStore {
    append(event: EventEnvelope): Promise<void>;
    appendMany(events: EventEnvelope[]): Promise<void>;
    getEvents(aggregateId: string, aggregateType: string, fromVersion?: number): Promise<EventEnvelope[]>;
    getEventsByType(eventType: string, limit?: number): Promise<EventEnvelope[]>;
    getEventsByCorrelationId(correlationId: string): Promise<EventEnvelope[]>;
    saveSnapshot(snapshot: SnapshotEnvelope): Promise<void>;
    getLatestSnapshot(aggregateId: string, aggregateType: string): Promise<SnapshotEnvelope | null>;
    getEventsAfterSnapshot(aggregateId: string, aggregateType: string, snapshotVersion: number): Promise<EventEnvelope[]>;
}
export declare class PostgresEventStore implements IEventStore {
    private db;
    constructor(db?: Pool);
    append(event: EventEnvelope): Promise<void>;
    appendMany(events: EventEnvelope[]): Promise<void>;
    getEvents(aggregateId: string, aggregateType: string, fromVersion?: number): Promise<EventEnvelope[]>;
    getEventsByType(eventType: string, limit?: number): Promise<EventEnvelope[]>;
    getEventsByCorrelationId(correlationId: string): Promise<EventEnvelope[]>;
    saveSnapshot(snapshot: SnapshotEnvelope): Promise<void>;
    getLatestSnapshot(aggregateId: string, aggregateType: string): Promise<SnapshotEnvelope | null>;
    getEventsAfterSnapshot(aggregateId: string, aggregateType: string, snapshotVersion: number): Promise<EventEnvelope[]>;
}
//# sourceMappingURL=EventStore.d.ts.map