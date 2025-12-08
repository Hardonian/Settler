/**
 * Reconciliation Domain Events
 * Core lifecycle events for reconciliation flows
 */

import { EventEnvelope, createEventEnvelope, createEventMetadata } from '../EventEnvelope';

// ============================================================================
// Event Data Types
// ============================================================================

export interface ReconciliationStartedData {
  reconciliation_id: string;
  job_id: string;
  source_adapter: string;
  target_adapter: string;
  date_range: {
    start: string;
    end: string;
  };
  initiated_by?: string;
}

export interface OrdersFetchedData {
  reconciliation_id: string;
  source: 'shopify' | 'stripe' | string;
  count: number;
  orders: Array<{
    id: string;
    amount: number;
    currency: string;
    date: string;
    metadata?: Record<string, unknown>;
  }>;
  fetch_duration_ms: number;
}

export interface PaymentsFetchedData {
  reconciliation_id: string;
  source: 'stripe' | 'paypal' | string;
  count: number;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    date: string;
    metadata?: Record<string, unknown>;
  }>;
  fetch_duration_ms: number;
}

export interface RecordMatchedData {
  reconciliation_id: string;
  match_id: string;
  source_id: string;
  target_id: string;
  amount: number;
  currency: string;
  confidence: number;
  matched_fields: string[];
  matched_at: string;
}

export interface RecordUnmatchedData {
  reconciliation_id: string;
  source_id?: string;
  target_id?: string;
  amount?: number;
  currency?: string;
  reason: string;
  unmatched_at: string;
}

export interface ReconciliationCompletedData {
  reconciliation_id: string;
  summary: {
    total_source_records: number;
    total_target_records: number;
    matched_count: number;
    unmatched_source_count: number;
    unmatched_target_count: number;
    errors_count: number;
    duration_ms: number;
    accuracy_percentage: number;
  };
  completed_at: string;
}

export interface ReconciliationFailedData {
  reconciliation_id: string;
  error: {
    type: string;
    message: string;
    stack?: string;
  };
  failed_at: string;
  step?: string;
  retryable: boolean;
}

// ============================================================================
// Event Factory Functions
// ============================================================================

export class ReconciliationEvents {
  static ReconciliationStarted(
    reconciliationId: string,
    data: ReconciliationStartedData,
    tenantId: string,
    userId?: string,
    correlationId?: string
  ): EventEnvelope<ReconciliationStartedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'ReconciliationStarted',
      data,
      createEventMetadata(tenantId, userId, correlationId),
      1
    );
  }

  static OrdersFetched(
    reconciliationId: string,
    data: OrdersFetchedData,
    tenantId: string,
    correlationId: string
  ): EventEnvelope<OrdersFetchedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'OrdersFetched',
      data,
      createEventMetadata(tenantId, undefined, correlationId),
      1
    );
  }

  static PaymentsFetched(
    reconciliationId: string,
    data: PaymentsFetchedData,
    tenantId: string,
    correlationId: string
  ): EventEnvelope<PaymentsFetchedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'PaymentsFetched',
      data,
      createEventMetadata(tenantId, undefined, correlationId),
      1
    );
  }

  static RecordMatched(
    reconciliationId: string,
    data: RecordMatchedData,
    tenantId: string,
    correlationId: string
  ): EventEnvelope<RecordMatchedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'RecordMatched',
      data,
      createEventMetadata(tenantId, undefined, correlationId),
      1
    );
  }

  static RecordUnmatched(
    reconciliationId: string,
    data: RecordUnmatchedData,
    tenantId: string,
    correlationId: string
  ): EventEnvelope<RecordUnmatchedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'RecordUnmatched',
      data,
      createEventMetadata(tenantId, undefined, correlationId),
      1
    );
  }

  static ReconciliationCompleted(
    reconciliationId: string,
    data: ReconciliationCompletedData,
    tenantId: string,
    correlationId: string
  ): EventEnvelope<ReconciliationCompletedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'ReconciliationCompleted',
      data,
      createEventMetadata(tenantId, undefined, correlationId),
      1
    );
  }

  static ReconciliationFailed(
    reconciliationId: string,
    data: ReconciliationFailedData,
    tenantId: string,
    correlationId: string
  ): EventEnvelope<ReconciliationFailedData> {
    return createEventEnvelope(
      reconciliationId,
      'reconciliation',
      'ReconciliationFailed',
      data,
      createEventMetadata(tenantId, undefined, correlationId),
      1
    );
  }
}
