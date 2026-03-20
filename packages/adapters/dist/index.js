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
exports.processInBatches = exports.metrics = exports.trackTokenRefresh = exports.trackWebhook = exports.trackRateLimit = exports.trackApiCall = exports.trackSyncFailure = exports.trackSyncComplete = exports.trackSyncStart = exports.DriverValidationError = exports.DriverConnectorError = void 0;
// Public connector contract (for external developers)
__exportStar(require("./connector-contract"), exports);
// Built-in connectors (reference implementations)
__exportStar(require("./stripe"), exports);
__exportStar(require("./stripe-enhanced"), exports);
__exportStar(require("./paypal"), exports);
__exportStar(require("./paypal-enhanced"), exports);
__exportStar(require("./square-enhanced"), exports);
__exportStar(require("./shopify"), exports);
__exportStar(require("./quickbooks"), exports);
__exportStar(require("./enhanced-quickbooks"), exports);
__exportStar(require("./enhanced-paypal"), exports);
__exportStar(require("./xero"), exports);
__exportStar(require("./netsuite"), exports);
__exportStar(require("./woocommerce"), exports);
__exportStar(require("./demo"), exports);
// New connector framework - use connector-driver exports (preferred)
var connector_driver_1 = require("./connector-driver");
Object.defineProperty(exports, "DriverConnectorError", { enumerable: true, get: function () { return connector_driver_1.ConnectorError; } });
Object.defineProperty(exports, "DriverValidationError", { enumerable: true, get: function () { return connector_driver_1.ValidationError; } });
__exportStar(require("./connector-runtime"), exports);
__exportStar(require("./connector-sandbox"), exports);
__exportStar(require("./drivers"), exports);
__exportStar(require("./credential-encryption"), exports);
__exportStar(require("./webhook-verification"), exports);
__exportStar(require("./token-refresh"), exports);
__exportStar(require("./rate-limiting"), exports);
__exportStar(require("./concurrency-protection"), exports);
// Metrics - export tracking functions and PrometheusMetrics instance
var prometheus_1 = require("./metrics/prometheus");
Object.defineProperty(exports, "trackSyncStart", { enumerable: true, get: function () { return prometheus_1.trackSyncStart; } });
Object.defineProperty(exports, "trackSyncComplete", { enumerable: true, get: function () { return prometheus_1.trackSyncComplete; } });
Object.defineProperty(exports, "trackSyncFailure", { enumerable: true, get: function () { return prometheus_1.trackSyncFailure; } });
Object.defineProperty(exports, "trackApiCall", { enumerable: true, get: function () { return prometheus_1.trackApiCall; } });
Object.defineProperty(exports, "trackRateLimit", { enumerable: true, get: function () { return prometheus_1.trackRateLimit; } });
Object.defineProperty(exports, "trackWebhook", { enumerable: true, get: function () { return prometheus_1.trackWebhook; } });
Object.defineProperty(exports, "trackTokenRefresh", { enumerable: true, get: function () { return prometheus_1.trackTokenRefresh; } });
Object.defineProperty(exports, "metrics", { enumerable: true, get: function () { return prometheus_1.metrics; } });
var batch_processor_1 = require("./performance/batch-processor");
Object.defineProperty(exports, "processInBatches", { enumerable: true, get: function () { return batch_processor_1.processInBatches; } });
//# sourceMappingURL=index.js.map