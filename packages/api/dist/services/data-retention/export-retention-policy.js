"use strict";
/**
 * Export Retention Policy
 *
 * Creates switching friction by limiting export availability.
 * Exports expire after a set period, requiring users to stay on platform
 * to maintain access to their data.
 *
 * PHASE: Data Moat Reinforcement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRetentionPolicy = exports.ExportRetentionPolicy = void 0;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const DEFAULT_CONFIG = {
    defaultRetentionDays: 30,
    enterpriseRetentionDays: 90,
    cancellationRetentionDays: 7,
};
/**
 * Export Retention Policy Service
 */
class ExportRetentionPolicy {
    config;
    constructor(config = DEFAULT_CONFIG) {
        this.config = config;
    }
    /**
     * Get retention period for tenant
     */
    async getRetentionPeriod(tenantId) {
        try {
            // Check if tenant is enterprise
            const tenantResult = await (0, db_1.query)(`SELECT t.id, ba.id as billing_account_id
        FROM tenants t
        LEFT JOIN billing_accounts ba ON ba.tenant_id = t.id
        WHERE t.id = $1`, [tenantId]);
            if (tenantResult.length === 0) {
                return this.config.defaultRetentionDays;
            }
            // Check subscription plan
            const subscriptionResult = await (0, db_1.query)(`SELECT plan_id
        FROM subscriptions s
        JOIN billing_accounts ba ON ba.id = s.billing_account_id
        WHERE ba.tenant_id = $1
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1`, [tenantId]);
            if (subscriptionResult.length > 0) {
                const planId = subscriptionResult[0].plan_id;
                if (planId === "enterprise") {
                    return this.config.enterpriseRetentionDays;
                }
            }
            return this.config.defaultRetentionDays;
        }
        catch (error) {
            (0, logger_1.logError)("Failed to get retention period", error, { tenantId });
            return this.config.defaultRetentionDays;
        }
    }
    /**
     * Get retention period after cancellation
     */
    getCancellationRetentionPeriod() {
        return this.config.cancellationRetentionDays;
    }
    /**
     * Check if export has expired
     */
    async isExportExpired(exportId) {
        try {
            const exportResult = await (0, db_1.query)(`SELECT expires_at
        FROM exports
        WHERE id = $1`, [exportId]);
            if (exportResult.length === 0) {
                return true;
            }
            const expiresAt = exportResult[0].expires_at;
            return new Date() > new Date(expiresAt);
        }
        catch (error) {
            (0, logger_1.logError)("Failed to check export expiration", error, { exportId });
            return true; // Default to expired if check fails
        }
    }
    /**
     * Set export expiration based on retention policy
     */
    async setExportExpiration(exportId, tenantId, isCancellation = false) {
        try {
            const retentionDays = isCancellation
                ? this.getCancellationRetentionPeriod()
                : await this.getRetentionPeriod(tenantId);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + retentionDays);
            await (0, db_1.query)(`UPDATE exports
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2`, [expiresAt, exportId]);
            (0, logger_1.logInfo)("Set export expiration", {
                exportId,
                tenantId,
                retentionDays,
                expiresAt,
                isCancellation,
            });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to set export expiration", error, {
                exportId,
                tenantId,
            });
        }
    }
    /**
     * Clean up expired exports
     */
    async cleanupExpiredExports() {
        try {
            const result = await (0, db_1.query)(`DELETE FROM exports
        WHERE expires_at < NOW()
        AND status = 'completed'`, []);
            const deletedCount = result.rowCount || 0;
            (0, logger_1.logInfo)("Cleaned up expired exports", { deletedCount });
            return deletedCount;
        }
        catch (error) {
            (0, logger_1.logError)("Failed to cleanup expired exports", error);
            return 0;
        }
    }
    /**
     * Extend export expiration (for enterprise customers)
     */
    async extendExportExpiration(exportId, additionalDays) {
        try {
            const exportResult = await (0, db_1.query)(`SELECT expires_at
        FROM exports
        WHERE id = $1`, [exportId]);
            if (exportResult.length === 0) {
                throw new Error(`Export ${exportId} not found`);
            }
            const currentExpiresAt = new Date(exportResult[0].expires_at);
            const newExpiresAt = new Date(currentExpiresAt);
            newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);
            await (0, db_1.query)(`UPDATE exports
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2`, [newExpiresAt, exportId]);
            (0, logger_1.logInfo)("Extended export expiration", {
                exportId,
                additionalDays,
                newExpiresAt,
            });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to extend export expiration", error, { exportId });
            throw error;
        }
    }
}
exports.ExportRetentionPolicy = ExportRetentionPolicy;
exports.exportRetentionPolicy = new ExportRetentionPolicy();
//# sourceMappingURL=export-retention-policy.js.map