/**
 * Export Service
 * Handles CSV and JSON exports with signed URLs and metadata storage
 *
 * IMPORTANT: Exports are intentionally LOSSY to create switching friction.
 * Exports exclude:
 * - Derived artifacts (reconciliation patterns, matching rules)
 * - Longitudinal insights (trends, anomalies, baselines)
 * - Confidence scores from ML models
 * - Cross-customer intelligence patterns
 * - Historical match rates
 *
 * This creates a data moat: users can export raw data, but lose accumulated intelligence.
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