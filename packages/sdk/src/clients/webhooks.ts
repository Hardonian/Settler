import { SettlerClient } from "../client";
import { Webhook, CreateWebhookRequest, ApiResponse, ListResponse } from "../types";
import { createPaginatedIterator, PaginationOptions } from "../utils/pagination";

/**
 * Client for managing webhooks
 */
export class WebhooksClient {
  constructor(private readonly client: SettlerClient) {}

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
  async create(request: CreateWebhookRequest): Promise<ApiResponse<Webhook>> {
    return this.client.request<ApiResponse<Webhook>>(
      "POST",
      "/api/v1/webhooks",
      { body: request }
    );
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
  async list(options?: PaginationOptions): Promise<ListResponse<Webhook>> {
    const query: Record<string, string> = {};
    if (options?.cursor) {
      query.cursor = options.cursor;
    }
    if (options?.limit) {
      query.limit = String(options.limit);
    }

    return this.client.request<ListResponse<Webhook>>(
      "GET",
      "/api/v1/webhooks",
      { query }
    );
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
  async get(id: string): Promise<ApiResponse<Webhook>> {
    return this.client.request<ApiResponse<Webhook>>(
      "GET",
      `/api/v1/webhooks/${id}`
    );
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
  async delete(id: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/api/v1/webhooks/${id}`
    );
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
  listPaginated(options?: PaginationOptions) {
    return createPaginatedIterator<Webhook>((pageOptions) =>
      this.list({ ...options, ...pageOptions })
    );
  }
}
