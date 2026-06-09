/**
 * Ledger Repository Interface
 * Defines data access contract for ledger operations
 *
 * This port provides an abstraction over the underlying ledger implementation
 * (e.g., TigerBeetle, PostgreSQL) and is suitable for:
 * - Swappable implementations (feature flags, fallbacks)
 * - Testing with mock implementations
 * - Future alternate backends
 *
 * INVARIANTS:
 * - All methods require tenantId to enforce tenant isolation
 * - Idempotency keys are required for all transfer operations to prevent duplicates
 * - This interface does NOT leak implementation-specific details (e.g., TigerBeetle IDs)
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

/**
 * Ledger Repository Port
 * Abstraction for ledger data access operations
 */
export interface ILedgerRepository {
  /**
   * Create a new ledger account
   * @param input - Account creation input
   * @returns Created ledger account with generated ID and timestamps
   */
  createAccount(input: CreateLedgerAccountInput): Promise<LedgerAccount>;

  /**
   * Get an account by ID
   * @param accountId - Account ID
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Account or null if not found
   */
  getAccount(accountId: string, tenantId: string): Promise<LedgerAccount | null>;

  /**
   * Get account by external reference
   * @param externalId - External reference ID
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Account or null if not found
   */
  getAccountByExternalId(externalId: string, tenantId: string): Promise<LedgerAccount | null>;

  /**
   * Post a transfer (create and immediately post)
   * Uses idempotency key to ensure exactly-once processing
   * @param input - Transfer creation input
   * @returns Posted transfer with status 'posted'
   */
  postTransfer(input: CreateLedgerTransferInput): Promise<LedgerTransfer>;

  /**
   * Create a pending transfer
   * @param input - Transfer creation input
   * @returns Transfer with status 'pending'
   */
  createPendingTransfer(input: CreateLedgerTransferInput): Promise<LedgerTransfer>;

  /**
   * Post a pending transfer
   * @param transferId - Transfer ID to post
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Posted transfer or null if not found
   */
  postPendingTransfer(transferId: string, tenantId: string): Promise<LedgerTransfer | null>;

  /**
   * Void a pending transfer
   * @param transferId - Transfer ID to void
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Voided transfer or null if not found
   */
  voidPendingTransfer(transferId: string, tenantId: string): Promise<LedgerTransfer | null>;

  /**
   * Get a transfer by ID
   * @param transferId - Transfer ID
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Transfer or null if not found
   */
  getTransfer(transferId: string, tenantId: string): Promise<LedgerTransfer | null>;

  /**
   * Get transfer by idempotency key
   * Used for idempotent retry handling
   * @param idempotencyKey - Idempotency key
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Existing transfer or null if not found
   */
  getTransferByIdempotencyKey(
    idempotencyKey: string,
    tenantId: string
  ): Promise<LedgerTransfer | null>;

  /**
   * List transfers with filtering and pagination
   * @param filters - Query filters
   * @returns Paginated transfer results
   */
  listTransfers(filters: TransferFilters): Promise<LedgerQueryResult<LedgerTransfer>>;

  /**
   * Get balance for an account
   * @param accountId - Account ID
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Current balance snapshot
   */
  getBalance(accountId: string, tenantId: string): Promise<LedgerBalance>;

  /**
   * Get multiple balances in a single call
   * @param accountIds - Array of account IDs
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Array of balance snapshots
   */
  getBalances(accountIds: string[], tenantId: string): Promise<LedgerBalance[]>;

  /**
   * Reverse a transfer
   * Creates a reversal transfer linked to the original
   * @param input - Reversal input
   * @returns Reversal transfer with status 'posted'
   */
  reverseTransfer(input: ReverseLedgerTransferInput): Promise<LedgerTransfer>;

  /**
   * Get all transfers that reverse a given transfer
   * @param originalTransferId - Original transfer ID
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Array of reversal transfers
   */
  getReversals(originalTransferId: string, tenantId: string): Promise<LedgerTransfer[]>;

  /**
   * Check if an account exists
   * @param accountId - Account ID
   * @param tenantId - Tenant ID (required for isolation)
   * @returns True if account exists
   */
  accountExists(accountId: string, tenantId: string): Promise<boolean>;

  /**
   * Get all accounts for a tenant
   * @param tenantId - Tenant ID (required for isolation)
   * @returns Array of all accounts in the tenant
   */
  getAllAccounts(tenantId: string): Promise<LedgerAccount[]>;

  /**
   * Get accounts by type for a tenant
   * @param tenantId - Tenant ID (required for isolation)
   * @param type - Account type filter
   * @returns Array of matching accounts
   */
  getAccountsByType(tenantId: string, type: string): Promise<LedgerAccount[]>;

  /**
   * Check if the ledger is enabled and available
   * @returns true if ledger is available, false otherwise
   */
  isEnabled(): boolean;

  /**
   * Get the reason why the ledger is disabled (or empty if enabled)
   * @returns Reason string explaining ledger state
   */
  getReason(): string;

  /**
   * Perform an active health check/ping on the ledger
   * @returns true if ledger responds, false otherwise
   */
  ping(): Promise<boolean>;

  /**
   * Close and cleanup ledger connections
   * Should be called during application shutdown for graceful disconnection
   * @returns Promise that resolves when cleanup is complete
   */
  close(): Promise<void>;
}

/**
 * Factory function type for creating ledger repository instances
 */
export type LedgerRepositoryFactory = () => ILedgerRepository | Promise<ILedgerRepository>;
