import { SettlerClient } from "./client";
import { JobsClient } from "./clients/jobs";
import { ReportsClient } from "./clients/reports";
import { WebhooksClient } from "./clients/webhooks";
import { AdaptersClient } from "./clients/adapters";

// Export types
export * from "./types";

// Export error classes
export {
  SettlerError,
  NetworkError,
  AuthError,
  ValidationError,
  RateLimitError,
  ServerError,
  UnknownError,
  parseError,
} from "./errors";

// Export utilities
export {
  createPaginatedIterator,
  collectPaginated,
  PaginatedIterator,
} from "./utils/pagination";
export {
  verifyWebhookSignature,
  verifyWebhookSignatureWithTimestamp,
  extractWebhookTimestamp,
} from "./utils/webhook-signature";
export {
  TokenManager,
  type TokenInfo,
} from "./utils/token-refresh";
export {
  MiddlewareChain,
  type Middleware,
  type RequestContext,
  type ResponseContext,
  createLoggingMiddleware,
  createMetricsMiddleware,
} from "./utils/middleware";
export { withRetry, type RetryConfig } from "./utils/retry";

// Export clients
export { SettlerClient, JobsClient, ReportsClient, WebhooksClient, AdaptersClient };

// Default export
export default SettlerClient;
