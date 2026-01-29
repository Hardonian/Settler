"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptersClient = void 0;
const pagination_1 = require("../utils/pagination");
/**
 * Client for managing adapters
 */
class AdaptersClient {
    client;
    constructor(client) {
        this.client = client;
    }
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
    async list(options) {
        const query = {};
        if (options?.cursor) {
            query.cursor = options.cursor;
        }
        if (options?.limit) {
            query.limit = String(options.limit);
        }
        return this.client.request("GET", "/api/v1/adapters", { query });
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
    async get(id) {
        return this.client.request("GET", `/api/v1/adapters/${id}`);
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
    listPaginated(options) {
        return (0, pagination_1.createPaginatedIterator)((pageOptions) => this.list({ ...options, ...pageOptions }));
    }
}
exports.AdaptersClient = AdaptersClient;
//# sourceMappingURL=adapters.js.map