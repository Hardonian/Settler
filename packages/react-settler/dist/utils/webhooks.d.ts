/**
 * Webhook Integration Utilities
 * Helpers for integrating React.Settler with webhook systems
 */
export interface WebhookPayload {
    id: string;
    event: string;
    timestamp: string;
    data: unknown;
    signature?: string;
}
export interface WebhookHandler {
    (payload: WebhookPayload): Promise<void> | void;
}
/**
 * Webhook Event Types
 */
export type ReconciliationWebhookEvent = "transaction.created" | "transaction.updated" | "settlement.created" | "settlement.updated" | "exception.created" | "exception.resolved" | "reconciliation.completed" | "reconciliation.failed";
/**
 * Webhook Manager
 * Manages webhook subscriptions and handlers
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
export declare class WebhookManager {
    private handlers;
    private secret;
    constructor(secret?: string);
    /**
     * Subscribe to a webhook event
     */
    on(event: ReconciliationWebhookEvent, handler: WebhookHandler): () => void;
    /**
     * Emit a webhook event
     */
    emit(event: ReconciliationWebhookEvent, data: unknown): Promise<void>;
    /**
     * Verify webhook signature
     */
    verifySignature(payload: WebhookPayload, signature: string): Promise<boolean>;
    /**
     * Sanitize webhook data
     */
    private sanitizeData;
    /**
     * Sign webhook payload
     */
    private signPayload;
}
/**
 * Create webhook manager instance
 */
export declare function createWebhookManager(secret?: string): WebhookManager;
/**
 * Shopify Webhook Adapter
 */
export declare function createShopifyWebhookAdapter(webhookSecret: string): {
    handleShopifyWebhook: (shopifyPayload: {
        id: string;
        event: string;
        data: unknown;
    }) => Promise<void>;
    manager: WebhookManager;
};
/**
 * Stripe Webhook Adapter
 */
export declare function createStripeWebhookAdapter(webhookSecret: string): {
    handleStripeWebhook: (stripePayload: {
        id: string;
        type: string;
        data: {
            object: unknown;
        };
    }) => Promise<void>;
    manager: WebhookManager;
};
//# sourceMappingURL=webhooks.d.ts.map