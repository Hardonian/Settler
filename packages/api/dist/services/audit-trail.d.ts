/**
 * Advanced Audit Trail Service
 * Handles enhanced audit logging, filtering, and compliance exports
 */
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
export declare function getAuditLogs(tenantId: string, filters?: AuditLogFilter, options?: {
    limit?: number;
    offset?: number;
}): Promise<Array<{
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
}>>;
/**
 * Create audit export
 */
export declare function createAuditExport(tenantId: string, exportedBy: string, filters: AuditLogFilter, exportFormat?: string, expiresInDays?: number): Promise<string>;
/**
 * Get audit export
 */
export declare function getAuditExport(tenantId: string, exportId: string): Promise<AuditExport | null>;
//# sourceMappingURL=audit-trail.d.ts.map