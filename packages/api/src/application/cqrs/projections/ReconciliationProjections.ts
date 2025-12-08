/**
 * Reconciliation Read Model Projections
 * Event handlers that update read models
 */

import { Pool } from 'pg';
import { pool } from '../../../db';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { EventEnvelope } from '../../../domain/eventsourcing/EventEnvelope';

export interface ReconciliationSummary {
  reconciliation_id: string;
  job_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  total_source_records: number;
  total_target_records: number;
  matched_count: number;
  unmatched_source_count: number;
  unmatched_target_count: number;
  errors_count: number;
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  accuracy_percentage?: number;
  tenant_id: string;
  updated_at: Date;
}

export interface TenantUsageView {
  tenant_id: string;
  date: Date;
  reconciliation_count: number;
  total_duration_ms: number;
  success_count: number;
  failure_count: number;
}

export interface ErrorHotspotsView {
  reconciliation_id: string;
  job_id: string;
  error_type: string;
  error_count: number;
  step: string;
  first_occurred_at: Date;
  last_occurred_at: Date;
  tenant_id: string;
}

export class ReconciliationProjectionHandlers {
  constructor(private db: Pool = pool) {}

  /**
   * Handle ReconciliationStarted event
   */
  async handleReconciliationStarted(event: DomainEvent): Promise<void> {
    // Extract data from event (would need to fetch from event store)
    // For now, create initial summary record
    const query = `
      INSERT INTO reconciliation_summary (
        reconciliation_id,
        job_id,
        status,
        tenant_id,
        started_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (reconciliation_id) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `;

    // Extract from event metadata
    const tenantId = (event as any).tenantId || 'unknown';
    const reconciliationId = (event as any).reconciliationId;
    const jobId = (event as any).jobId;

    await this.db.query(query, [
      reconciliationId,
      jobId,
      'running',
      tenantId,
      new Date(),
      new Date(),
    ]);
  }

  /**
   * Handle OrdersFetched event
   */
  async handleOrdersFetched(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const query = `
      UPDATE reconciliation_summary
      SET 
        total_source_records = $1,
        updated_at = NOW()
      WHERE reconciliation_id = $2
    `;

    await this.db.query(query, [data.count, data.reconciliation_id]);
  }

  /**
   * Handle PaymentsFetched event
   */
  async handlePaymentsFetched(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const query = `
      UPDATE reconciliation_summary
      SET 
        total_target_records = $1,
        updated_at = NOW()
      WHERE reconciliation_id = $2
    `;

    await this.db.query(query, [data.count, data.reconciliation_id]);
  }

  /**
   * Handle RecordMatched event
   */
  async handleRecordMatched(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const query = `
      UPDATE reconciliation_summary
      SET 
        matched_count = matched_count + 1,
        updated_at = NOW()
      WHERE reconciliation_id = $1
    `;

    await this.db.query(query, [data.reconciliation_id]);
  }

  /**
   * Handle RecordUnmatched event
   */
  async handleRecordUnmatched(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const query = `
      UPDATE reconciliation_summary
      SET 
        unmatched_source_count = CASE 
          WHEN $2 = 'source' THEN unmatched_source_count + 1 
          ELSE unmatched_source_count 
        END,
        unmatched_target_count = CASE 
          WHEN $2 = 'target' THEN unmatched_target_count + 1 
          ELSE unmatched_target_count 
        END,
        updated_at = NOW()
      WHERE reconciliation_id = $1
    `;

    const unmatchedType = data.source_id ? 'source' : 'target';
    await this.db.query(query, [data.reconciliation_id, unmatchedType]);
  }

  /**
   * Handle ReconciliationCompleted event
   */
  async handleReconciliationCompleted(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const query = `
      UPDATE reconciliation_summary
      SET 
        status = 'completed',
        matched_count = $1,
        unmatched_source_count = $2,
        unmatched_target_count = $3,
        errors_count = $4,
        duration_ms = $5,
        accuracy_percentage = $6,
        completed_at = $7,
        updated_at = NOW()
      WHERE reconciliation_id = $8
    `;

    await this.db.query(query, [
      data.summary.matched_count,
      data.summary.unmatched_source_count,
      data.summary.unmatched_target_count,
      data.summary.errors_count,
      data.summary.duration_ms,
      data.summary.accuracy_percentage,
      new Date(data.completed_at),
      data.reconciliation_id,
    ]);

    // Update tenant usage view
    await this.updateTenantUsage(eventEnvelope);
  }

  /**
   * Handle ReconciliationFailed event
   */
  async handleReconciliationFailed(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const query = `
      UPDATE reconciliation_summary
      SET 
        status = 'failed',
        errors_count = errors_count + 1,
        completed_at = $1,
        updated_at = NOW()
      WHERE reconciliation_id = $2
    `;

    await this.db.query(query, [new Date(data.failed_at), data.reconciliation_id]);

    // Update error hotspots
    await this.updateErrorHotspots(eventEnvelope);
  }

  /**
   * Update tenant usage view
   */
  private async updateTenantUsage(eventEnvelope: EventEnvelope): Promise<void> {
    const tenantId = eventEnvelope.metadata.tenant_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = `
      INSERT INTO tenant_usage_view (
        tenant_id,
        date,
        reconciliation_count,
        total_duration_ms,
        success_count,
        failure_count
      ) VALUES ($1, $2, 1, $3, 1, 0)
      ON CONFLICT (tenant_id, date) DO UPDATE SET
        reconciliation_count = tenant_usage_view.reconciliation_count + 1,
        total_duration_ms = tenant_usage_view.total_duration_ms + EXCLUDED.total_duration_ms,
        success_count = tenant_usage_view.success_count + 1
    `;

    const data = eventEnvelope.data as any;
    await this.db.query(query, [
      tenantId,
      today,
      data.summary?.duration_ms || 0,
    ]);
  }

  /**
   * Update error hotspots view
   */
  private async updateErrorHotspots(eventEnvelope: EventEnvelope): Promise<void> {
    const data = eventEnvelope.data as any;
    const tenantId = eventEnvelope.metadata.tenant_id;

    const query = `
      INSERT INTO error_hotspots_view (
        reconciliation_id,
        job_id,
        error_type,
        error_count,
        step,
        first_occurred_at,
        last_occurred_at,
        tenant_id
      ) VALUES ($1, $2, $3, 1, $4, $5, $5, $6)
      ON CONFLICT (reconciliation_id, error_type, step) DO UPDATE SET
        error_count = error_hotspots_view.error_count + 1,
        last_occurred_at = EXCLUDED.last_occurred_at
    `;

    await this.db.query(query, [
      data.reconciliation_id,
      (data as any).job_id || 'unknown',
      data.error.type,
      data.step || 'unknown',
      new Date(data.failed_at),
      tenantId,
    ]);
  }
}
