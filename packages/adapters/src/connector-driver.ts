/**
 * Enhanced Connector Driver Interface
 *
 * This is the canonical interface that all connector drivers must implement.
 * Supports OAuth2, API keys, manual uploads, and token-based auth.
 */

export type AuthType = "oauth2" | "api_key" | "manual_upload" | "token_based";

export type ConnectorCategory =
  | "bank_feed"
  | "accounting"
  | "subscription_billing"
  | "marketplace"
  | "erp"
  | "tax"
  | "payment_processor"
  | "ecommerce";

export interface ConnectorMetadata {
  id: string;
  displayName: string;
  category: ConnectorCategory;
  authType: AuthType;
  description: string;
  icon?: string | undefined;
  documentationUrl?: string | undefined;
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  requiredConfig: string[];
  optionalConfig: string[];
}

export interface AuthUrlOptions {
  tenantId: string;
  redirectUri: string;
  state?: string | undefined;
  scopes?: string[] | undefined;
}

export interface AuthCallbackResult {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresIn?: number | undefined;
  tokenType?: string | undefined;
  scope?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface TestConnectionOptions {
  credentials: Record<string, unknown>;
  config?: Record<string, unknown> | undefined;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string | undefined;
  error?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface SyncOptions {
  since?: Date | undefined;
  until?: Date | undefined;
  cursor?: string | undefined;
  accountId?: string | undefined;
  limit?: number | undefined;
}

export interface SyncResult {
  nextCursor?: string | undefined;
  hasMore: boolean;
  counts: {
    accounts?: number | undefined;
    transactions?: number | undefined;
    balances?: number | undefined;
    payouts?: number | undefined;
    invoices?: number | undefined;
    subscriptions?: number | undefined;
    taxEstimates?: number | undefined;
  };
  warnings?: string[] | undefined;
  errors?: string[] | undefined;
}

export interface NormalizedAccount {
  providerAccountId: string;
  accountName: string;
  accountType?: string | undefined;
  currency: string;
  institutionName?: string | undefined;
  institutionId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface NormalizedTransaction {
  externalId: string;
  accountId?: string | undefined;
  transactionType: "debit" | "credit" | "transfer" | "fee" | "refund";
  amountCents: number;
  currency: string;
  occurredAt: Date;
  description?: string | undefined;
  referenceId?: string | undefined;
  referenceType?: string | undefined;
  providerMetadata?: Record<string, unknown> | undefined;
  rawPayload?: unknown | undefined;
  idempotencyKey: string;
}

export interface NormalizedBalance {
  accountId: string;
  balanceCents: number;
  availableBalanceCents?: number | undefined;
  currency: string;
  snapshotAt: Date;
  providerMetadata?: Record<string, unknown> | undefined;
  rawPayload?: unknown | undefined;
}

export interface NormalizedPayout {
  externalId: string;
  accountId?: string | undefined;
  amountCents: number;
  currency: string;
  status: string;
  initiatedAt: Date;
  completedAt?: Date | undefined;
  feeCents?: number | undefined;
  netAmountCents?: number | undefined;
  destinationType?: string | undefined;
  destinationId?: string | undefined;
  description?: string | undefined;
  providerMetadata?: Record<string, unknown> | undefined;
  rawPayload?: unknown | undefined;
  idempotencyKey: string;
}

export interface NormalizedInvoice {
  externalId: string;
  invoiceNumber?: string | undefined;
  customerId?: string | undefined;
  customerName?: string | undefined;
  amountCents: number;
  currency: string;
  status: string;
  issueDate?: Date | undefined;
  dueDate?: Date | undefined;
  paidAt?: Date | undefined;
  lineItems?:
    | Array<{
        description: string;
        quantity: number;
        unitPriceCents: number;
        totalCents: number;
      }>
    | undefined;
  providerMetadata?: Record<string, unknown> | undefined;
  rawPayload?: unknown | undefined;
  idempotencyKey: string;
}

export interface NormalizedSubscription {
  externalId: string;
  customerId: string;
  customerName?: string | undefined;
  planId?: string | undefined;
  planName?: string | undefined;
  status: string;
  billingCycle?: string | undefined;
  amountCents: number;
  currency: string;
  currentPeriodStart?: Date | undefined;
  currentPeriodEnd?: Date | undefined;
  cancelAtPeriodEnd?: boolean | undefined;
  cancelledAt?: Date | undefined;
  providerMetadata?: Record<string, unknown> | undefined;
  rawPayload?: unknown | undefined;
  idempotencyKey: string;
}

export interface NormalizedTaxEstimate {
  externalId: string;
  transactionId?: string | undefined;
  transactionType?: string | undefined;
  amountCents: number;
  currency: string;
  taxAmountCents: number;
  taxRate?: number | undefined;
  jurisdiction?: string | undefined;
  taxType?: string | undefined;
  occurredAt: Date;
  providerMetadata?: Record<string, unknown> | undefined;
  rawPayload?: unknown | undefined;
  idempotencyKey: string;
}

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  payload: unknown;
  signature?: string | undefined;
  timestamp?: Date | undefined;
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
  handleCallback?(
    code: string,
    state: string,
    options: AuthUrlOptions
  ): Promise<AuthCallbackResult>;

  /**
   * Refresh OAuth access token (for oauth2 auth type)
   */
  refreshToken?(
    refreshToken: string,
    config?: Record<string, unknown>
  ): Promise<AuthCallbackResult>;

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
  sync(
    credentials: Record<string, unknown>,
    options: SyncOptions
  ): Promise<
    SyncResult & {
      accounts?: NormalizedAccount[] | undefined;
      transactions?: NormalizedTransaction[] | undefined;
      balances?: NormalizedBalance[] | undefined;
      payouts?: NormalizedPayout[] | undefined;
      invoices?: NormalizedInvoice[] | undefined;
      subscriptions?: NormalizedSubscription[] | undefined;
      taxEstimates?: NormalizedTaxEstimate[] | undefined;
      rawPayloads?: Array<{ type: string; payload: unknown }> | undefined;
    }
  >;
}

/**
 * Connector Error
 */
export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly connectorId: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = "ConnectorError";
    Object.setPrototypeOf(this, ConnectorError.prototype);
  }
}

/**
 * Validation Error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
