/**
 * Webhook Verification
 *
 * Verifies webhook signatures from various providers
 */
export interface WebhookVerificationResult {
    valid: boolean;
    error?: string;
}
/**
 * Verify Stripe webhook signature
 */
export declare function verifyStripeWebhook(payload: string, signature: string, secret: string): WebhookVerificationResult;
/**
 * Verify Plaid webhook signature
 */
export declare function verifyPlaidWebhook(payload: string, signature: string, secret: string): WebhookVerificationResult;
/**
 * Verify Chargebee webhook signature
 */
export declare function verifyChargebeeWebhook(payload: string, signature: string, secret: string): WebhookVerificationResult;
/**
 * Verify Recurly webhook signature
 */
export declare function verifyRecurlyWebhook(payload: string, signature: string, secret: string): WebhookVerificationResult;
/**
 * Verify webhook signature based on provider
 */
export declare function verifyWebhook(providerId: string, payload: string, signature: string, secret: string): WebhookVerificationResult;
//# sourceMappingURL=webhook-verification.d.ts.map