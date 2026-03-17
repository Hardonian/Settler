/**
 * Ledger Errors
 *
 * Typed error classes for ledger operations.
 * These errors are designed to be caught and handled at the application layer.
 */

import type { LogContext } from "@settler/types";

/**
 * Error codes for ledger operations
 */
export enum LedgerErrorCode {
  // Account errors
  ACCOUNT_NOT_FOUND = "LEDGER_ACCOUNT_NOT_FOUND",
  ACCOUNT_ALREADY_EXISTS = "LEDGER_ACCOUNT_ALREADY_EXISTS",
  ACCOUNT_TYPE_INVALID = "LEDGER_ACCOUNT_TYPE_INVALID",

  // Transfer errors
  TRANSFER_NOT_FOUND = "LEDGER_TRANSFER_NOT_FOUND",
  TRANSFER_ALREADY_EXISTS = "LEDGER_TRANSFER_ALREADY_EXISTS",
  TRANSFER_INVALID_STATE = "LEDGER_TRANSFER_INVALID_STATE",
  TRANSFER_REVERSAL_FAILED = "LEDGER_TRANSFER_REVERSAL_FAILED",
  IDEMPOTENCY_KEY_CONFLICT = "LEDGER_IDEMPOTENCY_KEY_CONFLICT",

  // Balance errors
  INSUFFICIENT_BALANCE = "LEDGER_INSUFFICIENT_BALANCE",
  BALANCE_MISMATCH = "LEDGER_BALANCE_MISMATCH",

  // Validation errors
  VALIDATION_ERROR = "LEDGER_VALIDATION_ERROR",
  INVALID_AMOUNT = "LEDGER_INVALID_AMOUNT",
  INVALID_ACCOUNT = "LEDGER_INVALID_ACCOUNT",
  INVALID_TENANT = "LEDGER_INVALID_TENANT",

  // Connection/storage errors
  CONNECTION_FAILED = "LEDGER_CONNECTION_FAILED",
  OPERATION_FAILED = "LEDGER_OPERATION_FAILED",
  TIMEOUT = "LEDGER_TIMEOUT",

  // Ledger unavailable error
  LEDGER_UNAVAILABLE = "LEDGER_UNAVAILABLE",
}

/**
 * Base ledger error class
 */
export class LedgerError extends Error {
  public readonly code: LedgerErrorCode;
  public readonly statusCode: number;
  public readonly context?: LogContext;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: LedgerErrorCode,
    statusCode: number = 500,
    context?: LogContext,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = "LedgerError";
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.isRetryable = isRetryable;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
      },
    };
  }
}

// ============================================================================
// Account Errors
// ============================================================================

export class AccountNotFoundError extends LedgerError {
  constructor(accountId: string, tenantId: string) {
    super(
      `Account not found: ${accountId}`,
      LedgerErrorCode.ACCOUNT_NOT_FOUND,
      404,
      { accountId, tenantId },
      false
    );
    this.name = "AccountNotFoundError";
  }
}

export class AccountAlreadyExistsError extends LedgerError {
  constructor(accountId: string, tenantId: string) {
    super(
      `Account already exists: ${accountId}`,
      LedgerErrorCode.ACCOUNT_ALREADY_EXISTS,
      409,
      { accountId, tenantId },
      false
    );
    this.name = "AccountAlreadyExistsError";
  }
}

export class InvalidAccountTypeError extends LedgerError {
  constructor(type: string) {
    super(
      `Invalid account type: ${type}`,
      LedgerErrorCode.ACCOUNT_TYPE_INVALID,
      400,
      { type },
      false
    );
    this.name = "InvalidAccountTypeError";
  }
}

// ============================================================================
// Transfer Errors
// ============================================================================

export class TransferNotFoundError extends LedgerError {
  constructor(transferId: string, tenantId: string) {
    super(
      `Transfer not found: ${transferId}`,
      LedgerErrorCode.TRANSFER_NOT_FOUND,
      404,
      { transferId, tenantId },
      false
    );
    this.name = "TransferNotFoundError";
  }
}

export class TransferAlreadyExistsError extends LedgerError {
  constructor(idempotencyKey: string, tenantId: string) {
    super(
      `Transfer already exists with idempotency key: ${idempotencyKey}`,
      LedgerErrorCode.TRANSFER_ALREADY_EXISTS,
      409,
      { idempotencyKey, tenantId },
      false
    );
    this.name = "TransferAlreadyExistsError";
  }
}

export class InvalidTransferStateError extends LedgerError {
  constructor(transferId: string, currentState: string, attemptedState: string) {
    super(
      `Cannot transition transfer ${transferId} from ${currentState} to ${attemptedState}`,
      LedgerErrorCode.TRANSFER_INVALID_STATE,
      400,
      { transferId, currentState, attemptedState },
      false
    );
    this.name = "InvalidTransferStateError";
  }
}

export class TransferReversalError extends LedgerError {
  constructor(transferId: string, reason: string, originalError?: string) {
    super(
      `Failed to reverse transfer ${transferId}: ${reason}`,
      LedgerErrorCode.TRANSFER_REVERSAL_FAILED,
      500,
      { transferId, reason, originalError },
      true
    );
    this.name = "TransferReversalError";
  }
}

export class IdempotencyKeyConflictError extends LedgerError {
  constructor(idempotencyKey: string, existingTransferId: string) {
    super(
      `Idempotency key ${idempotencyKey} already used by transfer ${existingTransferId}`,
      LedgerErrorCode.IDEMPOTENCY_KEY_CONFLICT,
      409,
      { idempotencyKey, existingTransferId },
      false
    );
    this.name = "IdempotencyKeyConflictError";
  }
}

// ============================================================================
// Balance Errors
// ============================================================================

export class InsufficientBalanceError extends LedgerError {
  constructor(
    accountId: string,
    availableBalance: number,
    requestedAmount: number,
    currency: string
  ) {
    super(
      `Insufficient balance in account ${accountId}: available ${availableBalance}, requested ${requestedAmount}`,
      LedgerErrorCode.INSUFFICIENT_BALANCE,
      400,
      { accountId, availableBalance, requestedAmount, currency },
      false
    );
    this.name = "InsufficientBalanceError";
  }
}

export class BalanceMismatchError extends LedgerError {
  constructor(accountId: string, expected: number, actual: number) {
    super(
      `Balance mismatch for account ${accountId}: expected ${expected}, actual ${actual}`,
      LedgerErrorCode.BALANCE_MISMATCH,
      500,
      { accountId, expected, actual },
      true
    );
    this.name = "BalanceMismatchError";
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class LedgerValidationError extends LedgerError {
  constructor(message: string, details?: LogContext) {
    super(message, LedgerErrorCode.VALIDATION_ERROR, 400, details, false);
    this.name = "LedgerValidationError";
  }
}

export class InvalidAmountError extends LedgerError {
  constructor(amount: number, reason: string) {
    super(
      `Invalid amount ${amount}: ${reason}`,
      LedgerErrorCode.INVALID_AMOUNT,
      400,
      { amount, reason },
      false
    );
    this.name = "InvalidAmountError";
  }
}

export class InvalidAccountError extends LedgerError {
  constructor(accountId: string, reason: string) {
    super(
      `Invalid account ${accountId}: ${reason}`,
      LedgerErrorCode.INVALID_ACCOUNT,
      400,
      { accountId, reason },
      false
    );
    this.name = "InvalidAccountError";
  }
}

export class InvalidTenantError extends LedgerError {
  constructor(tenantId: string, reason: string) {
    super(
      `Invalid tenant ${tenantId}: ${reason}`,
      LedgerErrorCode.INVALID_TENANT,
      400,
      { tenantId, reason },
      false
    );
    this.name = "InvalidTenantError";
  }
}

// ============================================================================
// Connection/Operation Errors
// ============================================================================

export class LedgerConnectionError extends LedgerError {
  constructor(cause: string) {
    super(
      `Ledger connection failed: ${cause}`,
      LedgerErrorCode.CONNECTION_FAILED,
      503,
      { cause },
      true
    );
    this.name = "LedgerConnectionError";
  }
}

export class LedgerOperationError extends LedgerError {
  constructor(operation: string, cause: string) {
    super(
      `Ledger operation failed: ${operation} - ${cause}`,
      LedgerErrorCode.OPERATION_FAILED,
      500,
      { operation, cause },
      true
    );
    this.name = "LedgerOperationError";
  }
}

export class LedgerTimeoutError extends LedgerError {
  constructor(operation: string, timeout: number) {
    super(
      `Ledger operation timed out: ${operation} after ${timeout}ms`,
      LedgerErrorCode.TIMEOUT,
      504,
      { operation, timeout },
      true
    );
    this.name = "LedgerTimeoutError";
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for LedgerError
 */
export function isLedgerError(error: unknown): error is LedgerError {
  return error instanceof LedgerError;
}

/**
 * Type guard for retryable errors
 */
export function isRetryableLedgerError(error: unknown): error is LedgerError {
  return isLedgerError(error) && error.isRetryable;
}
