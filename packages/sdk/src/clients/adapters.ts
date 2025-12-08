import { SettlerClient } from "../client";
import { Adapter, ApiResponse, ListResponse } from "../types";
import { createPaginatedIterator, PaginationOptions } from "../utils/pagination";

/**
 * Client for managing adapters
 */
export class AdaptersClient {
  constructor(private readonly client: SettlerClient) {}

  /**
   * Lists all available adapters
   * 
   * @param options - Pagination options
   * @returns Promise resolving to a list of adapters
   * 
   * @example
   * ```typescript
   * const adapters = await client.adapters.list();
   * console.log(`Available adapters: ${adapters.data.map(a => a.name).join(', ')}`);
   * ```
   */
  async list(options?: PaginationOptions): Promise<ListResponse<Adapter>> {
    const query: Record<string, string> = {};
    if (options?.cursor) {
      query.cursor = options.cursor;
    }
    if (options?.limit) {
      query.limit = String(options.limit);
    }

    return this.client.request<ListResponse<Adapter>>(
      "GET",
      "/api/v1/adapters",
      { query }
    );
  }

  /**
   * Gets an adapter by ID
   * 
   * @param id - Adapter ID (e.g., 'stripe', 'shopify')
   * @returns Promise resolving to the adapter
   * 
   * @example
   * ```typescript
   * const stripeAdapter = await client.adapters.get('stripe');
   * console.log(stripeAdapter.data.description);
   * ```
   */
  async get(id: string): Promise<ApiResponse<Adapter>> {
    return this.client.request<ApiResponse<Adapter>>(
      "GET",
      `/api/v1/adapters/${id}`
    );
  }

  /**
   * Returns an async iterator for paginated adapter listing
   * 
   * @param options - Pagination options
   * @returns Async iterator over adapters
   * 
   * @example
   * ```typescript
   * for await (const adapter of client.adapters.listPaginated()) {
   *   console.log(adapter.name);
   * }
   * ```
   */
  listPaginated(options?: PaginationOptions) {
    return createPaginatedIterator<Adapter>((pageOptions) =>
      this.list({ ...options, ...pageOptions })
    );
  }
}
