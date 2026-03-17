/**
 * Ledger Domain Types
 *
 * TypeScript types for the ledger port abstraction.
 * These types are shared across all packages and represent
 * the domain model for financial accounting.
 *
 * The interface is designed to be implementation-agnostic,
 * supporting future alternate implementations (TigerBeetle, Postgres, etc.)
 */

import type { Money } from "./index";

/**
 * Account Type -分类 of ledger accounts
 * Based on standard accounting principles (revenue, expense, asset, liability)
 */
export type AccountType = "revenue" | "expense" | "asset" | "liability";

/**
 * Transfer Status - lifecycle state of a transfer
 */
export type TransferStatus = "pending" | "posted" | "reversed" | "failed";

/**
 * Ledger Account
 * Represents a single account in the double-entry ledger
 */
export interface LedgerAccount {
  /** Unique identifier for the account */
  id: string;
  /** Tenant/workspace identifier for isolation */
  tenantId: string;
  /** Human-readable name of the account */
  name: string;
  /** Account classification (revenue, expense, asset, liability) */
  type: AccountType;
  /** Current balance (sum of all posted credits minus debits) */
  balance: Money;
  /** Additional metadata for the account */
  metadata?: Record<string, unknown>;
  /** Timestamp when the account was created */
  createdAt: Date;
  /** Timestamp when the account was last modified */
  updatedAt: Date;
}

/**
 * Ledger Transfer
 * Represents a double-entry transaction between two accounts
 * Uses idempotency keys to ensure exactly-once processing
 */
export interface LedgerTransfer {
  /** Unique identifier for the transfer */
  id: string;
  /** Tenant/workspace identifier for isolation */
  tenantId: string;
  /** Account being debited (money leaving) */
  debitAccountId: string;
  /** Account being credited (money entering) */
  creditAccountId: string;
  /** Transfer amount */
  amount: Money;
  /** Current status of the transfer */
  status: TransferStatus;
  /** Idempotency key to prevent duplicate transfers */
  idempotencyKey: string;
  /** Optional reference to external transaction */
  externalId?: string;
  /** Additional metadata for the transfer */
  metadata?: Record<string, unknown>;
  /** Timestamp when the transfer was created */
  createdAt: Date;
  /** Timestamp when the transfer was last modified */
  updatedAt: Date;
  /** Timestamp when the transfer was posted (if applicable) */
  postedAt?: Date;
  /** Reason for reversal (if applicable) */
  reversalReason?: string;
  /** ID of the reversal transfer (if applicable) */
  reversedByTransferId?: string;
}

/**
 * Ledger Balance
 * Snapshot of account balances at a point in time
 */
export interface LedgerBalance {
  /** Account identifier */
  accountId: string;
  /** Tenant/workspace identifier */
  tenantId: string;
  /** Total balance (posted + pending) */
  balance: Money;
  /** Balance from pending transfers */
  pendingBalance: Money;
  /** Balance from posted transfers only */
  settledBalance: Money;
  /** Timestamp when balance was calculated */
  asOf: Date;
}

/**
 * Transfer Filters
 * Criteria for querying transfers
 */
export interface TransferFilters {
  /** Filter by tenant ID (required for isolation) */
  tenantId: string;
  /** Filter by debit account ID */
  debitAccountId?: string;
  /** Filter by credit account ID */
  creditAccountId?: string;
  /** Filter by transfer status */
  status?: TransferStatus;
  /** Filter by external ID */
  externalId?: string;
  /** Filter by idempotency key */
  idempotencyKey?: string;
  /** Filter by date range - start date */
  dateFrom?: Date;
  /** Filter by date range - end date */
  dateTo?: Date;
  /** Pagination - page number (1-indexed) */
  page?: number;
  /** Pagination - items per page */
  limit?: number;
}

/**
 * Create Account Input
 * Input type for creating a new ledger account
 */
export interface CreateLedgerAccountInput {
  /** Unique identifier for the account */
  id?: string; // Optional - can be generated
  /** Tenant/workspace identifier */
  tenantId: string;
  /** Human-readable name */
  name: string;
  /** Account classification */
  type: AccountType;
  /** Optional initial metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Create Transfer Input
 * Input type for creating a new transfer
 */
export interface CreateLedgerTransferInput {
  /** Unique identifier for the transfer */
  id?: string; // Optional - can be generated
  /** Tenant/workspace identifier */
  tenantId: string;
  /** Account being debited */
  debitAccountId: string;
  /** Account being credited */
  creditAccountId: string;
  /** Transfer amount */
  amount: Money;
  /** Idempotency key (required) */
  idempotencyKey: string;
  /** Optional external reference */
  externalId?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Reverse Transfer Input
 * Input type for reversing a transfer
 */
export interface ReverseLedgerTransferInput {
  /** Transfer ID to reverse */
  transferId: string;
  /** Tenant/workspace identifier */
  tenantId: string;
  /** Reason for reversal */
  reason: string;
}

/**
 * Ledger Query Result
 * Paginated result for ledger queries
 */
export interface LedgerQueryResult<T> {
  /** Array of results */
  items: T[];
  /** Total count matching query */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Whether there are more pages */
  hasMore: boolean;
}
