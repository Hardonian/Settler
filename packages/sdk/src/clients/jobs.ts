import { SettlerClient } from "../client";
import {
  ReconciliationJob,
  CreateJobRequest,
  ApiResponse,
  ListResponse,
} from "../types";
import { createPaginatedIterator, PaginationOptions } from "../utils/pagination";

/**
 * Client for managing reconciliation jobs
 */
export class JobsClient {
  constructor(private readonly client: SettlerClient) {}

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
  async create(request: CreateJobRequest): Promise<ApiResponse<ReconciliationJob>> {
    return this.client.request<ApiResponse<ReconciliationJob>>(
      "POST",
      "/api/v1/jobs",
      { body: request }
    );
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
  async list(options?: PaginationOptions): Promise<ListResponse<ReconciliationJob>> {
    const query: Record<string, string> = {};
    if (options?.cursor) {
      query.cursor = options.cursor;
    }
    if (options?.limit) {
      query.limit = String(options.limit);
    }

    return this.client.request<ListResponse<ReconciliationJob>>(
      "GET",
      "/api/v1/jobs",
      { query }
    );
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
  async get(id: string): Promise<ApiResponse<ReconciliationJob>> {
    return this.client.request<ApiResponse<ReconciliationJob>>(
      "GET",
      `/api/v1/jobs/${id}`
    );
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
  async run(id: string): Promise<ApiResponse<{ id: string; jobId: string; status: string; startedAt: string }>> {
    return this.client.request<ApiResponse<{ id: string; jobId: string; status: string; startedAt: string }>>(
      "POST",
      `/api/v1/jobs/${id}/run`
    );
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
  async delete(id: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/api/v1/jobs/${id}`
    );
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
  listPaginated(options?: PaginationOptions) {
    return createPaginatedIterator<ReconciliationJob>((pageOptions) =>
      this.list({ ...options, ...pageOptions })
    );
  }
}
