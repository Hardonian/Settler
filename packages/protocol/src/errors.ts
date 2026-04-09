/**
 * Error Types
 * Standardized error handling for reconciliation workflows
 */

/**
 * Base Reconciliation Error
 */
export class ReconciliationError extends Error {
  code: string;
  statusCode?: number | undefined;
  details?: Record<string, unknown> | undefined;
  timestamp: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
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
  field?: string | undefined;
  value?: unknown;

  constructor(message: string, field?: string, value?: unknown, details?: Record<string, unknown>) {
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
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "SECURITY_ERROR", 403, details);
    this.name = "SecurityError";
  }
}

/**
 * Compilation Error
 */
export class CompilationError extends ReconciliationError {
  component?: string | undefined;
  line?: number | undefined;
  column?: number | undefined;

  constructor(
    message: string,
    component?: string,
    line?: number,
    column?: number,
    details?: Record<string, unknown>
  ) {
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
  configPath?: string | undefined;

  constructor(message: string, configPath?: string, details?: Record<string, unknown>) {
    super(message, "CONFIGURATION_ERROR", 500, details);
    this.name = "ConfigurationError";
    this.configPath = configPath;
  }
}
