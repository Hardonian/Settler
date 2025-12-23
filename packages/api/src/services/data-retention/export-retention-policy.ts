/**
 * Export Retention Policy
 * 
 * Creates switching friction by limiting export availability.
 * Exports expire after a set period, requiring users to stay on platform
 * to maintain access to their data.
 * 
 * PHASE: Data Moat Reinforcement
 */

import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";

export interface ExportRetentionConfig {
  defaultRetentionDays: number; // Default: 30 days
  enterpriseRetentionDays: number; // Enterprise: 90 days
  cancellationRetentionDays: number; // After cancellation: 7 days
}

const DEFAULT_CONFIG: ExportRetentionConfig = {
  defaultRetentionDays: 30,
  enterpriseRetentionDays: 90,
  cancellationRetentionDays: 7,
};

/**
 * Export Retention Policy Service
 */
export class ExportRetentionPolicy {
  private config: ExportRetentionConfig;

  constructor(config: ExportRetentionConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Get retention period for tenant
   */
  async getRetentionPeriod(tenantId: string): Promise<number> {
    try {
      // Check if tenant is enterprise
      const tenantResult = await query(
        `SELECT t.id, ba.id as billing_account_id
        FROM tenants t
        LEFT JOIN billing_accounts ba ON ba.tenant_id = t.id
        WHERE t.id = $1`,
        [tenantId]
      );

      if (tenantResult.length === 0) {
        return this.config.defaultRetentionDays;
      }

      // Check subscription plan
      const subscriptionResult = await query(
        `SELECT plan_id
        FROM subscriptions s
        JOIN billing_accounts ba ON ba.id = s.billing_account_id
        WHERE ba.tenant_id = $1
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1`,
        [tenantId]
      );

      if (subscriptionResult.length > 0) {
        const planId = (subscriptionResult[0] as { plan_id: string }).plan_id;
        if (planId === "enterprise") {
          return this.config.enterpriseRetentionDays;
        }
      }

      return this.config.defaultRetentionDays;
    } catch (error) {
      logError("Failed to get retention period", error, { tenantId });
      return this.config.defaultRetentionDays;
    }
  }

  /**
   * Get retention period after cancellation
   */
  getCancellationRetentionPeriod(): number {
    return this.config.cancellationRetentionDays;
  }

  /**
   * Check if export has expired
   */
  async isExportExpired(exportId: string): Promise<boolean> {
    try {
      const exportResult = await query(
        `SELECT expires_at
        FROM exports
        WHERE id = $1`,
        [exportId]
      );

      if (exportResult.length === 0) {
        return true;
      }

      const expiresAt = (exportResult[0] as { expires_at: Date }).expires_at;
      return new Date() > new Date(expiresAt);
    } catch (error) {
      logError("Failed to check export expiration", error, { exportId });
      return true; // Default to expired if check fails
    }
  }

  /**
   * Set export expiration based on retention policy
   */
  async setExportExpiration(
    exportId: string,
    tenantId: string,
    isCancellation: boolean = false
  ): Promise<void> {
    try {
      const retentionDays = isCancellation
        ? this.getCancellationRetentionPeriod()
        : await this.getRetentionPeriod(tenantId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);

      await query(
        `UPDATE exports
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2`,
        [expiresAt, exportId]
      );

      logInfo("Set export expiration", {
        exportId,
        tenantId,
        retentionDays,
        expiresAt,
        isCancellation,
      });
    } catch (error) {
      logError("Failed to set export expiration", error, {
        exportId,
        tenantId,
      });
    }
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM exports
        WHERE expires_at < NOW()
        AND status = 'completed'`,
        []
      );

      const deletedCount = (result as any).rowCount || 0;

      logInfo("Cleaned up expired exports", { deletedCount });

      return deletedCount;
    } catch (error) {
      logError("Failed to cleanup expired exports", error);
      return 0;
    }
  }

  /**
   * Extend export expiration (for enterprise customers)
   */
  async extendExportExpiration(
    exportId: string,
    additionalDays: number
  ): Promise<void> {
    try {
      const exportResult = await query(
        `SELECT expires_at
        FROM exports
        WHERE id = $1`,
        [exportId]
      );

      if (exportResult.length === 0) {
        throw new Error(`Export ${exportId} not found`);
      }

      const currentExpiresAt = new Date(
        (exportResult[0] as { expires_at: Date }).expires_at
      );
      const newExpiresAt = new Date(currentExpiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

      await query(
        `UPDATE exports
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2`,
        [newExpiresAt, exportId]
      );

      logInfo("Extended export expiration", {
        exportId,
        additionalDays,
        newExpiresAt,
      });
    } catch (error) {
      logError("Failed to extend export expiration", error, { exportId });
      throw error;
    }
  }
}

export const exportRetentionPolicy = new ExportRetentionPolicy();
