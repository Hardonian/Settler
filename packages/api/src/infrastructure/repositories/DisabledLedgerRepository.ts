/**
 * Disabled Ledger Repository
 *
 * A fallback implementation that allows Settler to boot without TigerBeetle.
 * Returns typed errors for all mutating operations and empty/mock data for read operations.
 *
 * INVARIANTS:
 * - Never crashes - always returns typed errors or safe defaults
 * - isEnabled() returns false to indicate ledger is unavailable
 * - getReason() explains why ledger is disabled
 * - All mutating operations throw LedgerUnavailableError
 * - Read operations return empty results or zero balances
 */

import type {
  LedgerAccount,
  LedgerTransfer,
  LedgerBalance,
  TransferFilters,
  CreateLedgerAccountInput,
  CreateLedgerTransferInput,
  ReverseLedgerTransferInput,
  LedgerQueryResult,
} from "@settler/types";

import { ILedgerRepository } from "../../domain/repositories/ILedgerRepository";
import { LedgerError, LedgerErrorCode } from "../../domain/LedgerError";
import { logger } from "@settler/types";

// =============================================================================
// Disabled Ledger Error
// =============================================================================

/**
 * Error thrown when attempting to use disabled ledger
 */
export class LedgerUnavailableError extends LedgerError {
  constructor(reason: string) {
    super(
      `Ledger is unavailable: ${reason}`,
      LedgerErrorCode.LEDGER_UNAVAILABLE,
      503,
      { reason },
      true // isRetryable - could retry if ledger becomes available
    );
    this.name = "LedgerUnavailableError";
  }
}

// =============================================================================
// Disabled Ledger Repository
// =============================================================================

/**
 * Disabled Ledger Repository Implementation
 *
 * A safe fallback that allows the application to boot without TigerBeetle.
 * All operations gracefully degrade instead of crashing.
 */
export class DisabledLedgerRepository implements ILedgerRepository {
  private readonly reason: string;

  constructor(reason: string = "TigerBeetle is not enabled") {
    this.reason = reason;
    logger.warn("Ledger is disabled - using fallback implementation", { reason });
  }

  /**
   * Check if the ledger is enabled
   * Always returns false for disabled repository
   */
  isEnabled(): boolean {
    return false;
  }

  /**
   * Get the reason why the ledger is disabled
   */
  getReason(): string {
    return this.reason;
  }

  /**
   * Throw LedgerUnavailableError for mutating operations
   */
  private throwUnavailable(): never {
    throw new LedgerUnavailableError(this.reason);
  }

  // =============================================================================
  // Account Operations - All throw LedgerUnavailableError
  // =============================================================================

  async createAccount(_input: CreateLedgerAccountInput): Promise<LedgerAccount> {
    this.throwUnavailable();
  }

  async getAccount(_accountId: string, _tenantId: string): Promise<LedgerAccount | null> {
    // Return null for disabled ledger - account doesn't exist
    logger.debug("Ledger disabled - getAccount returning null", {
      reason: this.reason,
    });
    return null;
  }

  async getAccountByExternalId(
    _externalId: string,
    _tenantId: string
  ): Promise<LedgerAccount | null> {
    logger.debug("Ledger disabled - getAccountByExternalId returning null", {
      reason: this.reason,
    });
    return null;
  }

  async accountExists(_accountId: string, _tenantId: string): Promise<boolean> {
    // Return false - no accounts exist in disabled ledger
    return false;
  }

  async getAllAccounts(_tenantId: string): Promise<LedgerAccount[]> {
    // Return empty array - no accounts in disabled ledger
    logger.debug("Ledger disabled - getAllAccounts returning empty array");
    return [];
  }

  async getAccountsByType(_tenantId: string, _type: string): Promise<LedgerAccount[]> {
    // Return empty array - no accounts in disabled ledger
    return [];
  }

  // =============================================================================
  // Transfer Operations - All throw LedgerUnavailableError except get
  // =============================================================================

  async postTransfer(_input: CreateLedgerTransferInput): Promise<LedgerTransfer> {
    this.throwUnavailable();
  }

  async createPendingTransfer(_input: CreateLedgerTransferInput): Promise<LedgerTransfer> {
    this.throwUnavailable();
  }

  async postPendingTransfer(
    _transferId: string,
    _tenantId: string
  ): Promise<LedgerTransfer | null> {
    this.throwUnavailable();
  }

  async getTransfer(_transferId: string, _tenantId: string): Promise<LedgerTransfer | null> {
    // Return null - transfer doesn't exist
    logger.debug("Ledger disabled - getTransfer returning null", {
      reason: this.reason,
    });
    return null;
  }

  async getTransferByIdempotencyKey(
    _idempotencyKey: string,
    _tenantId: string
  ): Promise<LedgerTransfer | null> {
    // Return null - no transfers exist
    return null;
  }

  async listTransfers(_filters: TransferFilters): Promise<LedgerQueryResult<LedgerTransfer>> {
    // Return empty results
    logger.debug("Ledger disabled - listTransfers returning empty results");
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: _filters.limit || 50,
      hasMore: false,
    };
  }

  // =============================================================================
  // Balance Operations - Return zero balance
  // =============================================================================

  async getBalance(_accountId: string, _tenantId: string): Promise<LedgerBalance> {
    // Return zero balance - safe default
    logger.debug("Ledger disabled - getBalance returning zero balance");
    return {
      accountId: _accountId,
      tenantId: _tenantId,
      available: { value: 0, currency: "USD" },
      pending: { value: 0, currency: "USD" },
      settled: { value: 0, currency: "USD" },
      timestamp: new Date(),
    };
  }

  async getBalances(_accountIds: string[], _tenantId: string): Promise<LedgerBalance[]> {
    // Return zero balances for all requested accounts
    logger.debug("Ledger disabled - getBalances returning zero balances");
    return _accountIds.map((accountId) => ({
      accountId,
      tenantId: _tenantId,
      available: { value: 0, currency: "USD" },
      pending: { value: 0, currency: "USD" },
      settled: { value: 0, currency: "USD" },
      timestamp: new Date(),
    }));
  }

  // =============================================================================
  // Reversal Operations - Throw LedgerUnavailableError
  // =============================================================================

  async reverseTransfer(_input: ReverseLedgerTransferInput): Promise<LedgerTransfer> {
    this.throwUnavailable();
  }

  async getReversals(_originalTransferId: string, _tenantId: string): Promise<LedgerTransfer[]> {
    // Return empty array - no reversals exist
    return [];
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a DisabledLedgerRepository instance
 */
export function createDisabledLedgerRepository(reason?: string): DisabledLedgerRepository {
  return new DisabledLedgerRepository(reason);
}
