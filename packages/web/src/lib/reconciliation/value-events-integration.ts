/**
 * Value Events Integration for Reconciliation
 * 
 * Records value events when reconciliation completes.
 * Should be called from reconciliation completion handlers.
 */

import { recordReconciliationCompleted } from '@/lib/value-ledger';
import { prisma } from '@/shared/db/prismaClient';

/**
 * Record value events when reconciliation completes
 * Call this after reconciliation status changes to 'completed'
 */
export async function recordReconciliationValueEvents(
  reconciliationRunId: string,
  options: {
    tenantId: string;
    userId?: string;
    matchedCount: number;
    unmatchedCount: number;
    totalAmount?: number;
  }
): Promise<void> {
  try {
    // Get billing account ID from tenant
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        tenantId: options.tenantId,
        status: 'active',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!billingAccount) {
      // No billing account - skip value recording (free tier or not set up)
      return;
    }

    // Record reconciliation completed
    await recordReconciliationCompleted(billingAccount.id, {
      tenantId: options.tenantId,
      userId: options.userId,
      matchedCount: options.matchedCount,
      unmatchedCount: options.unmatchedCount,
      totalAmount: options.totalAmount,
      runId: reconciliationRunId,
    });

    // Record anomalies detected (unmatched transactions)
    if (options.unmatchedCount > 0) {
      const { recordValueEvent } = await import('@/lib/value-ledger');
      await recordValueEvent({
        billingAccountId: billingAccount.id,
        tenantId: options.tenantId,
        userId: options.userId,
        eventType: 'errors_prevented',
        quantity: options.unmatchedCount,
        unit: 'anomaly',
        metadata: {
          source: 'reconciliation_completed',
          runId: reconciliationRunId,
          matchedCount: options.matchedCount,
        },
      });
    }
  } catch (_error) {
    // Log but don't throw - value tracking should never break reconciliation
    console.error('[recordReconciliationValueEvents] Failed to record value events:', error);
  }
}
