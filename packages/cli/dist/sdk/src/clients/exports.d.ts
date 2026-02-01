import { SettlerClient } from "../client";
export interface ExportDateRange {
    start: string;
    end: string;
}
export interface ExportOptions {
    includeFees?: boolean;
    includeUnmatched?: boolean;
    includeRawPayloads?: boolean;
    columns?: string[];
    glAccountMapping?: Record<string, string>;
}
export interface CreateExportRequest {
    jobId: string;
    format: "quickbooks" | "csv" | "json";
    dateRange: ExportDateRange;
    options?: ExportOptions;
}
export interface ExportSummary {
    totalMatches: number;
    totalUnmatched: number;
    totalFees: number;
}
export interface ExportResult {
    exportDate: string;
    dateRange: ExportDateRange;
    summary: ExportSummary;
    matches: Record<string, unknown>[];
}
/**
 * Client for data export operations.
 */
export declare class ExportsClient {
    private readonly client;
    constructor(client: SettlerClient);
    /**
     * Create an export of reconciled data.
     *
     * For CSV format the response is a raw string.
     * For JSON/QuickBooks the response is an ExportResult object.
     */
    create(request: CreateExportRequest): Promise<ExportResult | string>;
}
//# sourceMappingURL=exports.d.ts.map