"use strict";
/**
 * Custom Integrations Service
 * Handles custom adapter development and white-label configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomIntegration = createCustomIntegration;
exports.getCustomIntegration = getCustomIntegration;
exports.listCustomIntegrations = listCustomIntegrations;
exports.updateCustomIntegration = updateCustomIntegration;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Create custom integration
 */
async function createCustomIntegration(tenantId, integrationName, integrationType, adapterConfig, whiteLabelConfig) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO custom_integrations (
        tenant_id, integration_name, integration_type,
        adapter_config, white_label_config, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id`, [
            tenantId,
            integrationName,
            integrationType,
            JSON.stringify(adapterConfig),
            whiteLabelConfig ? JSON.stringify(whiteLabelConfig) : null,
        ]);
        const integrationId = result[0]?.id || '';
        (0, logger_1.logInfo)("Custom integration created", {
            integrationId,
            tenantId,
            integrationName,
            integrationType,
        });
        return integrationId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create custom integration", error, { tenantId, integrationName });
        throw error;
    }
}
/**
 * Get custom integration
 */
async function getCustomIntegration(tenantId, integrationId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, tenant_id, integration_name, integration_type,
              adapter_config, white_label_config, is_active
       FROM custom_integrations
       WHERE id = $1 AND tenant_id = $2`, [integrationId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            tenantId: row.tenant_id,
            integrationName: row.integration_name,
            integrationType: row.integration_type,
            adapterConfig: row.adapter_config,
            isActive: row.is_active,
            whiteLabelConfig: row.white_label_config || undefined,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get custom integration", error, { integrationId, tenantId });
        throw error;
    }
}
/**
 * List custom integrations
 */
async function listCustomIntegrations(tenantId, filters = {}) {
    try {
        const conditions = ["tenant_id = $1"];
        const params = [tenantId];
        let paramIndex = 2;
        if (filters.isActive !== undefined) {
            conditions.push(`is_active = $${paramIndex}`);
            params.push(filters.isActive);
            paramIndex++;
        }
        if (filters.integrationType) {
            conditions.push(`integration_type = $${paramIndex}`);
            params.push(filters.integrationType);
            paramIndex++;
        }
        const result = await (0, db_1.query)(`SELECT id, tenant_id, integration_name, integration_type,
              adapter_config, white_label_config, is_active
       FROM custom_integrations
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`, params);
        return result.map((row) => ({
            id: row.id,
            tenantId: row.tenant_id,
            integrationName: row.integration_name,
            integrationType: row.integration_type,
            adapterConfig: row.adapter_config,
            isActive: row.is_active,
            whiteLabelConfig: row.white_label_config,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list custom integrations", error, { tenantId });
        throw error;
    }
}
/**
 * Update custom integration
 */
async function updateCustomIntegration(tenantId, integrationId, updates) {
    try {
        const updateFields = [];
        const params = [];
        let paramIndex = 1;
        if (updates.adapterConfig !== undefined) {
            updateFields.push(`adapter_config = $${paramIndex}`);
            params.push(JSON.stringify(updates.adapterConfig));
            paramIndex++;
        }
        if (updates.whiteLabelConfig !== undefined) {
            updateFields.push(`white_label_config = $${paramIndex}`);
            params.push(JSON.stringify(updates.whiteLabelConfig));
            paramIndex++;
        }
        if (updates.isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex}`);
            params.push(updates.isActive);
            paramIndex++;
        }
        if (updateFields.length === 0) {
            return;
        }
        updateFields.push(`updated_at = now()`);
        params.push(tenantId, integrationId);
        await (0, db_1.query)(`UPDATE custom_integrations
       SET ${updateFields.join(", ")}
       WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}`, params);
        (0, logger_1.logInfo)("Custom integration updated", { integrationId, tenantId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update custom integration", error, { integrationId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=custom-integrations.js.map