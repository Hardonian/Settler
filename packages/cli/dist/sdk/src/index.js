"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleClient = exports.ConvertClient = exports.FlagsClient = exports.ReceiptsClient = exports.AdaptersClient = exports.WebhooksClient = exports.ReportsClient = exports.JobsClient = exports.SettlerClient = exports.withRetry = exports.createMetricsMiddleware = exports.createLoggingMiddleware = exports.MiddlewareChain = exports.TokenManager = exports.extractWebhookTimestamp = exports.verifyWebhookSignatureWithTimestamp = exports.verifyWebhookSignature = exports.PaginatedIterator = exports.collectPaginated = exports.createPaginatedIterator = exports.parseError = exports.UnknownError = exports.ServerError = exports.RateLimitError = exports.ValidationError = exports.AuthError = exports.NetworkError = exports.SettlerError = void 0;
const client_1 = require("./client");
Object.defineProperty(exports, "SettlerClient", { enumerable: true, get: function () { return client_1.SettlerClient; } });
const jobs_1 = require("./clients/jobs");
Object.defineProperty(exports, "JobsClient", { enumerable: true, get: function () { return jobs_1.JobsClient; } });
const reports_1 = require("./clients/reports");
Object.defineProperty(exports, "ReportsClient", { enumerable: true, get: function () { return reports_1.ReportsClient; } });
const webhooks_1 = require("./clients/webhooks");
Object.defineProperty(exports, "WebhooksClient", { enumerable: true, get: function () { return webhooks_1.WebhooksClient; } });
const adapters_1 = require("./clients/adapters");
Object.defineProperty(exports, "AdaptersClient", { enumerable: true, get: function () { return adapters_1.AdaptersClient; } });
const receipts_1 = require("./clients/receipts");
Object.defineProperty(exports, "ReceiptsClient", { enumerable: true, get: function () { return receipts_1.ReceiptsClient; } });
const flags_1 = require("./clients/flags");
Object.defineProperty(exports, "FlagsClient", { enumerable: true, get: function () { return flags_1.FlagsClient; } });
const convert_1 = require("./clients/convert");
Object.defineProperty(exports, "ConvertClient", { enumerable: true, get: function () { return convert_1.ConvertClient; } });
const console_1 = require("./clients/console");
Object.defineProperty(exports, "ConsoleClient", { enumerable: true, get: function () { return console_1.ConsoleClient; } });
// Export types
__exportStar(require("./types"), exports);
// Export error classes
var errors_1 = require("./errors");
Object.defineProperty(exports, "SettlerError", { enumerable: true, get: function () { return errors_1.SettlerError; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return errors_1.NetworkError; } });
Object.defineProperty(exports, "AuthError", { enumerable: true, get: function () { return errors_1.AuthError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_1.RateLimitError; } });
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return errors_1.ServerError; } });
Object.defineProperty(exports, "UnknownError", { enumerable: true, get: function () { return errors_1.UnknownError; } });
Object.defineProperty(exports, "parseError", { enumerable: true, get: function () { return errors_1.parseError; } });
// Export utilities
var pagination_1 = require("./utils/pagination");
Object.defineProperty(exports, "createPaginatedIterator", { enumerable: true, get: function () { return pagination_1.createPaginatedIterator; } });
Object.defineProperty(exports, "collectPaginated", { enumerable: true, get: function () { return pagination_1.collectPaginated; } });
Object.defineProperty(exports, "PaginatedIterator", { enumerable: true, get: function () { return pagination_1.PaginatedIterator; } });
var webhook_signature_1 = require("./utils/webhook-signature");
Object.defineProperty(exports, "verifyWebhookSignature", { enumerable: true, get: function () { return webhook_signature_1.verifyWebhookSignature; } });
Object.defineProperty(exports, "verifyWebhookSignatureWithTimestamp", { enumerable: true, get: function () { return webhook_signature_1.verifyWebhookSignatureWithTimestamp; } });
Object.defineProperty(exports, "extractWebhookTimestamp", { enumerable: true, get: function () { return webhook_signature_1.extractWebhookTimestamp; } });
var token_refresh_1 = require("./utils/token-refresh");
Object.defineProperty(exports, "TokenManager", { enumerable: true, get: function () { return token_refresh_1.TokenManager; } });
var middleware_1 = require("./utils/middleware");
Object.defineProperty(exports, "MiddlewareChain", { enumerable: true, get: function () { return middleware_1.MiddlewareChain; } });
Object.defineProperty(exports, "createLoggingMiddleware", { enumerable: true, get: function () { return middleware_1.createLoggingMiddleware; } });
Object.defineProperty(exports, "createMetricsMiddleware", { enumerable: true, get: function () { return middleware_1.createMetricsMiddleware; } });
var retry_1 = require("./utils/retry");
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return retry_1.withRetry; } });
// Default export
exports.default = client_1.SettlerClient;
//# sourceMappingURL=index.js.map