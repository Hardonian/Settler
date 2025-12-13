import { SettlerClient } from "./client";
import { JobsClient } from "./clients/jobs";
import { ReportsClient } from "./clients/reports";
import { WebhooksClient } from "./clients/webhooks";
import { AdaptersClient } from "./clients/adapters";
import { ReceiptsClient } from "./clients/receipts";
import { FlagsClient } from "./clients/flags";
import { ConvertClient } from "./clients/convert";
import { ConsoleClient } from "./clients/console";

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
export { SettlerClient, JobsClient, ReportsClient, WebhooksClient, AdaptersClient, ReceiptsClient, FlagsClient, ConvertClient, ConsoleClient };

// Export Console types
export type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  UsageSummary,
  UsageEvent,
  UsageResponse,
  Activity,
  ReceiptListItem,
  FeatureFlag,
} from "./clients/console";

// Default export
export default SettlerClient;
