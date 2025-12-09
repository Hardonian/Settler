/**
 * Integration Security Module
 *
 * Provides credential encryption, webhook signature validation,
 * quota enforcement, and health monitoring for integrations
 *
 * Priority: P0 (CRITICAL - Integration security)
 */
export interface IntegrationCredential {
    id: string;
    tenantId: string;
    integrationId: string;
    credentialType: "oauth_token" | "api_key" | "webhook_secret" | "api_secret";
    encryptedCredential: string;
    scopes?: string[];
    expiresAt?: Date | undefined;
    status: "active" | "expired" | "revoked" | "error";
}
/**
 * Encrypt credential using AES-256-GCM
 * In production, use AWS KMS, HashiCorp Vault, or similar
 */
export declare function encryptCredential(credential: string, encryptionKey: string): {
    encrypted: string;
    iv: string;
    tag: string;
};
/**
 * Decrypt credential using AES-256-GCM
 */
export declare function decryptCredential(encrypted: string, iv: string, tag: string, encryptionKey: string): string;
/**
 * Validate webhook signature (HMAC)
 */
export declare function validateWebhookSignature(payload: string, signature: string, secret: string, algorithm?: "sha256" | "sha512"): boolean;
/**
 * Validate webhook timestamp (prevent replay attacks)
 */
export declare function validateWebhookTimestamp(timestamp: number, maxAgeSeconds?: number): boolean;
/**
 * Get integration credential from database
 */
export declare function getIntegrationCredential(supabaseUrl: string, supabaseServiceKey: string, tenantId: string, integrationId: string, credentialType: "oauth_token" | "api_key" | "webhook_secret" | "api_secret"): Promise<IntegrationCredential | null>;
/**
 * Check integration quota
 */
export declare function checkIntegrationQuota(supabaseUrl: string, supabaseServiceKey: string, tenantId: string, integrationId: string, quotaType: "api_calls" | "webhook_events" | "data_synced_mb", limit: number): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
}>;
/**
 * Record integration quota usage
 */
export declare function recordIntegrationQuotaUsage(supabaseUrl: string, supabaseServiceKey: string, tenantId: string, integrationId: string, quotaType: "api_calls" | "webhook_events" | "data_synced_mb", amount: number): Promise<void>;
/**
 * Update integration health
 */
export declare function updateIntegrationHealth(supabaseUrl: string, supabaseServiceKey: string, tenantId: string, integrationId: string, success: boolean, errorMessage?: string): Promise<void>;
/**
 * Integration-specific webhook validators
 */
export declare const webhookValidators: {
    stripe: (payload: string, signature: string, secret: string) => boolean;
    shopify: (payload: string, signature: string, secret: string) => boolean;
    paypal: (payload: string, signature: string, secret: string) => boolean;
};
//# sourceMappingURL=integration-security.d.ts.map