import { SettlerClient } from "../client";
import { Adapter, ApiResponse, ListResponse } from "../types";
import { PaginationOptions } from "../utils/pagination";
/**
 * Client for managing adapters
 */
export declare class AdaptersClient {
    private readonly client;
    constructor(client: SettlerClient);
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
    list(options?: PaginationOptions): Promise<ListResponse<Adapter>>;
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
    get(id: string): Promise<ApiResponse<Adapter>>;
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
    listPaginated(options?: PaginationOptions): import("../utils/pagination").PaginatedIterator<Adapter>;
}
//# sourceMappingURL=adapters.d.ts.map