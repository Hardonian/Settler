"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksClient = void 0;
const pagination_1 = require("../utils/pagination");
/**
 * Client for managing webhooks
 */
class WebhooksClient {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Creates a new webhook
     *
     * @param request - Webhook creation request
     * @returns Promise resolving to the created webhook
     *
     * @example
     * ```typescript
     * const webhook = await client.webhooks.create({
     *   url: 'https://your-app.com/webhooks/reconcile',
     *   events: ['reconciliation.matched', 'reconciliation.mismatch'],
     *   secret: 'optional_secret'
     * });
     * ```
     */
    async create(request) {
        return this.client.request("POST", "/api/v1/webhooks", { body: request });
    }
    /**
     * Lists all webhooks
     *
     * @param options - Pagination options
     * @returns Promise resolving to a list of webhooks
     *
     * @example
     * ```typescript
     * const webhooks = await client.webhooks.list();
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
        return this.client.request("GET", "/api/v1/webhooks", { query });
    }
    /**
     * Gets a webhook by ID
     *
     * @param id - Webhook ID
     * @returns Promise resolving to the webhook
     *
     * @example
     * ```typescript
     * const webhook = await client.webhooks.get('wh_1234567890');
     * ```
     */
    async get(id) {
        return this.client.request("GET", `/api/v1/webhooks/${id}`);
    }
    /**
     * Deletes a webhook
     *
     * @param id - Webhook ID
     * @returns Promise that resolves when the webhook is deleted
     *
     * @example
     * ```typescript
     * await client.webhooks.delete('wh_1234567890');
     * ```
     */
    async delete(id) {
        await this.client.request("DELETE", `/api/v1/webhooks/${id}`);
    }
    /**
     * Returns an async iterator for paginated webhook listing
     *
     * @param options - Pagination options
     * @returns Async iterator over webhooks
     *
     * @example
     * ```typescript
     * for await (const webhook of client.webhooks.listPaginated()) {
     *   console.log(webhook.url);
     * }
     * ```
     */
    listPaginated(options) {
        return (0, pagination_1.createPaginatedIterator)((pageOptions) => this.list({ ...options, ...pageOptions }));
    }
}
exports.WebhooksClient = WebhooksClient;
//# sourceMappingURL=webhooks.js.map