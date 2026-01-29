import { SettlerClient } from "../client";
import { ReconciliationReport, ApiResponse, ListResponse } from "../types";
import { PaginationOptions } from "../utils/pagination";
/**
 * Options for getting a reconciliation report
 */
export interface GetReportOptions {
    /** Start date for the report (ISO 8601 format) */
    startDate?: string;
    /** End date for the report (ISO 8601 format) */
    endDate?: string;
    /** Report format */
    format?: "json" | "csv";
}
/**
 * Client for managing reconciliation reports
 */
export declare class ReportsClient {
    private readonly client;
    constructor(client: SettlerClient);
    /**
     * Gets a reconciliation report for a specific job
     *
     * @param jobId - Job ID
     * @param options - Report options (date range, format)
     * @returns Promise resolving to the report
     *
     * @example
     * ```typescript
     * const report = await client.reports.get('job_123', {
     *   startDate: '2026-01-01',
     *   endDate: '2026-01-31',
     *   format: 'json'
     * });
     *
     * console.log(`Matched: ${report.data.summary.matched}`);
     * console.log(`Unmatched: ${report.data.summary.unmatched}`);
     * ```
     */
    get(jobId: string, options?: GetReportOptions): Promise<ApiResponse<ReconciliationReport>>;
    /**
     * Lists all reconciliation reports
     *
     * @param options - Pagination options
     * @returns Promise resolving to a list of reports
     *
     * @example
     * ```typescript
     * const reports = await client.reports.list();
     * ```
     */
    list(options?: PaginationOptions): Promise<ListResponse<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>>;
    /**
     * Returns an async iterator for paginated report listing
     *
     * @param options - Pagination options
     * @returns Async iterator over reports
     *
     * @example
     * ```typescript
     * for await (const report of client.reports.listPaginated()) {
     *   console.log(report.jobId);
     * }
     * ```
     */
    listPaginated(options?: PaginationOptions): import("../utils/pagination").PaginatedIterator<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>;
}
//# sourceMappingURL=reports.d.ts.map