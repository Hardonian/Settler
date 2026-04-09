import { SettlerClient } from "./client";
import { JobsClient } from "./clients/jobs";
import { ReportsClient } from "./clients/reports";
import { WebhooksClient } from "./clients/webhooks";
import { AdaptersClient } from "./clients/adapters";
import { ReceiptsClient } from "./clients/receipts";
import { FlagsClient } from "./clients/flags";
import { ConvertClient } from "./clients/convert";
import { ConsoleClient } from "./clients/console";
import { TransactionsClient } from "./clients/transactions";
import { SettlementsClient } from "./clients/settlements";
import { FeesClient } from "./clients/fees";
import { ExportsClient } from "./clients/exports";

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
export { createPaginatedIterator, collectPaginated, PaginatedIterator } from "./utils/pagination";
export {
  verifyWebhookSignature,
  verifyWebhookSignatureWithTimestamp,
  extractWebhookTimestamp,
} from "./utils/webhook-signature";
export { TokenManager, type TokenInfo } from "./utils/token-refresh";
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
export {
  SettlerClient,
  JobsClient,
  ReportsClient,
  WebhooksClient,
  AdaptersClient,
  ReceiptsClient,
  FlagsClient,
  ConvertClient,
  ConsoleClient,
  TransactionsClient,
  SettlementsClient,
  FeesClient,
  ExportsClient,
};

// Export transaction types
export type {
  Transaction,
  Money,
  PaginationInfo,
  ListTransactionsParams,
  TransactionListResponse,
  TransactionResponse,
} from "./clients/transactions";

// Export settlement types
export type {
  Settlement,
  ListSettlementsParams,
  SettlementListResponse,
  SettlementResponse,
} from "./clients/settlements";

// Export fee types
export type {
  Fee,
  ListFeesParams,
  FeeListResponse,
  EffectiveRateParams,
  EffectiveRateResult,
  EffectiveRateResponse,
} from "./clients/fees";

// Export export types
export type {
  CreateExportRequest,
  ExportDateRange,
  ExportOptions,
  ExportSummary,
  ExportResult,
} from "./clients/exports";

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
