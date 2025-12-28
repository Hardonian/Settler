/**
 * Lossy Export Service
 *
 * Makes exports explicitly lossy by excluding derived artifacts, confidence scores,
 * and longitudinal insights. This creates switching friction by making exports incomplete.
 *
 * PHASE: Data Moat Reinforcement
 *
 * Based on narrative compression requirements:
 * - Exports should exclude derived artifacts
 * - Exports should exclude longitudinal insights
 * - Exports should exclude confidence scores
 * - This creates switching friction (customers lose value when exporting)
 */
export interface ExportOptions {
    includeDerivedArtifacts?: boolean;
    includeConfidenceScores?: boolean;
    includeLongitudinalInsights?: boolean;
    includeHistoricalMatches?: boolean;
    includeAuditTrail?: boolean;
}
export interface LossyExportResult {
    exportId: string;
    rowCount: number;
    excludedFields: string[];
    warning: string;
}
/**
 * Lossy Export Service
 *
 * Creates exports that exclude proprietary data to create switching friction
 */
export declare class LossyExportService {
    /**
     * Create a lossy export of reconciliation data
     *
     * Excludes:
     * - Derived artifacts (pattern insights, rule optimizations)
     * - Confidence scores (proprietary matching intelligence)
     * - Longitudinal insights (historical patterns, trends)
     * - Cross-customer intelligence (aggregated patterns)
     */
    createLossyExport(tenantId: string, userId: string, reconciliationRunId: string, options?: ExportOptions): Promise<LossyExportResult>;
    /**
     * Generate warning message about lossy export
     */
    private generateWarning;
    /**
     * Check if export is lossy
     */
    isLossyExport(exportId: string): Promise<boolean>;
    /**
     * Get excluded fields for export
     */
    getExcludedFields(exportId: string): Promise<string[]>;
}
export declare const lossyExportService: LossyExportService;
//# sourceMappingURL=lossy-exports.d.ts.map