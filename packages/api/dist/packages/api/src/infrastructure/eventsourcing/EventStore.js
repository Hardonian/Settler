"use strict";
/**
 * Event Store Repository
 * Append-only event store backed by Postgres
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresEventStore = void 0;
const db_1 = require("../../db");
class PostgresEventStore {
    db;
    constructor(db = db_1.pool) {
        this.db = db;
    }
    async append(event) {
        const query = `
      INSERT INTO event_store (
        event_id,
        aggregate_id,
        aggregate_type,
        event_type,
        event_version,
        data,
        metadata,
        tenant_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
        await this.db.query(query, [
            event.id,
            event.aggregate_id,
            event.aggregate_type,
            event.event_type,
            event.event_version,
            JSON.stringify(event.data),
            JSON.stringify(event.metadata),
            event.metadata.tenant_id,
            event.created_at,
        ]);
    }
    async appendMany(events) {
        if (events.length === 0)
            return;
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            for (const event of events) {
                await client.query(`
          INSERT INTO event_store (
            event_id,
            aggregate_id,
            aggregate_type,
            event_type,
            event_version,
            data,
            metadata,
            tenant_id,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
                    event.id,
                    event.aggregate_id,
                    event.aggregate_type,
                    event.event_type,
                    event.event_version,
                    JSON.stringify(event.data),
                    JSON.stringify(event.metadata),
                    event.metadata.tenant_id,
                    event.created_at,
                ]);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getEvents(aggregateId, aggregateType, fromVersion) {
        let query = `
      SELECT 
        event_id as id,
        aggregate_id,
        aggregate_type,
        event_type,
        event_version,
        data,
        metadata,
        created_at
      FROM event_store
      WHERE aggregate_id = $1 AND aggregate_type = $2
    `;
        const params = [aggregateId, aggregateType];
        if (fromVersion !== undefined) {
            query += ` AND event_version >= $3`;
            params.push(fromVersion);
        }
        query += ` ORDER BY id ASC`;
        const result = await this.db.query(query, params);
        return result.rows.map((row) => ({
            id: row.id,
            aggregate_id: row.aggregate_id,
            aggregate_type: row.aggregate_type,
            event_type: row.event_type,
            event_version: row.event_version,
            data: row.data,
            metadata: row.metadata,
            created_at: new Date(row.created_at),
        }));
    }
    async getEventsByType(eventType, limit = 100) {
        const query = `
      SELECT 
        event_id as id,
        aggregate_id,
        aggregate_type,
        event_type,
        event_version,
        data,
        metadata,
        created_at
      FROM event_store
      WHERE event_type = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
        const result = await this.db.query(query, [eventType, limit]);
        return result.rows.map((row) => ({
            id: row.id,
            aggregate_id: row.aggregate_id,
            aggregate_type: row.aggregate_type,
            event_type: row.event_type,
            event_version: row.event_version,
            data: row.data,
            metadata: row.metadata,
            created_at: new Date(row.created_at),
        }));
    }
    async getEventsByCorrelationId(correlationId) {
        const query = `
      SELECT 
        event_id as id,
        aggregate_id,
        aggregate_type,
        event_type,
        event_version,
        data,
        metadata,
        created_at
      FROM event_store
      WHERE metadata->>'correlation_id' = $1
      ORDER BY created_at ASC
    `;
        const result = await this.db.query(query, [correlationId]);
        return result.rows.map((row) => ({
            id: row.id,
            aggregate_id: row.aggregate_id,
            aggregate_type: row.aggregate_type,
            event_type: row.event_type,
            event_version: row.event_version,
            data: row.data,
            metadata: row.metadata,
            created_at: new Date(row.created_at),
        }));
    }
    async saveSnapshot(snapshot) {
        const query = `
      INSERT INTO snapshots (
        aggregate_id,
        aggregate_type,
        snapshot_data,
        snapshot_version,
        event_id,
        tenant_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (aggregate_id, aggregate_type, snapshot_version)
      DO UPDATE SET
        snapshot_data = EXCLUDED.snapshot_data,
        event_id = EXCLUDED.event_id,
        created_at = EXCLUDED.created_at
    `;
        // Extract tenant_id from event metadata if available
        const event = await this.db.query('SELECT metadata FROM event_store WHERE event_id = $1', [snapshot.event_id]);
        const tenantId = event.rows[0]?.metadata?.tenant_id || null;
        await this.db.query(query, [
            snapshot.aggregate_id,
            snapshot.aggregate_type,
            JSON.stringify(snapshot.snapshot_data),
            snapshot.snapshot_version,
            snapshot.event_id,
            tenantId,
            snapshot.created_at,
        ]);
    }
    async getLatestSnapshot(aggregateId, aggregateType) {
        const query = `
      SELECT 
        aggregate_id,
        aggregate_type,
        snapshot_data,
        snapshot_version,
        event_id,
        created_at
      FROM snapshots
      WHERE aggregate_id = $1 AND aggregate_type = $2
      ORDER BY snapshot_version DESC
      LIMIT 1
    `;
        const result = await this.db.query(query, [aggregateId, aggregateType]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            aggregate_id: row.aggregate_id,
            aggregate_type: row.aggregate_type,
            snapshot_data: row.snapshot_data,
            snapshot_version: row.snapshot_version,
            event_id: row.event_id,
            created_at: new Date(row.created_at),
        };
    }
    async getEventsAfterSnapshot(aggregateId, aggregateType, snapshotVersion) {
        // First, get the event_id for the snapshot
        const snapshotResult = await this.db.query(`
      SELECT event_id, id as snapshot_event_store_id
      FROM snapshots
      WHERE aggregate_id = $1 AND aggregate_type = $2 AND snapshot_version = $3
      LIMIT 1
    `, [aggregateId, aggregateType, snapshotVersion]);
        if (snapshotResult.rows.length === 0) {
            // No snapshot found, return all events
            return this.getEvents(aggregateId, aggregateType);
        }
        const snapshotEventId = snapshotResult.rows[0].event_id;
        // Get the event_store.id for the snapshot event
        const eventStoreIdResult = await this.db.query('SELECT id FROM event_store WHERE event_id = $1', [snapshotEventId]);
        if (eventStoreIdResult.rows.length === 0) {
            return this.getEvents(aggregateId, aggregateType);
        }
        const snapshotEventStoreId = eventStoreIdResult.rows[0].id;
        // Get all events after the snapshot event
        const query = `
      SELECT 
        event_id as id,
        aggregate_id,
        aggregate_type,
        event_type,
        event_version,
        data,
        metadata,
        created_at
      FROM event_store
      WHERE aggregate_id = $1 
        AND aggregate_type = $2
        AND id > $3
      ORDER BY id ASC
    `;
        const result = await this.db.query(query, [
            aggregateId,
            aggregateType,
            snapshotEventStoreId,
        ]);
        return result.rows.map((row) => ({
            id: row.id,
            aggregate_id: row.aggregate_id,
            aggregate_type: row.aggregate_type,
            event_type: row.event_type,
            event_version: row.event_version,
            data: row.data,
            metadata: row.metadata,
            created_at: new Date(row.created_at),
        }));
    }
}
exports.PostgresEventStore = PostgresEventStore;
//# sourceMappingURL=EventStore.js.map