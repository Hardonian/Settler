/**
 * Value Ledger
 * 
 * Tracks measurable outcomes that prove Settler's value:
 * - Reconciliations completed
 * - Receipts processed
 * - Exports generated
 * - Time saved (estimated)
 * - Dollars reconciled
 * - Errors prevented
 * 
 * This is investor ammo and retention glue.
 */

import { prisma } from '@/shared/db/prismaClient';

export type ValueEventType =
  | 'reconciliation_completed'
  | 'receipt_processed'
  | 'export_generated'
  | 'exception_resolved'
  | 'time_saved_hours'
  | 'dollars_reconciled'
  | 'errors_prevented'
  | 'connector_synced';

export interface ValueEvent {
  billingAccountId: string;
  tenantId?: string;
  userId?: string;
  eventType: ValueEventType;
  quantity: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record a value event
 * Should be called from server-side code after successful operations
 */
export async function recordValueEvent(event: ValueEvent): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO value_ledger (
        billing_account_id,
        tenant_id,
        user_id,
        event_type,
        quantity,
        unit,
        metadata,
        created_at
      ) VALUES (
        ${event.billingAccountId}::uuid,
        ${event.tenantId || null}::uuid,
        ${event.userId || null}::uuid,
        ${event.eventType}::varchar,
        ${event.quantity}::decimal,
        ${event.unit || null}::varchar,
        ${JSON.stringify(event.metadata || {})}::jsonb,
        NOW()
      )
    `;

    // Update daily aggregate (upsert)
    await prisma.$executeRaw`
      INSERT INTO value_ledger_daily (
        billing_account_id,
        tenant_id,
        date,
        event_type,
        total_quantity,
        event_count,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${event.billingAccountId}::uuid,
        ${event.tenantId || null}::uuid,
        CURRENT_DATE,
        ${event.eventType}::varchar,
        ${event.quantity}::decimal,
        1,
        ${JSON.stringify(event.metadata || {})}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (billing_account_id, date, event_type)
      DO UPDATE SET
        total_quantity = value_ledger_daily.total_quantity + ${event.quantity}::decimal,
        event_count = value_ledger_daily.event_count + 1,
        updated_at = NOW()
    `;
  } catch (error) {
    // Log but don't throw - value tracking should never break user flows
    console.error('[recordValueEvent] Failed to record value event:', error);
  }
}

export interface ValueMetrics {
  reconciliationsCompleted: number;
  receiptsProcessed: number;
  exportsGenerated: number;
  exceptionsResolved: number;
  timeSavedHours: number;
  dollarsReconciled: number;
  errorsPrevented: number;
  period: '7d' | '30d' | 'lifetime';
}

/**
 * Get value metrics for a billing account
 */
export async function getValueMetrics(
  billingAccountId: string,
  period: '7d' | '30d' | 'lifetime' = '30d'
): Promise<ValueMetrics> {
  try {
    const startDate = period === 'lifetime' 
      ? new Date(0) 
      : period === '7d'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Query daily aggregates for performance
    const aggregates = (await prisma.$queryRaw`
      SELECT
        event_type,
        SUM(total_quantity) as total_quantity,
        SUM(event_count) as event_count
      FROM value_ledger_daily
      WHERE billing_account_id = ${billingAccountId}::uuid
        AND date >= ${startDate}::date
      GROUP BY event_type
    `) as Array<{
      event_type: string;
      total_quantity: number;
      event_count: number;
    }>;

    const metrics: ValueMetrics = {
      reconciliationsCompleted: 0,
      receiptsProcessed: 0,
      exportsGenerated: 0,
      exceptionsResolved: 0,
      timeSavedHours: 0,
      dollarsReconciled: 0,
      errorsPrevented: 0,
      period,
    };

    for (const agg of aggregates) {
      const quantity = Number(agg.total_quantity) || 0;
      const count = Number(agg.event_count) || 0;

      switch (agg.event_type) {
        case 'reconciliation_completed':
          metrics.reconciliationsCompleted = count;
          break;
        case 'receipt_processed':
          metrics.receiptsProcessed = count;
          break;
        case 'export_generated':
          metrics.exportsGenerated = count;
          break;
        case 'exception_resolved':
          metrics.exceptionsResolved = count;
          break;
        case 'time_saved_hours':
          metrics.timeSavedHours = quantity;
          break;
        case 'dollars_reconciled':
          metrics.dollarsReconciled = quantity;
          break;
        case 'errors_prevented':
          metrics.errorsPrevented = count;
          break;
      }
    }

    return metrics;
  } catch (error) {
    console.error('[getValueMetrics] Failed to get value metrics:', error);
    // Return zero metrics on error
    return {
      reconciliationsCompleted: 0,
      receiptsProcessed: 0,
      exportsGenerated: 0,
      exceptionsResolved: 0,
      timeSavedHours: 0,
      dollarsReconciled: 0,
      errorsPrevented: 0,
      period,
    };
  }
}

/**
 * Record reconciliation completed
 * Call this after a reconciliation run completes successfully
 */
export async function recordReconciliationCompleted(
  billingAccountId: string,
  options: {
    tenantId?: string;
    userId?: string;
    matchedCount: number;
    unmatchedCount: number;
    totalAmount?: number;
    jobId?: string;
    runId?: string;
  }
): Promise<void> {
  await recordValueEvent({
    billingAccountId,
    tenantId: options.tenantId,
    userId: options.userId,
    eventType: 'reconciliation_completed',
    quantity: 1,
    unit: 'reconciliation',
    metadata: {
      matchedCount: options.matchedCount,
      unmatchedCount: options.unmatchedCount,
      totalAmount: options.totalAmount,
      jobId: options.jobId,
      runId: options.runId,
    },
  });

  // Estimate time saved: 5 minutes per reconciliation (conservative)
  const timeSavedHours = (options.matchedCount + options.unmatchedCount) * (5 / 60);
  if (timeSavedHours > 0) {
    await recordValueEvent({
      billingAccountId,
      tenantId: options.tenantId,
      userId: options.userId,
      eventType: 'time_saved_hours',
      quantity: timeSavedHours,
      unit: 'hour',
      metadata: {
        source: 'reconciliation_completed',
        jobId: options.jobId,
        runId: options.runId,
      },
    });
  }

  // Record dollars reconciled if amount provided
  if (options.totalAmount && options.totalAmount > 0) {
    await recordValueEvent({
      billingAccountId,
      tenantId: options.tenantId,
      userId: options.userId,
      eventType: 'dollars_reconciled',
      quantity: options.totalAmount,
      unit: 'dollar',
      metadata: {
        jobId: options.jobId,
        runId: options.runId,
      },
    });
  }
}

/**
 * Record receipt processed
 * Call this after a receipt is successfully parsed
 */
export async function recordReceiptProcessed(
  billingAccountId: string,
  options: {
    tenantId?: string;
    userId?: string;
    receiptId: string;
    totalAmount?: number;
  }
): Promise<void> {
  await recordValueEvent({
    billingAccountId,
    tenantId: options.tenantId,
    userId: options.userId,
    eventType: 'receipt_processed',
    quantity: 1,
    unit: 'receipt',
    metadata: {
      receiptId: options.receiptId,
      totalAmount: options.totalAmount,
    },
  });

  // Estimate time saved: 2 minutes per receipt
  await recordValueEvent({
    billingAccountId,
    tenantId: options.tenantId,
    userId: options.userId,
    eventType: 'time_saved_hours',
    quantity: 2 / 60, // 2 minutes = 0.033 hours
    unit: 'hour',
    metadata: {
      source: 'receipt_processed',
      receiptId: options.receiptId,
    },
  });
}

/**
 * Record export generated
 * Call this after an export is successfully created
 */
export async function recordExportGenerated(
  billingAccountId: string,
  options: {
    tenantId?: string;
    userId?: string;
    exportId: string;
    rowCount?: number;
  }
): Promise<void> {
  await recordValueEvent({
    billingAccountId,
    tenantId: options.tenantId,
    userId: options.userId,
    eventType: 'export_generated',
    quantity: 1,
    unit: 'export',
    metadata: {
      exportId: options.exportId,
      rowCount: options.rowCount,
    },
  });
}
