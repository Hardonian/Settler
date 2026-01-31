/**
 * @jobforge/errors
 * Standardized error handling, correlation IDs, and error envelopes.
 */

export {
  ErrorCode,
  ERROR_CODE_TO_HTTP_STATUS,
  AppError,
  type ErrorEnvelope,
  type ValidationErrorDetail,
} from './types'

export {
  createBadRequestError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createValidationError,
  createRateLimitError,
  createInternalError,
  createDatabaseError,
  createExternalServiceError,
  createTimeoutError,
  toAppError,
} from './factories'

export {
  generateCorrelationId,
  extractCorrelationId,
  getCurrentCorrelationId,
  runWithCorrelationId,
} from './correlation'
