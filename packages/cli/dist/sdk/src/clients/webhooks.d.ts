import { SettlerClient } from "../client";
import { Webhook, CreateWebhookRequest, ApiResponse, ListResponse } from "../types";
import { PaginationOptions } from "../utils/pagination";
/**
 * Client for managing webhooks
 */
export declare class WebhooksClient {
    private readonly client;
    constructor(client: SettlerClient);
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
    create(request: CreateWebhookRequest): Promise<ApiResponse<Webhook>>;
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
    list(options?: PaginationOptions): Promise<ListResponse<Webhook>>;
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
    get(id: string): Promise<ApiResponse<Webhook>>;
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
    delete(id: string): Promise<void>;
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
    listPaginated(options?: PaginationOptions): import("../utils/pagination").PaginatedIterator<Webhook>;
}
//# sourceMappingURL=webhooks.d.ts.map