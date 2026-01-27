"use strict";
/**
 * Feature Flag Service
 * Per-tenant and per-user feature flags with A/B testing and kill switches
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagService = void 0;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
class FeatureFlagService {
    /**
     * Check if a feature is enabled for tenant/user
     */
    async isEnabled(flagName, tenantId, userId) {
        // 1. Check user-specific flag
        if (userId) {
            const userFlag = await this.getFlag(flagName, tenantId, userId);
            if (userFlag) {
                return userFlag.enabled;
            }
        }
        // 2. Check tenant-specific flag
        const tenantFlag = await this.getFlag(flagName, tenantId);
        if (tenantFlag) {
            // Check rollout percentage for A/B testing
            if (tenantFlag.rolloutPercentage < 100) {
                const hash = this.hashString(`${tenantId}:${userId || ''}:${flagName}`);
                const percentage = (hash % 100) + 1;
                return percentage <= tenantFlag.rolloutPercentage;
            }
            return tenantFlag.enabled;
        }
        // 3. Check global flag
        const globalFlag = await this.getFlag(flagName);
        if (globalFlag) {
            if (globalFlag.rolloutPercentage < 100) {
                const hash = this.hashString(`${tenantId}:${userId || ''}:${flagName}`);
                const percentage = (hash % 100) + 1;
                return percentage <= globalFlag.rolloutPercentage;
            }
            return globalFlag.enabled;
        }
        return false;
    }
    /**
     * Get feature flag
     */
    async getFlag(flagName, tenantId, userId) {
        let sql = `
      SELECT id, name, description, enabled, rollout_percentage as "rolloutPercentage",
             tenant_id as "tenantId", user_id as "userId", conditions, created_at as "createdAt", updated_at as "updatedAt"
      FROM feature_flags
      WHERE name = $1 AND deleted_at IS NULL
    `;
        const params = [flagName];
        if (userId && tenantId) {
            sql += ` AND ((tenant_id = $2 AND user_id = $3) OR (tenant_id = $2 AND user_id IS NULL) OR (tenant_id IS NULL AND user_id IS NULL))`;
            params.push(tenantId, userId);
        }
        else if (tenantId) {
            sql += ` AND ((tenant_id = $2) OR (tenant_id IS NULL))`;
            params.push(tenantId);
        }
        else {
            sql += ` AND tenant_id IS NULL AND user_id IS NULL`;
        }
        sql += ` ORDER BY user_id DESC NULLS LAST, tenant_id DESC NULLS LAST LIMIT 1`;
        const rows = await (0, db_1.query)(sql, params);
        return rows.length > 0 && rows[0] ? rows[0] : null;
    }
    /**
     * Create or update feature flag
     */
    async setFlag(flagName, enabled, options) {
        const existing = await this.getFlag(flagName, options.tenantId, options.userId);
        if (existing) {
            // Update existing flag
            const oldValue = { enabled: existing.enabled, rolloutPercentage: existing.rolloutPercentage };
            const newValue = { enabled, rolloutPercentage: options.rolloutPercentage || 100 };
            await (0, db_1.query)(`UPDATE feature_flags
         SET enabled = $1, rollout_percentage = $2, description = $3, conditions = $4, updated_at = NOW()
         WHERE id = $5`, [
                enabled,
                options.rolloutPercentage || 100,
                options.description ?? existing.description ?? null,
                JSON.stringify(options.conditions || {}),
                existing.id,
            ]);
            // Log change
            await (0, db_1.query)(`INSERT INTO feature_flag_changes (feature_flag_id, changed_by, old_value, new_value, reason)
         VALUES ($1, $2, $3, $4, $5)`, [
                existing.id,
                options.changedBy || null,
                JSON.stringify(oldValue),
                JSON.stringify(newValue),
                options.reason || null,
            ]);
            (0, logger_1.logInfo)('Feature flag updated', {
                flagName,
                tenantId: options.tenantId,
                userId: options.userId,
                enabled,
                changedBy: options.changedBy,
            });
            return (await this.getFlag(flagName, options.tenantId, options.userId));
        }
        else {
            // Create new flag
            const id = crypto.randomUUID();
            await (0, db_1.query)(`INSERT INTO feature_flags (id, name, description, enabled, rollout_percentage, tenant_id, user_id, conditions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                id,
                flagName,
                options.description || null,
                enabled,
                options.rolloutPercentage || 100,
                options.tenantId || null,
                options.userId || null,
                JSON.stringify(options.conditions || {}),
            ]);
            // Log change
            await (0, db_1.query)(`INSERT INTO feature_flag_changes (feature_flag_id, changed_by, old_value, new_value, reason)
         VALUES ($1, $2, $3, $4, $5)`, [
                id,
                options.changedBy || null,
                JSON.stringify({ enabled: false }),
                JSON.stringify({ enabled, rolloutPercentage: options.rolloutPercentage || 100 }),
                options.reason || 'Flag created',
            ]);
            (0, logger_1.logInfo)('Feature flag created', {
                flagName,
                tenantId: options.tenantId,
                userId: options.userId,
                enabled,
                changedBy: options.changedBy,
            });
            return (await this.getFlag(flagName, options.tenantId, options.userId));
        }
    }
    /**
     * Kill switch: immediately disable a feature for all tenants/users
     */
    async killSwitch(flagName, reason, changedBy) {
        await (0, db_1.query)(`UPDATE feature_flags
       SET enabled = false, updated_at = NOW()
       WHERE name = $1 AND deleted_at IS NULL`, [flagName]);
        // Log kill switch
        await (0, db_1.query)(`INSERT INTO feature_flag_changes (
        SELECT id, $1, '{}', '{"enabled": false, "killSwitch": true}', $2
        FROM feature_flags WHERE name = $3 AND deleted_at IS NULL
      )`, [changedBy || null, reason, flagName]);
        (0, logger_1.logWarn)('Kill switch activated', { flagName, reason, changedBy });
    }
    /**
     * Get all flags for a tenant
     */
    async getTenantFlags(tenantId) {
        const rows = await (0, db_1.query)(`SELECT id, name, description, enabled, rollout_percentage as "rolloutPercentage",
              tenant_id as "tenantId", user_id as "userId", conditions, created_at as "createdAt", updated_at as "updatedAt"
       FROM feature_flags
       WHERE (tenant_id = $1 OR tenant_id IS NULL) AND user_id IS NULL AND deleted_at IS NULL
       ORDER BY name`, [tenantId]);
        return rows;
    }
    /**
     * Hash string to number (for consistent A/B testing)
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
exports.FeatureFlagService = FeatureFlagService;
//# sourceMappingURL=FeatureFlagService.js.map