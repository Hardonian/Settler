// Public connector contract (for external developers)
export * from "./connector-contract";

// Base interfaces and types - export types only to avoid conflicts
export type { ValidationResult as BaseValidationResult } from "./base";
export type { WebhookVerificationResult as EnhancedWebhookVerificationResult } from "./enhanced-base";

// Re-export non-conflicting items
export { type NormalizedData, type FetchOptions, type Adapter } from "./base";
export {
  type AdapterConfig,
  type DateRange,
  type NormalizedEvent,
  type EnhancedAdapter,
} from "./enhanced-base";

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
export * from "./demo";

// New connector framework - use connector-driver exports (preferred)
export {
  ConnectorError as DriverConnectorError,
  ValidationError as DriverValidationError,
} from "./connector-driver";
export type {
  ConnectorDriver,
  ConnectorMetadata as DriverConnectorMetadata,
  NormalizedAccount,
  NormalizedTransaction,
  NormalizedBalance,
  NormalizedPayout,
  NormalizedInvoice,
  NormalizedSubscription,
  NormalizedTaxEstimate,
  SyncOptions,
  SyncResult,
  AuthUrlOptions,
  AuthCallbackResult,
  TestConnectionOptions,
  TestConnectionResult,
  WebhookPayload,
} from "./connector-driver";
export * from "./connector-runtime";
export * from "./connector-sandbox";
export * from "./drivers";
export * from "./credential-encryption";
export * from "./webhook-verification";
export * from "./token-refresh";
export * from "./rate-limiting";
export * from "./concurrency-protection";
// Metrics - export tracking functions only (infrastructure not part of public API)
export {
  type MetricLabels,
  trackSyncStart,
  trackSyncComplete,
  trackSyncFailure,
  trackApiCall,
  trackRateLimit,
  trackWebhook,
  trackTokenRefresh,
} from "./metrics/prometheus";

// Alerting - export types only (AlertManager is internal infrastructure)
export type {
  AlertSeverity,
  Alert,
  AlertRule,
} from "./alerting/alert-manager";

// Retry Queue - export types only (RetryQueue is internal infrastructure)
export type {
  RetryJob,
  RetryConfig,
} from "./retry-queue/retry-queue";

// Validation - export types only (DataValidator is internal infrastructure)
export type {
  ValidationResult,
} from "./validation/data-validator";

// Performance - export config type and batch processing function
export type {
  BatchConfig,
} from "./performance/batch-processor";
export {
  processInBatches,
} from "./performance/batch-processor";
