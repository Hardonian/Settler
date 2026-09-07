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
// Re-export error types
export { ReconciliationError, ValidationError as ProtocolValidationError, SecurityError, CompilationError, ConfigurationError, } from "./errors";
// Re-export utilities
export { sanitizeString, isValidISODate, isValidCurrency, isValidMoney, formatMoney, sanitizeTransactionMetadata, validateTransactionId, maskPII, generateSecureId, deepClone, stableHash, stableStringify, } from "./utils";
//# sourceMappingURL=index.js.map