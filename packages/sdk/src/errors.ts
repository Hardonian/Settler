/**
 * Base error class for all Settler SDK errors
 */
export class SettlerError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
    if (details !== undefined) {
      this.details = details;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Network-related errors (timeouts, connection failures, etc.)
 */
export class NetworkError extends SettlerError {
  constructor(message: string, cause?: Error) {
    super(message, "NETWORK_ERROR", undefined, { cause });
    this.name = "NetworkError";
  }
}

/**
 * Authentication errors (invalid API key, expired token, etc.)
 */
export class AuthError extends SettlerError {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, "AUTH_ERROR", statusCode || 401, details);
    this.name = "AuthError";
  }
}

/**
 * Validation errors (invalid request parameters, etc.)
 */
export class ValidationError extends SettlerError {
  public readonly field?: string;

  constructor(message: string, field?: string, statusCode?: number, details?: unknown) {
    super(message, "VALIDATION_ERROR", statusCode || 400, details);
    this.name = "ValidationError";
    if (field !== undefined) {
      this.field = field;
    }
  }
}

/**
 * Rate limit errors (too many requests)
 */
export class RateLimitError extends SettlerError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly reset?: number;

  constructor(
    message: string,
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    reset?: number
  ) {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "RateLimitError";
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    if (limit !== undefined) {
      this.limit = limit;
    }
    if (remaining !== undefined) {
      this.remaining = remaining;
    }
    if (reset !== undefined) {
      this.reset = reset;
    }
  }
}

/**
 * Server errors (5xx responses)
 */
export class ServerError extends SettlerError {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, "SERVER_ERROR", statusCode || 500, details);
    this.name = "ServerError";
  }
}

/**
 * Unknown/Unhandled errors
 */
export class UnknownError extends SettlerError {
  constructor(message: string, cause?: Error) {
    super(message, "UNKNOWN_ERROR", undefined, { cause });
    this.name = "UnknownError";
  }
}

/**
 * Parses an API error response and returns the appropriate error class
 */
export function parseError(response: Response, body?: unknown): SettlerError {
  const statusCode = response.status;
  const errorData =
    typeof body === "object" && body !== null
      ? (body as { error?: string; message?: string; details?: unknown })
      : {};

  const message =
    errorData.message || errorData.error || `HTTP ${statusCode}: ${response.statusText}`;

  switch (statusCode) {
    case 400:
      return new ValidationError(message, undefined, statusCode, errorData.details);
    case 401:
    case 403:
      return new AuthError(message, statusCode, errorData.details);
    case 429: {
      const retryAfter = response.headers.get("Retry-After");
      const limit = response.headers.get("X-RateLimit-Limit");
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const reset = response.headers.get("X-RateLimit-Reset");
      return new RateLimitError(
        message,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
        limit ? parseInt(limit, 10) : undefined,
        remaining ? parseInt(remaining, 10) : undefined,
        reset ? parseInt(reset, 10) : undefined
      );
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, statusCode, errorData.details);
    default:
      return new SettlerError(message, "API_ERROR", statusCode, errorData.details);
  }
}
