/**
 * Enhanced Connector Driver Interface
 *
 * This is the canonical interface that all connector drivers must implement.
 * Supports OAuth2, API keys, manual uploads, and token-based auth.
 */
export type AuthType = 'oauth2' | 'api_key' | 'manual_upload' | 'token_based';
export type ConnectorCategory = 'bank_feed' | 'accounting' | 'subscription_billing' | 'marketplace' | 'erp' | 'tax' | 'payment_processor' | 'ecommerce';
export interface ConnectorMetadata {
    id: string;
    displayName: string;
    category: ConnectorCategory;
    authType: AuthType;
    description: string;
    icon?: string;
    documentationUrl?: string;
    supportsWebhooks: boolean;
    supportsPolling: boolean;
    requiredConfig: string[];
    optionalConfig: string[];
}
export interface AuthUrlOptions {
    tenantId: string;
    redirectUri: string;
    state?: string;
    scopes?: string[];
}
export interface AuthCallbackResult {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    scope?: string;
    metadata?: Record<string, unknown>;
}
export interface TestConnectionOptions {
    credentials: Record<string, unknown>;
    config?: Record<string, unknown>;
}
export interface TestConnectionResult {
    success: boolean;
    message?: string;
    error?: string;
    metadata?: Record<string, unknown>;
}
export interface SyncOptions {
    since?: Date;
    until?: Date;
    cursor?: string;
    accountId?: string;
    limit?: number;
}
export interface SyncResult {
    nextCursor?: string;
    hasMore: boolean;
    counts: {
        accounts?: number;
        transactions?: number;
        balances?: number;
        payouts?: number;
        invoices?: number;
        subscriptions?: number;
        taxEstimates?: number;
    };
    warnings?: string[];
    errors?: string[];
}
export interface NormalizedAccount {
    providerAccountId: string;
    accountName: string;
    accountType?: string;
    currency: string;
    institutionName?: string;
    institutionId?: string;
    metadata?: Record<string, unknown>;
}
export interface NormalizedTransaction {
    externalId: string;
    accountId?: string;
    transactionType: 'debit' | 'credit' | 'transfer' | 'fee' | 'refund';
    amountCents: number;
    currency: string;
    occurredAt: Date;
    description?: string;
    referenceId?: string;
    referenceType?: string;
    providerMetadata?: Record<string, unknown>;
    rawPayload?: unknown;
    idempotencyKey: string;
}
export interface NormalizedBalance {
    accountId: string;
    balanceCents: number;
    availableBalanceCents?: number;
    currency: string;
    snapshotAt: Date;
    providerMetadata?: Record<string, unknown>;
    rawPayload?: unknown;
}
export interface NormalizedPayout {
    externalId: string;
    accountId?: string;
    amountCents: number;
    currency: string;
    status: string;
    initiatedAt: Date;
    completedAt?: Date;
    feeCents?: number;
    netAmountCents?: number;
    destinationType?: string;
    destinationId?: string;
    description?: string;
    providerMetadata?: Record<string, unknown>;
    rawPayload?: unknown;
    idempotencyKey: string;
}
export interface NormalizedInvoice {
    externalId: string;
    invoiceNumber?: string;
    customerId?: string;
    customerName?: string;
    amountCents: number;
    currency: string;
    status: string;
    issueDate?: Date;
    dueDate?: Date;
    paidAt?: Date;
    lineItems?: Array<{
        description: string;
        quantity: number;
        unitPriceCents: number;
        totalCents: number;
    }>;
    providerMetadata?: Record<string, unknown>;
    rawPayload?: unknown;
    idempotencyKey: string;
}
export interface NormalizedSubscription {
    externalId: string;
    customerId: string;
    customerName?: string;
    planId?: string;
    planName?: string;
    status: string;
    billingCycle?: string;
    amountCents: number;
    currency: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date;
    providerMetadata?: Record<string, unknown>;
    rawPayload?: unknown;
    idempotencyKey: string;
}
export interface NormalizedTaxEstimate {
    externalId: string;
    transactionId?: string;
    transactionType?: string;
    amountCents: number;
    currency: string;
    taxAmountCents: number;
    taxRate?: number;
    jurisdiction?: string;
    taxType?: string;
    occurredAt: Date;
    providerMetadata?: Record<string, unknown>;
    rawPayload?: unknown;
    idempotencyKey: string;
}
export interface WebhookPayload {
    eventId: string;
    eventType: string;
    payload: unknown;
    signature?: string;
    timestamp?: Date;
}
/**
 * Connector Driver Interface
 *
 * All connector implementations must implement this interface.
 */
export interface ConnectorDriver {
    /**
     * Metadata about this connector
     */
    readonly metadata: ConnectorMetadata;
    /**
     * Get OAuth authorization URL (for oauth2 auth type)
     */
    getAuthUrl?(options: AuthUrlOptions): Promise<string>;
    /**
     * Handle OAuth callback (for oauth2 auth type)
     */
    handleCallback?(code: string, state: string, options: AuthUrlOptions): Promise<AuthCallbackResult>;
    /**
     * Refresh OAuth access token (for oauth2 auth type)
     */
    refreshToken?(refreshToken: string, config?: Record<string, unknown>): Promise<AuthCallbackResult>;
    /**
     * Revoke OAuth tokens (for oauth2 auth type)
     */
    revoke?(accessToken: string, config?: Record<string, unknown>): Promise<void>;
    /**
     * Test connection with provided credentials
     */
    testConnection(options: TestConnectionOptions): Promise<TestConnectionResult>;
    /**
     * Sync data from the external system
     */
    sync(credentials: Record<string, unknown>, options: SyncOptions): Promise<SyncResult & {
        accounts?: NormalizedAccount[];
        transactions?: NormalizedTransaction[];
        balances?: NormalizedBalance[];
        payouts?: NormalizedPayout[];
        invoices?: NormalizedInvoice[];
        subscriptions?: NormalizedSubscription[];
        taxEstimates?: NormalizedTaxEstimate[];
        rawPayloads?: Array<{
            type: string;
            payload: unknown;
        }>;
    }>;
    /**
     * Handle webhook payload (optional)
     */
    handleWebhook?(payload: WebhookPayload, credentials: Record<string, unknown>): Promise<{
        accounts?: NormalizedAccount[];
        transactions?: NormalizedTransaction[];
        balances?: NormalizedBalance[];
        payouts?: NormalizedPayout[];
        invoices?: NormalizedInvoice[];
        subscriptions?: NormalizedSubscription[];
        taxEstimates?: NormalizedTaxEstimate[];
    }>;
}
/**
 * Connector Error
 */
export declare class ConnectorError extends Error {
    readonly code: string;
    readonly connectorId: string;
    readonly cause?: Error | undefined;
    constructor(message: string, code: string, connectorId: string, cause?: Error | undefined);
}
/**
 * Validation Error
 */
export declare class ValidationError extends Error {
    readonly field?: string | undefined;
    readonly value?: unknown | undefined;
    constructor(message: string, field?: string | undefined, value?: unknown | undefined);
}
//# sourceMappingURL=connector-driver.d.ts.map