/**
 * Export Retention Policy Service
 * 
 * Creates switching friction by limiting export availability after cancellation.
 * Exports are only available for a limited time after account cancellation.
 * 
 * PHASE: Workflow Lock-In Reinforcement
 * 
 * Based on narrative compression requirements:
 * - Export available for 30 days after cancellation (creates switching friction)
 * - After 30 days, exports are deleted (customers lose access to historical data)
 * - This makes switching more expensive (customers must export before canceling)
 */

import { logError, logInfo } from '../../utils/logger';
import { query } from '../../db';

export interface ExportRetentionPolicy {
  tier: string;
  activeAccountDays: number; // Days exports are available for active accounts (unlimited)
  cancelledAccountDays: number; // Days exports are available after cancellation
}

const RETENTION_POLICIES: Record<string, ExportRetentionPolicy> = {
  free: {
    tier: 'free',
    activeAccountDays: 7, // 7 days for free tier
    cancelledAccountDays: 7, // 7 days after cancellation
  },
  starter: {
    tier: 'starter',
    activeAccountDays: 30, // 30 days for starter tier
    cancelledAccountDays: 30, // 30 days after cancellation
  },
  growth: {
    tier: 'growth',
    activeAccountDays: 90, // 90 days for growth tier
    cancelledAccountDays: 30, // 30 days after cancellation (creates switching friction)
  },
  scale: {
    tier: 'scale',
    activeAccountDays: 365, // 1 year for scale tier
    cancelledAccountDays: 30, // 30 days after cancellation
  },
  enterprise: {
    tier: 'enterprise',
    activeAccountDays: 2555, // 7 years for enterprise tier
    cancelledAccountDays: 90, // 90 days after cancellation (longer for enterprise)
  },
};

/**
 * Export Retention Policy Service
 * 
 * Manages export availability and deletion based on account status
 */
export class ExportRetentionPolicyService {
  /**
   * Get retention policy for tier
   */
  getRetentionPolicy(tierId: string): ExportRetentionPolicy {
    const tierMap: Record<string, string> = {
      base: 'starter',
      pro: 'growth',
    };

    const mappedTier = tierMap[tierId] || tierId;
    const policy = RETENTION_POLICIES[mappedTier];
    return policy ?? RETENTION_POLICIES['free']!;
  }

  /**
   * Check if export is still available
   * 
   * Returns true if export is available, false if it should be deleted
   */
  async isExportAvailable(
    exportId: string,
    tenantId: string
  ): Promise<{ available: boolean; expiresAt?: Date; reason?: string }> {
    try {
      // Get export
      const exportResult = await query(
        `SELECT 
          e.id, e.created_at, e.metadata,
          ba.status as account_status, ba.cancelled_at,
          s.plan_id
        FROM exports e
        JOIN billing_accounts ba ON ba.tenant_id = e.tenant_id
        LEFT JOIN subscriptions s ON s.billing_account_id = ba.id AND s.status = 'active'
        WHERE e.id = $1 AND e.tenant_id = $2`,
        [exportId, tenantId]
      );

      if (exportResult.length === 0) {
        return { available: false, reason: 'Export not found' };
      }

      const exportData = exportResult[0] as {
        id: string;
        created_at: Date;
        metadata: string;
        account_status: string;
        cancelled_at: Date | null;
        plan_id: string | null;
      };

      const policy = this.getRetentionPolicy(exportData.plan_id || 'free');
      const createdAt = new Date(exportData.created_at);
      const now = new Date();

      // Check if account is cancelled
      if (exportData.account_status === 'cancelled' && exportData.cancelled_at) {
        const cancelledAt = new Date(exportData.cancelled_at);
        const daysSinceCancellation = Math.floor(
          (now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCancellation > policy.cancelledAccountDays) {
          return {
            available: false,
            expiresAt: new Date(
              cancelledAt.getTime() + policy.cancelledAccountDays * 24 * 60 * 60 * 1000
            ),
            reason: `Export expired ${daysSinceCancellation - policy.cancelledAccountDays} days after account cancellation`,
          };
        }

        const expiresAt = new Date(
          cancelledAt.getTime() + policy.cancelledAccountDays * 24 * 60 * 60 * 1000
        );

        return {
          available: true,
          expiresAt,
          reason: `Export expires ${policy.cancelledAccountDays} days after cancellation`,
        };
      }

      // Active account - check tier-based retention
      const daysSinceCreation = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > policy.activeAccountDays) {
        return {
          available: false,
          expiresAt: new Date(
            createdAt.getTime() + policy.activeAccountDays * 24 * 60 * 60 * 1000
          ),
          reason: `Export expired after ${policy.activeAccountDays} days`,
        };
      }

      const expiresAt = new Date(
        createdAt.getTime() + policy.activeAccountDays * 24 * 60 * 60 * 1000
      );

      return {
        available: true,
        expiresAt,
        reason: `Export expires after ${policy.activeAccountDays} days`,
      };
    } catch (error) {
      logError('Failed to check export availability', error, { exportId, tenantId });
      return { available: false, reason: 'Error checking availability' };
    }
  }

  /**
   * Delete expired exports
   * 
   * Should be run as a scheduled job (daily)
   */
  async deleteExpiredExports(): Promise<{
    deleted: number;
    errors: number;
  }> {
    let deleted = 0;
    let errors = 0;

    try {
      // Get all exports
      const exportsResult = await query(
        `SELECT 
          e.id, e.tenant_id, e.created_at,
          ba.status as account_status, ba.cancelled_at,
          s.plan_id
        FROM exports e
        JOIN billing_accounts ba ON ba.tenant_id = e.tenant_id
        LEFT JOIN subscriptions s ON s.billing_account_id = ba.id AND s.status = 'active'
        WHERE e.status != 'deleted'`,
        []
      );

      for (const exportData of exportsResult as Array<{
        id: string;
        tenant_id: string;
        created_at: Date;
        account_status: string;
        cancelled_at: Date | null;
        plan_id: string | null;
      }>) {
        try {
          const availability = await this.isExportAvailable(
            exportData.id,
            exportData.tenant_id
          );

          if (!availability.available) {
            // Delete export (set status to deleted)
            await query(
              `UPDATE exports
              SET status = 'deleted'
              WHERE id = $1`,
              [exportData.id]
            );

            logInfo('Deleted expired export', {
              exportId: exportData.id,
              tenantId: exportData.tenant_id,
              reason: availability.reason,
            });

            deleted++;
          }
        } catch (error) {
          logError('Failed to delete expired export', error, {
            exportId: exportData.id,
            tenantId: exportData.tenant_id,
          });
          errors++;
        }
      }

      logInfo('Completed export retention cleanup', {
        deleted,
        errors,
        totalChecked: exportsResult.length,
      });

      return { deleted, errors };
    } catch (error) {
      logError('Failed to delete expired exports', error);
      return { deleted, errors: errors + 1 };
    }
  }

  /**
   * Get export expiration warning for tenant
   * 
   * Warns tenants about export expiration after cancellation
   */
  async getExpirationWarning(tenantId: string): Promise<string | null> {
    try {
      const accountResult = await query(
        `SELECT 
          ba.status, ba.cancelled_at,
          s.plan_id
        FROM billing_accounts ba
        LEFT JOIN subscriptions s ON s.billing_account_id = ba.id AND s.status = 'active'
        WHERE ba.tenant_id = $1`,
        [tenantId]
      );

      if (accountResult.length === 0) {
        return null;
      }

      const account = accountResult[0] as {
        status: string;
        cancelled_at: Date | null;
        plan_id: string | null;
      };

      if (account.status === 'cancelled' && account.cancelled_at) {
        const policy = this.getRetentionPolicy(account.plan_id || 'free');
        const cancelledAt = new Date(account.cancelled_at);
        const now = new Date();
        const daysSinceCancellation = Math.floor(
          (now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysRemaining = policy.cancelledAccountDays - daysSinceCancellation;

        if (daysRemaining > 0) {
          return `Your account has been cancelled. Exports will be deleted in ${daysRemaining} days. ` +
            `Please download any exports you need before they expire.`;
        } else {
          return `Your account has been cancelled. Exports have been deleted. ` +
            `To access historical data, please reactivate your account.`;
        }
      }

      return null;
    } catch (error) {
      logError('Failed to get expiration warning', error, { tenantId });
      return null;
    }
  }
}

export const exportRetentionPolicyService = new ExportRetentionPolicyService();
