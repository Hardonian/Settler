"use strict";
/**
 * Dedicated Infrastructure Service
 * Handles dedicated infrastructure provisioning and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionDedicatedInfrastructure = provisionDedicatedInfrastructure;
exports.getDedicatedInfrastructure = getDedicatedInfrastructure;
exports.listDedicatedInfrastructure = listDedicatedInfrastructure;
exports.deprovisionDedicatedInfrastructure = deprovisionDedicatedInfrastructure;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Provision dedicated infrastructure
 */
async function provisionDedicatedInfrastructure(tenantId, infrastructureType, resourceConfig, options = {}) {
    try {
        const defaultSecurityConfig = {
            encryptionAtRest: true,
            encryptionInTransit: true,
            mfaRequired: true,
        };
        const result = await (0, db_1.query)(`INSERT INTO dedicated_infrastructure (
        tenant_id, infrastructure_type, resource_config,
        isolation_level, data_retention_days, security_config,
        is_active, provisioned_at
      ) VALUES ($1, $2, $3, $4, $5, $6, true, now())
      RETURNING id`, [
            tenantId,
            infrastructureType,
            JSON.stringify(resourceConfig),
            options.isolationLevel || "standard",
            options.dataRetentionDays || null,
            JSON.stringify({ ...defaultSecurityConfig, ...options.securityConfig }),
        ]);
        const infrastructureId = result[0]?.id || '';
        (0, logger_1.logInfo)("Dedicated infrastructure provisioned", {
            infrastructureId,
            tenantId,
            infrastructureType,
            isolationLevel: options.isolationLevel || "standard",
        });
        // TODO: Actual infrastructure provisioning logic would go here
        // This would integrate with cloud providers (AWS, GCP, Azure)
        return infrastructureId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to provision dedicated infrastructure", error, {
            tenantId,
            infrastructureType,
        });
        throw error;
    }
}
/**
 * Get dedicated infrastructure
 */
async function getDedicatedInfrastructure(tenantId, infrastructureId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, tenant_id, infrastructure_type, resource_config,
              isolation_level, data_retention_days, security_config, is_active
       FROM dedicated_infrastructure
       WHERE id = $1 AND tenant_id = $2`, [infrastructureId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            tenantId: row.tenant_id,
            infrastructureType: row.infrastructure_type,
            resourceConfig: row.resource_config,
            isolationLevel: row.isolation_level,
            dataRetentionDays: row.data_retention_days || undefined,
            securityConfig: row.security_config,
            isActive: row.is_active,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get dedicated infrastructure", error, { infrastructureId, tenantId });
        throw error;
    }
}
/**
 * List dedicated infrastructure
 */
async function listDedicatedInfrastructure(tenantId, filters = {}) {
    try {
        const conditions = ["tenant_id = $1"];
        const params = [tenantId];
        let paramIndex = 2;
        if (filters.isActive !== undefined) {
            conditions.push(`is_active = $${paramIndex}`);
            params.push(filters.isActive);
            paramIndex++;
        }
        if (filters.infrastructureType) {
            conditions.push(`infrastructure_type = $${paramIndex}`);
            params.push(filters.infrastructureType);
            paramIndex++;
        }
        const result = await (0, db_1.query)(`SELECT id, tenant_id, infrastructure_type, resource_config,
              isolation_level, data_retention_days, security_config, is_active
       FROM dedicated_infrastructure
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`, params);
        return result.map((row) => ({
            id: row.id,
            tenantId: row.tenant_id,
            infrastructureType: row.infrastructure_type,
            resourceConfig: row.resource_config,
            isolationLevel: row.isolation_level,
            dataRetentionDays: row.data_retention_days,
            securityConfig: row.security_config,
            isActive: row.is_active,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list dedicated infrastructure", error, { tenantId });
        throw error;
    }
}
/**
 * Deprovision dedicated infrastructure
 */
async function deprovisionDedicatedInfrastructure(tenantId, infrastructureId) {
    try {
        await (0, db_1.query)(`UPDATE dedicated_infrastructure
       SET is_active = false, deprovisioned_at = now()
       WHERE id = $1 AND tenant_id = $2`, [infrastructureId, tenantId]);
        (0, logger_1.logInfo)("Dedicated infrastructure deprovisioned", { infrastructureId, tenantId });
        // TODO: Actual infrastructure deprovisioning logic would go here
    }
    catch (error) {
        (0, logger_1.logError)("Failed to deprovision dedicated infrastructure", error, {
            infrastructureId,
            tenantId,
        });
        throw error;
    }
}
//# sourceMappingURL=dedicated-infrastructure.js.map