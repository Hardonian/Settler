"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsClient = void 0;
const pagination_1 = require("../utils/pagination");
/**
 * Client for managing reconciliation reports
 */
class ReportsClient {
    client;
    constructor(client) {
        this.client = client;
    }
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
    async get(jobId, options = {}) {
        const query = {};
        if (options.startDate)
            query.startDate = options.startDate;
        if (options.endDate)
            query.endDate = options.endDate;
        if (options.format)
            query.format = options.format;
        return this.client.request("GET", `/api/v1/reports/${jobId}`, { query });
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
    async list(options) {
        const query = {};
        if (options?.cursor) {
            query.cursor = options.cursor;
        }
        if (options?.limit) {
            query.limit = String(options.limit);
        }
        return this.client.request("GET", "/api/v1/reports", { query });
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
    listPaginated(options) {
        return (0, pagination_1.createPaginatedIterator)((pageOptions) => this.list({ ...options, ...pageOptions }));
    }
}
exports.ReportsClient = ReportsClient;
//# sourceMappingURL=reports.js.map