/**
 * Export Service
 * Handles CSV and JSON exports with signed URLs and metadata storage
 */
export type ExportType = "csv" | "json";
export type ExportFormat = "matched" | "unmatched" | "all" | "reconciliation_report";
export interface ExportOptions {
    type: ExportType;
    format: ExportFormat;
    reconciliationRunId?: string;
    ingestionId?: string;
    tenantId: string;
    userId: string;
    traceId?: string;
}
/**
 * Create export record
 */
export declare function createExport(options: ExportOptions): Promise<string>;
/**
 * Generate export file
 */
export declare function generateExport(exportId: string): Promise<{
    filePath: string;
    fileSize: number;
    signedUrl: string;
    expiresAt: Date;
}>;
//# sourceMappingURL=export-service.d.ts.map