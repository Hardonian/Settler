"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsClient = void 0;
const pagination_1 = require("../utils/pagination");
/**
 * Client for managing reconciliation jobs
 */
class JobsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Creates a new reconciliation job
     *
     * @param request - Job creation request
     * @returns Promise resolving to the created job
     *
     * @example
     * ```typescript
     * const job = await client.jobs.create({
     *   name: 'Shopify-Stripe Reconciliation',
     *   source: {
     *     adapter: 'shopify',
     *     config: { apiKey: '...', shopDomain: '...' }
     *   },
     *   target: {
     *     adapter: 'stripe',
     *     config: { apiKey: '...' }
     *   },
     *   rules: {
     *     matching: [
     *       { field: 'order_id', type: 'exact' },
     *       { field: 'amount', type: 'exact', tolerance: 0.01 }
     *     ]
     *   }
     * });
     * ```
     */
    async create(request) {
        return this.client.request("POST", "/api/v1/jobs", { body: request });
    }
    /**
     * Lists all reconciliation jobs
     *
     * @param options - Pagination options
     * @returns Promise resolving to a list of jobs
     *
     * @example
     * ```typescript
     * const jobs = await client.jobs.list();
     * console.log(`Found ${jobs.count} jobs`);
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
        return this.client.request("GET", "/api/v1/jobs", { query });
    }
    /**
     * Gets a reconciliation job by ID
     *
     * @param id - Job ID
     * @returns Promise resolving to the job
     *
     * @example
     * ```typescript
     * const job = await client.jobs.get('job_1234567890');
     * ```
     */
    async get(id) {
        return this.client.request("GET", `/api/v1/jobs/${id}`);
    }
    /**
     * Runs a reconciliation job manually
     *
     * @param id - Job ID
     * @returns Promise resolving to the execution details
     *
     * @example
     * ```typescript
     * const execution = await client.jobs.run('job_1234567890');
     * console.log(`Execution started: ${execution.data.id}`);
     * ```
     */
    async run(id) {
        return this.client.request("POST", `/api/v1/jobs/${id}/run`);
    }
    /**
     * Deletes a reconciliation job
     *
     * @param id - Job ID
     * @returns Promise that resolves when the job is deleted
     *
     * @example
     * ```typescript
     * await client.jobs.delete('job_1234567890');
     * ```
     */
    async delete(id) {
        await this.client.request("DELETE", `/api/v1/jobs/${id}`);
    }
    /**
     * Returns an async iterator for paginated job listing
     *
     * @param options - Pagination options
     * @returns Async iterator over jobs
     *
     * @example
     * ```typescript
     * for await (const job of client.jobs.listPaginated()) {
     *   console.log(job.name);
     * }
     * ```
     */
    listPaginated(options) {
        return (0, pagination_1.createPaginatedIterator)((pageOptions) => this.list({ ...options, ...pageOptions }));
    }
}
exports.JobsClient = JobsClient;
//# sourceMappingURL=jobs.js.map