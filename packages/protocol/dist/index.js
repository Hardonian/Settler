"use strict";
/**
 * @settler/protocol
 *
 * Framework-agnostic protocol types for reconciliation workflows.
 *
 * This package defines the core types and JSON schema for reconciliation
 * UI definitions and rules. It is designed to be consumed by any reconciliation
 * backend, not just Settler's proprietary engine.
 *
 * Enterprise-grade security, validation, and observability built-in.
 *
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableStringify = exports.stableHash = exports.deepClone = exports.generateSecureId = exports.maskPII = exports.validateTransactionId = exports.sanitizeTransactionMetadata = exports.formatMoney = exports.isValidMoney = exports.isValidCurrency = exports.isValidISODate = exports.sanitizeString = exports.ConfigurationError = exports.CompilationError = exports.SecurityError = exports.ProtocolValidationError = exports.ReconciliationError = void 0;
// Re-export error types
var errors_1 = require("./errors");
Object.defineProperty(exports, "ReconciliationError", { enumerable: true, get: function () { return errors_1.ReconciliationError; } });
Object.defineProperty(exports, "ProtocolValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "SecurityError", { enumerable: true, get: function () { return errors_1.SecurityError; } });
Object.defineProperty(exports, "CompilationError", { enumerable: true, get: function () { return errors_1.CompilationError; } });
Object.defineProperty(exports, "ConfigurationError", { enumerable: true, get: function () { return errors_1.ConfigurationError; } });
// Re-export utilities
var utils_1 = require("./utils");
Object.defineProperty(exports, "sanitizeString", { enumerable: true, get: function () { return utils_1.sanitizeString; } });
Object.defineProperty(exports, "isValidISODate", { enumerable: true, get: function () { return utils_1.isValidISODate; } });
Object.defineProperty(exports, "isValidCurrency", { enumerable: true, get: function () { return utils_1.isValidCurrency; } });
Object.defineProperty(exports, "isValidMoney", { enumerable: true, get: function () { return utils_1.isValidMoney; } });
Object.defineProperty(exports, "formatMoney", { enumerable: true, get: function () { return utils_1.formatMoney; } });
Object.defineProperty(exports, "sanitizeTransactionMetadata", { enumerable: true, get: function () { return utils_1.sanitizeTransactionMetadata; } });
Object.defineProperty(exports, "validateTransactionId", { enumerable: true, get: function () { return utils_1.validateTransactionId; } });
Object.defineProperty(exports, "maskPII", { enumerable: true, get: function () { return utils_1.maskPII; } });
Object.defineProperty(exports, "generateSecureId", { enumerable: true, get: function () { return utils_1.generateSecureId; } });
Object.defineProperty(exports, "deepClone", { enumerable: true, get: function () { return utils_1.deepClone; } });
Object.defineProperty(exports, "stableHash", { enumerable: true, get: function () { return utils_1.stableHash; } });
Object.defineProperty(exports, "stableStringify", { enumerable: true, get: function () { return utils_1.stableStringify; } });
//# sourceMappingURL=index.js.map