/**
 * Error Types
 * Standardized error handling for reconciliation workflows
 */
/**
 * Base Reconciliation Error
 */
export class ReconciliationError extends Error {
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
/**
 * Validation Error
 */
export class ValidationError extends ReconciliationError {
    field;
    value;
    constructor(message, field, value, details) {
        super(message, "VALIDATION_ERROR", 400, details);
        this.name = "ValidationError";
        this.field = field;
        this.value = value;
    }
}
/**
 * Security Error
 */
export class SecurityError extends ReconciliationError {
    constructor(message, details) {
        super(message, "SECURITY_ERROR", 403, details);
        this.name = "SecurityError";
    }
}
/**
 * Compilation Error
 */
export class CompilationError extends ReconciliationError {
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
/**
 * Configuration Error
 */
export class ConfigurationError extends ReconciliationError {
    configPath;
    constructor(message, configPath, details) {
        super(message, "CONFIGURATION_ERROR", 500, details);
        this.name = "ConfigurationError";
        this.configPath = configPath;
    }
}
//# sourceMappingURL=errors.js.map