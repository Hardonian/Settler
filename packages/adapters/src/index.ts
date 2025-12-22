// Public connector contract (for external developers)
export * from "./connector-contract";

// Base interfaces and types - export types only to avoid conflicts
export type { ValidationResult as BaseValidationResult } from "./base";
export type { WebhookVerificationResult as EnhancedWebhookVerificationResult } from "./enhanced-base";

// Re-export non-conflicting items
export type { NormalizedData, FetchOptions, Adapter } from "./base";
export type { AdapterConfig, DateRange, NormalizedEvent, EnhancedAdapter } from "./enhanced-base";

// Built-in connectors (reference implementations)
export * from "./stripe";
export * from "./stripe-enhanced";
export * from "./paypal";
export * from "./paypal-enhanced";
export * from "./square-enhanced";
export * from "./shopify";
export * from "./quickbooks";
export * from "./enhanced-quickbooks";
export * from "./enhanced-paypal";
export * from "./xero";
export * from "./netsuite";
export * from "./woocommerce";

// New connector framework - use connector-driver exports (preferred)
export {
  ConnectorDriver,
  ConnectorMetadata as DriverConnectorMetadata,
  ConnectorError as DriverConnectorError,
  ValidationError as DriverValidationError,
  type NormalizedAccount,
  type NormalizedTransaction,
  type NormalizedBalance,
  type NormalizedPayout,
  type NormalizedInvoice,
  type NormalizedSubscription,
  type NormalizedTaxEstimate,
  type SyncOptions,
  type SyncResult,
  type AuthUrlOptions,
  type AuthCallbackResult,
  type TestConnectionOptions,
  type TestConnectionResult,
  type WebhookPayload,
} from "./connector-driver";
export * from "./connector-runtime";
export * from "./drivers";
export * from "./credential-encryption";
export * from "./webhook-verification";
export * from "./token-refresh";
export * from "./rate-limiting";
export * from "./concurrency-protection";
export * from "./metrics/prometheus";
export * from "./alerting/alert-manager";
export * from "./retry-queue/retry-queue";
export * from "./validation/data-validator";
export * from "./performance/batch-processor";
