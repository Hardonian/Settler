"use strict";
/**
 * Enhanced Connector Driver Interface
 *
 * This is the canonical interface that all connector drivers must implement.
 * Supports OAuth2, API keys, manual uploads, and token-based auth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ConnectorError = void 0;
/**
 * Connector Error
 */
class ConnectorError extends Error {
    code;
    connectorId;
    cause;
    constructor(message, code, connectorId, cause) {
        super(message);
        this.code = code;
        this.connectorId = connectorId;
        this.cause = cause;
        this.name = 'ConnectorError';
        Object.setPrototypeOf(this, ConnectorError.prototype);
    }
}
exports.ConnectorError = ConnectorError;
/**
 * Validation Error
 */
class ValidationError extends Error {
    field;
    value;
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=connector-driver.js.map