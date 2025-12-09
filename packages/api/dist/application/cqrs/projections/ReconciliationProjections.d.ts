/**
 * Reconciliation Read Model Projections
 * Event handlers that update read models
 */
import { Pool } from 'pg';
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
export declare class ReconciliationProjectionHandlers {
    private db;
    constructor(db?: Pool);
    /**
     * Handle ReconciliationStarted event
     */
    handleReconciliationStarted(event: DomainEvent): Promise<void>;
    /**
     * Handle OrdersFetched event
     */
    handleOrdersFetched(eventEnvelope: EventEnvelope): Promise<void>;
    /**
     * Handle PaymentsFetched event
     */
    handlePaymentsFetched(eventEnvelope: EventEnvelope): Promise<void>;
    /**
     * Handle RecordMatched event
     */
    handleRecordMatched(eventEnvelope: EventEnvelope): Promise<void>;
    /**
     * Handle RecordUnmatched event
     */
    handleRecordUnmatched(eventEnvelope: EventEnvelope): Promise<void>;
    /**
     * Handle ReconciliationCompleted event
     */
    handleReconciliationCompleted(eventEnvelope: EventEnvelope): Promise<void>;
    /**
     * Handle ReconciliationFailed event
     */
    handleReconciliationFailed(eventEnvelope: EventEnvelope): Promise<void>;
    /**
     * Update tenant usage view
     */
    private updateTenantUsage;
    /**
     * Update error hotspots view
     */
    private updateErrorHotspots;
}
//# sourceMappingURL=ReconciliationProjections.d.ts.map