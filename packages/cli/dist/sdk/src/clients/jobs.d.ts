import { SettlerClient } from "../client";
import { ReconciliationJob, CreateJobRequest, ApiResponse, ListResponse } from "../types";
import { PaginationOptions } from "../utils/pagination";
/**
 * Client for managing reconciliation jobs
 */
export declare class JobsClient {
    private readonly client;
    constructor(client: SettlerClient);
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
    create(request: CreateJobRequest): Promise<ApiResponse<ReconciliationJob>>;
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
    list(options?: PaginationOptions): Promise<ListResponse<ReconciliationJob>>;
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
    get(id: string): Promise<ApiResponse<ReconciliationJob>>;
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
    run(id: string): Promise<ApiResponse<{
        id: string;
        jobId: string;
        status: string;
        startedAt: string;
    }>>;
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
    delete(id: string): Promise<void>;
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
    listPaginated(options?: PaginationOptions): import("../utils/pagination").PaginatedIterator<ReconciliationJob>;
}
//# sourceMappingURL=jobs.d.ts.map