/**
 * Webhook Ingestion Service
 *
 * Handles webhook ingestion with signature verification, idempotency,
 * and retry logic as specified in the Product & Technical Specification.
 */
import { EnhancedAdapter, NormalizedEvent } from '@settler/adapters';
export interface WebhookIngestionResult {
    success: boolean;
    events: NormalizedEvent[];
    errors?: string[];
}
export declare class WebhookIngestionService {
    private adapters;
    constructor();
    /**
     * Register a custom adapter
     */
    registerAdapter(adapter: EnhancedAdapter): void;
    /**
     * Process incoming webhook
     */
    processWebhook(adapterName: string, payload: string | Buffer | Record<string, unknown>, signature: string, secret: string, tenantId: string): Promise<WebhookIngestionResult>;
    /**
     * Process a normalized event
     */
    private processEvent;
    /**
     * Store transaction
     */
    private storeTransaction;
    /**
     * Store settlement
     */
    private storeSettlement;
    /**
     * Store refund/dispute
     */
    private storeRefundDispute;
    /**
     * Store FX conversion
     */
    private storeFXConversion;
    /**
     * Store webhook payload for audit
     */
    private storeWebhookPayload;
    /**
     * Extract idempotency key from payload
     */
    private extractIdempotencyKey;
    /**
     * Check if webhook was already processed (idempotency)
     */
    private checkIdempotency;
    /**
     * Store idempotency key
     */
    private storeIdempotencyKey;
}
//# sourceMappingURL=WebhookIngestionService.d.ts.map