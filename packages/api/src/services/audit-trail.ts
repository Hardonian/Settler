/**
 * Advanced Audit Trail Service
 * Handles enhanced audit logging, filtering, and compliance exports
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

export interface AuditLogFilter {
  actor?: string;
  action?: string;
  schemaName?: string;
  tableName?: string;
  startDate?: Date;
  endDate?: Date;
  complianceTags?: string[];
}

export interface AuditExport {
  id: string;
  exportFormat: string;
  filters: AuditLogFilter;
  filePath?: string;
  expiresAt?: Date;
  createdAt: Date;
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  tenantId: string,
  filters: AuditLogFilter = {},
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<
  Array<{
    id: number;
    at: Date;
    actor?: string;
    action: string;
    schemaName: string;
    tableName: string;
    rowPk?: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    complianceTags?: string[];
  }>
> {
  try {
    if (!tenantId) throw new Error("tenantId is required for getAuditLogs");

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // INVARIANT: tenant_id is always the first filter — no cross-tenant audit log access
    conditions.push(`tenant_id = $${paramIndex}`);
    params.push(tenantId);
    paramIndex++;

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

    // conditions always has at least tenant_id — no unscoped queries possible
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const result = await query<Record<string, unknown>>(
      `SELECT id, at, actor, action, schema_name, table_name, row_pk, details,
              ip_address, user_agent, compliance_tags
       FROM app_private.audit_log
       ${whereClause}
       ORDER BY at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset] as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      id: row.id as number,
      at: row.at as Date,
      actor: row.actor as string | undefined,
      action: row.action as string,
      schemaName: row.schema_name as string,
      tableName: row.table_name as string,
      rowPk: row.row_pk as string | undefined,
      details: row.details as Record<string, unknown>,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      complianceTags: row.compliance_tags as string[] | undefined,
    }));
  } catch (error) {
    logError("Failed to get audit logs", error, { tenantId });
    throw error;
  }
}

/**
 * Create audit export
 */
export async function createAuditExport(
  tenantId: string,
  exportedBy: string,
  filters: AuditLogFilter,
  exportFormat: string = "csv",
  expiresInDays: number = 7
): Promise<string> {
  try {
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const result = await query<{ id: string }>(
      `INSERT INTO audit_exports (
        tenant_id, exported_by, export_format, filters, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [tenantId, exportedBy, exportFormat, JSON.stringify(filters), expiresAt] as (
        | string
        | number
        | boolean
        | null
        | Date
      )[]
    );

    const exportId = result[0]?.id || "";

    // Generate export file with proper format based on type
    // For now, just log it
    logInfo("Audit export created", {
      exportId,
      tenantId,
      exportedBy,
      exportFormat,
    });

    return exportId;
  } catch (error) {
    logError("Failed to create audit export", error, { tenantId, exportedBy });
    throw error;
  }
}

/**
 * Get audit export
 */
export async function getAuditExport(
  tenantId: string,
  exportId: string
): Promise<AuditExport | null> {
  try {
    const result = await query<{
      id: string;
      export_format: string;
      filters: AuditLogFilter;
      file_path?: string;
      expires_at?: Date;
      created_at: Date;
    }>(
      `SELECT id, export_format, filters, file_path, expires_at, created_at
       FROM audit_exports
       WHERE id = $1 AND tenant_id = $2`,
      [exportId, tenantId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;

    return {
      id: row.id,
      exportFormat: row.export_format,
      filters: row.filters,
      filePath: row.file_path,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  } catch (error) {
    logError("Failed to get audit export", error, { exportId, tenantId });
    throw error;
  }
}
