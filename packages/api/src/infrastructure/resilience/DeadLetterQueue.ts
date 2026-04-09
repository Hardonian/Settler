/**
 * Dead Letter Queue
 * Handles irrecoverable jobs and events
 */

import { Pool } from "pg";
import { pool } from "../../db";

export interface DeadLetterEntry {
  id: string;
  saga_id?: string;
  event_id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  payload: Record<string, unknown>;
  retry_count: number;
  max_retries: number;
  tenant_id: string;
  correlation_id?: string;
  created_at: Date;
  resolved_at?: Date;
  resolution_notes?: string;
}

export class DeadLetterQueue {
  constructor(private db: Pool = pool) {}

  /**
   * Add an entry to the dead letter queue
   */
  async addEntry(entry: Omit<DeadLetterEntry, "id" | "created_at">): Promise<string> {
    const id = crypto.randomUUID();
    const query = `
      INSERT INTO dead_letter_queue (
        id,
        saga_id,
        event_id,
        error_type,
        error_message,
        error_stack,
        payload,
        retry_count,
        max_retries,
        tenant_id,
        correlation_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `;

    await this.db.query(query, [
      id,
      entry.saga_id || null,
      entry.event_id || null,
      entry.error_type,
      entry.error_message,
      entry.error_stack || null,
      JSON.stringify(entry.payload),
      entry.retry_count,
      entry.max_retries,
      entry.tenant_id,
      entry.correlation_id || null,
    ]);

    return id;
  }

  /**
   * Get unresolved entries
   */
  async getUnresolvedEntries(limit: number = 100): Promise<DeadLetterEntry[]> {
    const query = `
      SELECT 
        id,
        saga_id,
        event_id,
        error_type,
        error_message,
        error_stack,
        payload,
        retry_count,
        max_retries,
        tenant_id,
        correlation_id,
        created_at,
        resolved_at,
        resolution_notes
      FROM dead_letter_queue
      WHERE resolved_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
    `;

    const result = await this.db.query(query, [limit]);

    return result.rows.map((row): DeadLetterEntry => {
      const entry: DeadLetterEntry = {
        id: row.id,
        error_type: row.error_type,
        error_message: row.error_message,
        payload: JSON.parse(row.payload) as Record<string, unknown>,
        retry_count: row.retry_count,
        max_retries: row.max_retries,
        tenant_id: row.tenant_id,
        created_at: new Date(row.created_at),
      };
      if (row.saga_id) {
        entry.saga_id = row.saga_id;
      }
      if (row.event_id) {
        entry.event_id = row.event_id;
      }
      if (row.error_stack) {
        entry.error_stack = row.error_stack;
      }
      if (row.correlation_id) {
        entry.correlation_id = row.correlation_id;
      }
      if (row.resolved_at) {
        entry.resolved_at = new Date(row.resolved_at);
      }
      if (row.resolution_notes) {
        entry.resolution_notes = row.resolution_notes;
      }
      return entry;
    });
  }

  /**
   * Resolve an entry
   */
  async resolveEntry(id: string, resolutionNotes?: string): Promise<void> {
    const query = `
      UPDATE dead_letter_queue
      SET 
        resolved_at = NOW(),
        resolution_notes = $1
      WHERE id = $2
    `;

    await this.db.query(query, [resolutionNotes || null, id]);
  }

  /**
   * Get entries by tenant
   */
  async getEntriesByTenant(tenantId: string, limit: number = 100): Promise<DeadLetterEntry[]> {
    const query = `
      SELECT 
        id,
        saga_id,
        event_id,
        error_type,
        error_message,
        error_stack,
        payload,
        retry_count,
        max_retries,
        tenant_id,
        correlation_id,
        created_at,
        resolved_at,
        resolution_notes
      FROM dead_letter_queue
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [tenantId, limit]);

    return result.rows.map((row): DeadLetterEntry => {
      const entry: DeadLetterEntry = {
        id: row.id,
        error_type: row.error_type,
        error_message: row.error_message,
        payload: JSON.parse(row.payload) as Record<string, unknown>,
        retry_count: row.retry_count,
        max_retries: row.max_retries,
        tenant_id: row.tenant_id,
        created_at: new Date(row.created_at),
      };
      if (row.saga_id) {
        entry.saga_id = row.saga_id;
      }
      if (row.event_id) {
        entry.event_id = row.event_id;
      }
      if (row.error_stack) {
        entry.error_stack = row.error_stack;
      }
      if (row.correlation_id) {
        entry.correlation_id = row.correlation_id;
      }
      if (row.resolved_at) {
        entry.resolved_at = new Date(row.resolved_at);
      }
      if (row.resolution_notes) {
        entry.resolution_notes = row.resolution_notes;
      }
      return entry;
    });
  }
}
