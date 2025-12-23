"use strict";
/**
 * Advanced Audit Trail Service
 * Handles enhanced audit logging, filtering, and compliance exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = getAuditLogs;
exports.createAuditExport = createAuditExport;
exports.getAuditExport = getAuditExport;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Get audit logs with filtering
 */
async function getAuditLogs(tenantId, filters = {}, options = {}) {
    try {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        // Note: audit_log is in app_private schema, so we need to handle tenant filtering differently
        // This is a simplified version - actual implementation would need proper RLS or tenant context
        if (filters.actor) {
            conditions.push(`actor = $${paramIndex}`);
            params.push(filters.actor);
            paramIndex++;
        }
        if (filters.action) {
            conditions.push(`action = $${paramIndex}`);
            params.push(filters.action);
            paramIndex++;
        }
        if (filters.schemaName) {
            conditions.push(`schema_name = $${paramIndex}`);
            params.push(filters.schemaName);
            paramIndex++;
        }
        if (filters.tableName) {
            conditions.push(`table_name = $${paramIndex}`);
            params.push(filters.tableName);
            paramIndex++;
        }
        if (filters.startDate) {
            conditions.push(`at >= $${paramIndex}`);
            params.push(filters.startDate);
            paramIndex++;
        }
        if (filters.endDate) {
            conditions.push(`at <= $${paramIndex}`);
            params.push(filters.endDate);
            paramIndex++;
        }
        if (filters.complianceTags && filters.complianceTags.length > 0) {
            conditions.push(`compliance_tags && $${paramIndex}`);
            params.push(filters.complianceTags);
            paramIndex++;
        }
        const limit = options.limit || 100;
        const offset = options.offset || 0;
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const result = await (0, db_1.query)(`SELECT id, at, actor, action, schema_name, table_name, row_pk, details,
              ip_address, user_agent, compliance_tags
       FROM app_private.audit_log
       ${whereClause}
       ORDER BY at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        return result.map((row) => ({
            id: row.id,
            at: row.at,
            actor: row.actor,
            action: row.action,
            schemaName: row.schema_name,
            tableName: row.table_name,
            rowPk: row.row_pk,
            details: row.details,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            complianceTags: row.compliance_tags,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get audit logs", error, { tenantId });
        throw error;
    }
}
/**
 * Create audit export
 */
async function createAuditExport(tenantId, exportedBy, filters, exportFormat = "csv", expiresInDays = 7) {
    try {
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
        const result = await (0, db_1.query)(`INSERT INTO audit_exports (
        tenant_id, exported_by, export_format, filters, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`, [tenantId, exportedBy, exportFormat, JSON.stringify(filters), expiresAt]);
        const exportId = result[0]?.id || '';
        // TODO: Generate actual export file (CSV, JSON, etc.)
        // For now, just log it
        (0, logger_1.logInfo)("Audit export created", {
            exportId,
            tenantId,
            exportedBy,
            exportFormat,
        });
        return exportId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create audit export", error, { tenantId, exportedBy });
        throw error;
    }
}
/**
 * Get audit export
 */
async function getAuditExport(tenantId, exportId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, export_format, filters, file_path, expires_at, created_at
       FROM audit_exports
       WHERE id = $1 AND tenant_id = $2`, [exportId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            exportFormat: row.export_format,
            filters: row.filters,
            filePath: row.file_path,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get audit export", error, { exportId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=audit-trail.js.map