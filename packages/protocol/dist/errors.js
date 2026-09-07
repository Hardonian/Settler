"use strict";
/**
 * Error Types
 * Standardized error handling for reconciliation workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = exports.CompilationError = exports.SecurityError = exports.ValidationError = exports.ReconciliationError = void 0;
/**
 * Base Reconciliation Error
 */
class ReconciliationError extends Error {
    code;
    statusCode;
    details;
    timestamp;
    constructor(message, code, statusCode, details) {
        super(message);
        this.name = "ReconciliationError";
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ReconciliationError = ReconciliationError;
/**
 * Validation Error
 */
class ValidationError extends ReconciliationError {
    field;
    value;
    constructor(message, field, value, details) {
        super(message, "VALIDATION_ERROR", 400, details);
        this.name = "ValidationError";
        this.field = field;
        this.value = value;
    }
}
exports.ValidationError = ValidationError;
/**
 * Security Error
 */
class SecurityError extends ReconciliationError {
    constructor(message, details) {
        super(message, "SECURITY_ERROR", 403, details);
        this.name = "SecurityError";
    }
}
exports.SecurityError = SecurityError;
/**
 * Compilation Error
 */
class CompilationError extends ReconciliationError {
    component;
    line;
    column;
    constructor(message, component, line, column, details) {
        super(message, "COMPILATION_ERROR", 500, details);
        this.name = "CompilationError";
        this.component = component;
        this.line = line;
        this.column = column;
    }
}
exports.CompilationError = CompilationError;
/**
 * Configuration Error
 */
class ConfigurationError extends ReconciliationError {
    configPath;
    constructor(message, configPath, details) {
        super(message, "CONFIGURATION_ERROR", 500, details);
        this.name = "ConfigurationError";
        this.configPath = configPath;
    }
}
exports.ConfigurationError = ConfigurationError;
//# sourceMappingURL=errors.js.map