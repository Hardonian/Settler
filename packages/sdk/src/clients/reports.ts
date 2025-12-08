import { SettlerClient } from "../client";
import { ReconciliationReport, ApiResponse, ListResponse } from "../types";
import { createPaginatedIterator, PaginationOptions } from "../utils/pagination";

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
export class ReportsClient {
  constructor(private readonly client: SettlerClient) {}

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
  async get(jobId: string, options: GetReportOptions = {}): Promise<ApiResponse<ReconciliationReport>> {
    const query: Record<string, string> = {};
    if (options.startDate) query.startDate = options.startDate;
    if (options.endDate) query.endDate = options.endDate;
    if (options.format) query.format = options.format;

    return this.client.request<ApiResponse<ReconciliationReport>>(
      "GET",
      `/api/v1/reports/${jobId}`,
      { query }
    );
  }

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
  async list(options?: PaginationOptions): Promise<ListResponse<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>> {
    const query: Record<string, string> = {};
    if (options?.cursor) {
      query.cursor = options.cursor;
    }
    if (options?.limit) {
      query.limit = String(options.limit);
    }

    return this.client.request<ListResponse<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>>(
      "GET",
      "/api/v1/reports",
      { query }
    );
  }

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
  listPaginated(options?: PaginationOptions) {
    return createPaginatedIterator<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>(
      (pageOptions) => this.list({ ...options, ...pageOptions })
    );
  }
}
