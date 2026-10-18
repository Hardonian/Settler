/**
 * TigerBeetle Ledger Repository Implementation
 *
 * Implements ILedgerRepository using TigerBeetle as the underlying storage.
 * Provides double-entry ledger semantics with full tenant isolation.
 *
 * INVARIANTS:
 * - All operations are scoped by tenantId (tenant isolation)
 * - Idempotency keys prevent duplicate transfers
 * - Deterministic account ID mapping: hash(tenantId + accountType) for internal accounts
 * - All amounts are stored as int128 (cents/smallest unit) for precision
 */

import {
  createClient,
  type Client,
  type Account,
  type Transfer,
  AccountFlags,
  TransferFlags,
  CreateAccountStatus,
  CreateTransferStatus,
} from "tigerbeetle-node";
import { createHash } from "node:crypto";

import type {
  LedgerAccount,
  LedgerTransfer,
  LedgerBalance,
  TransferFilters,
  CreateLedgerAccountInput,
  CreateLedgerTransferInput,
  ReverseLedgerTransferInput,
  LedgerQueryResult,
  AccountType,
  TransferStatus,
  Money,
} from "@settler/types";

import { ILedgerRepository } from "../../domain/repositories/ILedgerRepository";
import {
  LedgerError,
  AccountAlreadyExistsError,
  AccountNotFoundError,
  TransferNotFoundError,
  InvalidTransferStateError,
  LedgerConnectionError,
  LedgerOperationError,
  LedgerTimeoutError,
} from "../../domain/LedgerError";
import { logger } from "@settler/types";
import { createCircuitBreaker } from "../../utils/circuit-breakers";

// =============================================================================
// Configuration
// =============================================================================

interface TigerBeetleConfig {
  address: string;
  concurrencyMax?: number;
  clusterId?: number;
  timeout?: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert decimal amount to TigerBeetle's int128 (cents/smallest unit)
 */
function toTigerBeetleAmount(value: number, _currency: string): bigint {
  if (!Number.isFinite(value) || value < 0) {
    throw new LedgerOperationError("amount", "Amount must be a finite non-negative number");
  }
  const decimal = value.toFixed(2);
  if (Number(decimal) !== value) {
    throw new LedgerOperationError("amount", "Amount must have at most two decimal minor units");
  }
  const [whole = "0", fraction = "00"] = decimal.split(".");
  const minorUnits = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (minorUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new LedgerOperationError("amount", "Amount exceeds safe public input bounds");
  }
  return minorUnits;
}

/**
 * Convert TigerBeetle's int128 back to decimal
 */
function fromTigerBeetleAmount(amount: bigint, _currency: string): number {
  if (amount > BigInt(Number.MAX_SAFE_INTEGER) || amount < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new LedgerOperationError(
      "amount",
      "Ledger amount exceeds the safe numeric range of the public Money contract"
    );
  }
  return Number(amount) / 100;
}

function hashToUint128(domain: string, value: string): bigint {
  const digest = createHash("sha256")
    .update(domain, "utf8")
    .update("\0")
    .update(value, "utf8")
    .digest();
  return BigInt(`0x${digest.subarray(0, 16).toString("hex")}`) || 1n;
}

function tenantFingerprint(tenantId: string): bigint {
  return hashToUint128("settler:tigerbeetle:tenant:v1", tenantId);
}

/**
 * Generate a deterministic account ID from tenantId and account type/name
 *
 * The full 128-bit identifier is derived with SHA-256 domain separation. Tenant
 * ownership is independently committed in TigerBeetle's user_data_128 field and
 * verified on every lookup; the identifier alone is never treated as authorization.
 */
function generateAccountId(tenantId: string, accountType: string, name?: string): bigint {
  return hashToUint128(
    "settler:tigerbeetle:account:v1",
    `${tenantId}\0${accountType}\0${name ?? ""}`
  );
}

/**
 * Generate a transfer ID from idempotency key
 */
function generateTransferId(idempotencyKey: string, tenantId: string): bigint {
  return hashToUint128("settler:tigerbeetle:transfer:v1", `${tenantId}\0${idempotencyKey}`);
}

/**
 * Convert bigint to UUID-like string for external representation
 */
function bigintToString(id: bigint): string {
  const hex = id.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Parse string back to bigint
 */
function stringToBigint(str: string): bigint {
  const hex = str.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
    throw new LedgerOperationError("identifier", "Expected a 128-bit UUID-formatted identifier");
  }
  const value = BigInt(`0x${hex}`);
  if (value === 0n) {
    throw new LedgerOperationError("identifier", "TigerBeetle identifiers must be non-zero");
  }
  return value;
}

/**
 * Map account type to TigerBeetle account code
 */
function accountTypeToCode(type: AccountType): number {
  const codes: Record<AccountType, number> = {
    asset: 1,
    liability: 2,
    revenue: 3,
    expense: 4,
  };
  return codes[type] || 1; // Default to 1 (Asset) if unknown
}

/**
 * Map account code back to account type
 */
function codeToAccountType(code: number): AccountType {
  const types: Record<number, AccountType> = {
    1: "asset",
    2: "liability",
    3: "revenue",
    4: "expense",
  };
  return types[code] || "asset";
}

// =============================================================================
// Repository Implementation
// =============================================================================

export class TigerBeetleLedgerRepository implements ILedgerRepository {
  private client: Client | null = null;
  private readonly config: TigerBeetleConfig;
  private initialized = false;
  private initError: string | null = null;
  private executeBreaker = createCircuitBreaker(
    async (fn: () => Promise<any>) => {
      return await fn();
    },
    {
      name: "tigerbeetle-ledger",
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 15000,
    }
  );

  constructor(config?: Partial<TigerBeetleConfig>) {
    this.config = {
      address: config?.address || process.env.TIGERBEETLE_ADDRESS || "127.0.0.1:4300",
      concurrencyMax: config?.concurrencyMax || 32,
      clusterId: config?.clusterId || 0,
      timeout: config?.timeout || 5000,
    };
  }

  private async ensureInitialized(): Promise<Client> {
    if (this.client && this.initialized) {
      return this.client;
    }

    try {
      this.client = await createClient({
        cluster_id: BigInt(this.config.clusterId || 0),
        replica_addresses: [this.config.address],
      });
      this.initialized = true;
      this.initError = null;
      logger.info("TigerBeetle client initialized", { address: this.config.address });
      return this.client;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.initError = message;
      logger.error("Failed to initialize TigerBeetle client", { error: message });
      throw new LedgerConnectionError(message);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        this.client.destroy();
        this.client = null;
        this.initialized = false;
        logger.info("TigerBeetle client destroyed");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error destroying TigerBeetle client", { error: message });
        throw new LedgerOperationError("close", message);
      }
    }
  }

  isEnabled(): boolean {
    // If explicitly disabled in env, return false
    if (process.env.TIGERBEETLE_ENABLED === "false") return false;
    // Otherwise, it's considered enabled if we haven't hit a fatal init error
    return this.initError === null;
  }

  getReason(): string {
    if (this.initError) {
      return `TigerBeetle initialization failed: ${this.initError}`;
    }
    if (this.initialized && this.client) {
      return "TigerBeetle is enabled and connected";
    }
    return "TigerBeetle is enabled (not yet initialized)";
  }

  async ping(): Promise<boolean> {
    try {
      const client = await this.ensureInitialized();
      await this.executeBreaker.fire(async () => {
        await client.lookupAccounts([0n]);
      });
      return true;
    } catch {
      return false;
    }
  }

  // =============================================================================
  // Account Operations
  // =============================================================================

  async createAccount(input: CreateLedgerAccountInput): Promise<LedgerAccount> {
    return this.executeWithBreaker("createAccount", async () => {
      const client = await this.ensureInitialized();
      const accountId = input.id
        ? stringToBigint(input.id)
        : generateAccountId(input.tenantId, input.type, input.name);

      // Check if account already exists
      const existing = await this.getAccountById(accountId, input.tenantId);
      if (existing) {
        throw new AccountAlreadyExistsError(input.id || bigintToString(accountId), input.tenantId);
      }

      const now = new Date();
      const account: Account = {
        id: accountId,
        code: accountTypeToCode(input.type),
        ledger: 1,
        reserved: 0,
        debits_posted: 0n,
        credits_posted: 0n,
        debits_pending: 0n,
        credits_pending: 0n,
        user_data_128: tenantFingerprint(input.tenantId),
        user_data_64: BigInt(0),
        user_data_32: 0,
        timestamp: 0n,
        flags: AccountFlags.none,
      };

      const results = await client.createAccounts([account]);
      const result = results[0];
      if (!result || result.status !== CreateAccountStatus.created) {
        throw new LedgerOperationError(
          "createAccount",
          `TigerBeetle error code: ${result?.status ?? "missing result"}`
        );
      }

      return {
        id: bigintToString(accountId),
        tenantId: input.tenantId,
        name: input.name,
        type: input.type,
        balance: { value: 0, currency: "USD" },
        metadata: input.metadata,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  async getAccount(accountId: string, tenantId: string): Promise<LedgerAccount | null> {
    return this.getAccountById(stringToBigint(accountId), tenantId);
  }

  private async getAccountById(accountId: bigint, tenantId: string): Promise<LedgerAccount | null> {
    return this.executeWithBreaker("getAccountById", async () => {
      const client = await this.ensureInitialized();
      const accounts = await client.lookupAccounts([accountId]);

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        return null;
      }

      const account = accounts[0];
      if (account.user_data_128 !== tenantFingerprint(tenantId)) {
        return null;
      }
      const type = codeToAccountType(account.code);

      let balance: Money;
      if (type === "asset" || type === "expense") {
        balance = {
          value: fromTigerBeetleAmount(account.debits_posted - account.credits_posted, "USD"),
          currency: "USD",
        };
      } else {
        balance = {
          value: fromTigerBeetleAmount(account.credits_posted - account.debits_posted, "USD"),
          currency: "USD",
        };
      }

      return {
        id: bigintToString(account.id),
        tenantId,
        name: "",
        type,
        balance,
        createdAt: new Date(Number(account.timestamp) / 1_000_000),
        updatedAt: new Date(Number(account.timestamp) / 1_000_000),
      };
    });
  }

  async getAccountByExternalId(
    _externalId: string,
    _tenantId: string
  ): Promise<LedgerAccount | null> {
    logger.warn("getAccountByExternalId not fully implemented - requires external index");
    return null;
  }

  async accountExists(accountId: string, tenantId: string): Promise<boolean> {
    const account = await this.getAccount(accountId, tenantId);
    return account !== null;
  }

  async getAllAccounts(tenantId: string): Promise<LedgerAccount[]> {
    // TigerBeetle does not support listing all accounts directly.
    // Throwing an error to prevent silent data loss - empty results
    // could be misinterpreted as "tenant has no accounts".
    throw new LedgerOperationError(
      "getAllAccounts",
      `Cannot list all accounts for tenant ${tenantId}: TigerBeetle does not support direct account listing. Use getAccount() with specific IDs or maintain a relational index.`
    );
  }

  async getAccountsByType(tenantId: string, type: string): Promise<LedgerAccount[]> {
    // TigerBeetle does not support filtered listing of accounts.
    // Throwing an error to prevent silent data loss - empty results
    // could be misinterpreted as "no accounts of this type exist".
    throw new LedgerOperationError(
      "getAccountsByType",
      `Cannot list accounts of type "${type}" for tenant ${tenantId}: TigerBeetle does not support filtered account listing. Use getAccount() with specific IDs or maintain a relational index.`
    );
  }

  // =============================================================================
  // Transfer Operations
  // =============================================================================

  async postTransfer(input: CreateLedgerTransferInput): Promise<LedgerTransfer> {
    return this.createTransfer(input, true);
  }

  async createPendingTransfer(input: CreateLedgerTransferInput): Promise<LedgerTransfer> {
    return this.createTransfer(input, false);
  }

  private async createTransfer(
    input: CreateLedgerTransferInput,
    postImmediately: boolean
  ): Promise<LedgerTransfer> {
    return this.executeWithBreaker("createTransfer", async () => {
      const client = await this.ensureInitialized();
      const existing = await this.getTransferByIdempotencyKey(input.idempotencyKey, input.tenantId);
      if (existing) {
        return existing;
      }

      const transferId = input.id
        ? stringToBigint(input.id)
        : generateTransferId(input.idempotencyKey, input.tenantId);

      const debitAccountId = stringToBigint(input.debitAccountId);
      const creditAccountId = stringToBigint(input.creditAccountId);
      if (debitAccountId === creditAccountId) {
        throw new LedgerOperationError(
          "createTransfer",
          "Debit and credit accounts must be distinct"
        );
      }

      const accounts = await client.lookupAccounts([debitAccountId, creditAccountId]);
      const fingerprint = tenantFingerprint(input.tenantId);
      if (
        accounts.length !== 2 ||
        accounts.some((account) => account.user_data_128 !== fingerprint)
      ) {
        throw new LedgerOperationError(
          "createTransfer",
          "Debit and credit accounts must both belong to the authenticated tenant"
        );
      }

      const now = new Date();
      const transfer: Transfer = {
        id: transferId,
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        amount: toTigerBeetleAmount(input.amount.value, input.amount.currency),
        pending_id: 0n,
        timeout: 0,
        ledger: 1,
        code: 1,
        flags: postImmediately ? TransferFlags.none : TransferFlags.pending,
        user_data_128: fingerprint,
        user_data_64: BigInt(0),
        user_data_32: 0,
        timestamp: 0n,
      };

      const results = await client.createTransfers([transfer]);
      const result = results[0];
      if (
        !result ||
        (result.status !== CreateTransferStatus.created &&
          result.status !== CreateTransferStatus.exists)
      ) {
        throw new LedgerOperationError(
          "createTransfer",
          `TigerBeetle error code: ${result?.status ?? "missing result"}`
        );
      }

      return {
        id: bigintToString(transferId),
        tenantId: input.tenantId,
        debitAccountId: input.debitAccountId,
        creditAccountId: input.creditAccountId,
        amount: input.amount,
        status: postImmediately ? "posted" : "pending",
        idempotencyKey: input.idempotencyKey,
        externalId: input.externalId,
        metadata: input.metadata,
        createdAt: now,
        updatedAt: now,
        postedAt: postImmediately ? now : undefined,
      };
    });
  }

  // Removed duplicate implementations

  private mapTransferToDomain(transfer: Transfer): LedgerTransfer {
    let status: TransferStatus = "pending";
    if (transfer.flags & TransferFlags.pending) {
      status = "pending";
    } else if (transfer.flags & TransferFlags.void_pending_transfer) {
      status = "reversed";
    } else {
      status = "posted";
    }

    const timestamp = Number(transfer.timestamp) / 1_000_000;

    return {
      id: bigintToString(transfer.id),
      tenantId: "",
      debitAccountId: bigintToString(transfer.debit_account_id),
      creditAccountId: bigintToString(transfer.credit_account_id),
      amount: {
        value: fromTigerBeetleAmount(transfer.amount, "USD"),
        currency: "USD",
      },
      status,
      idempotencyKey: "",
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
      postedAt: status === "posted" ? new Date(timestamp) : undefined,
    };
  }

  async listTransfers(filters: TransferFilters): Promise<LedgerQueryResult<LedgerTransfer>> {
    return this.executeWithBreaker("listTransfers", async () => {
      const client = await this.ensureInitialized();
      if (!client) throw new Error("TigerBeetle client not initialized");

      const limit = filters.limit || 50;
      const accountId = filters.accountId;

      if (!accountId) {
        logger.warn(
          "listTransfers: Querying without accountId is not supported by TigerBeetle directly."
        );
        return { items: [], total: 0, page: filters.page || 1, limit, hasMore: false };
      }
      const scopedAccount = await client.lookupAccounts([stringToBigint(accountId)]);
      if (
        !scopedAccount[0] ||
        scopedAccount[0].user_data_128 !== tenantFingerprint(filters.tenantId)
      ) {
        throw new AccountNotFoundError(accountId, filters.tenantId);
      }
      const transfers = await client.getAccountTransfers({
        account_id: stringToBigint(accountId),
        user_data_128: 0n,
        user_data_64: 0n,
        user_data_32: 0,
        code: 0,
        timestamp_min: 0n,
        timestamp_max: 0n,
        limit,
        flags: 0,
      });

      const fingerprint = tenantFingerprint(filters.tenantId);
      const items: LedgerTransfer[] = transfers
        .filter((transfer) => transfer.user_data_128 === fingerprint)
        .map((t) => ({
          id: bigintToString(t.id),
          debitAccountId: bigintToString(t.debit_account_id),
          creditAccountId: bigintToString(t.credit_account_id),
          amount: {
            value: fromTigerBeetleAmount(t.amount, "USD"),
            currency: "USD",
          },
          status:
            t.flags & TransferFlags.pending
              ? "pending"
              : t.flags & TransferFlags.void_pending_transfer
                ? "reversed"
                : "posted",
          idempotencyKey: "",
          externalId: "",
          metadata: {
            code: t.code,
            ledger: t.ledger,
          },
          createdAt: new Date(Number(t.timestamp) / 1_000_000),
          updatedAt: new Date(Number(t.timestamp) / 1_000_000),
          postedAt: new Date(Number(t.timestamp) / 1_000_000),
          tenantId: filters.tenantId,
        }));

      return {
        items,
        total: items.length, // Exact total not known without external index
        page: filters.page || 1,
        limit,
        hasMore: items.length === limit,
      };
    });
  }

  // =============================================================================
  // Balance Operations
  // =============================================================================

  async getBalance(accountId: string, tenantId: string): Promise<LedgerBalance> {
    return this.executeWithBreaker("getBalance", async () => {
      const client = await this.ensureInitialized();
      const tbAccountId = stringToBigint(accountId);
      const accounts = await client.lookupAccounts([tbAccountId]);

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        throw new AccountNotFoundError(accountId, tenantId);
      }

      const account = accounts[0];
      if (account.user_data_128 !== tenantFingerprint(tenantId)) {
        throw new AccountNotFoundError(accountId, tenantId);
      }
      const type = codeToAccountType(account.code);

      let balance: number;
      let settledBalance: number;
      let pendingBalance: number;

      if (type === "asset" || type === "expense") {
        balance = fromTigerBeetleAmount(
          account.debits_posted +
            account.debits_pending -
            account.credits_posted -
            account.credits_pending,
          "USD"
        );
        settledBalance = fromTigerBeetleAmount(
          account.debits_posted - account.credits_posted,
          "USD"
        );
        pendingBalance = fromTigerBeetleAmount(
          account.debits_pending - account.credits_pending,
          "USD"
        );
      } else {
        balance = fromTigerBeetleAmount(
          account.credits_posted +
            account.credits_pending -
            account.debits_posted -
            account.debits_pending,
          "USD"
        );
        settledBalance = fromTigerBeetleAmount(
          account.credits_posted - account.debits_posted,
          "USD"
        );
        pendingBalance = fromTigerBeetleAmount(
          account.credits_pending - account.debits_pending,
          "USD"
        );
      }

      return {
        accountId,
        tenantId,
        balance: { value: balance, currency: "USD" },
        pendingBalance: { value: pendingBalance, currency: "USD" },
        settledBalance: { value: settledBalance, currency: "USD" },
        asOf: new Date(),
      };
    });
  }

  async getBalances(accountIds: string[], tenantId: string): Promise<LedgerBalance[]> {
    return this.executeWithBreaker("getBalances", async () => {
      const client = await this.ensureInitialized();
      const tbAccountIds = accountIds.map(stringToBigint);
      const accounts = await client.lookupAccounts(tbAccountIds);
      const fingerprint = tenantFingerprint(tenantId);

      const balances: LedgerBalance[] = [];

      for (const accountId of accountIds) {
        const account = accounts.find((a) => bigintToString(a.id) === accountId);

        if (account?.user_data_128 === fingerprint) {
          const type = codeToAccountType(account.code);
          let balance: number;

          if (type === "asset" || type === "expense") {
            balance = fromTigerBeetleAmount(account.debits_posted - account.credits_posted, "USD");
          } else {
            balance = fromTigerBeetleAmount(account.credits_posted - account.debits_posted, "USD");
          }

          balances.push({
            accountId,
            tenantId,
            balance: { value: balance, currency: "USD" },
            pendingBalance: { value: 0, currency: "USD" },
            settledBalance: { value: balance, currency: "USD" },
            asOf: new Date(),
          });
        } else {
          throw new AccountNotFoundError(accountId, tenantId);
        }
      }

      return balances;
    });
  }

  // =============================================================================
  // Reversal Operations
  // =============================================================================

  async reverseTransfer(input: ReverseLedgerTransferInput): Promise<LedgerTransfer> {
    return this.executeWithBreaker("reverseTransfer", async () => {
      const client = await this.ensureInitialized();
      const originalTransferId = stringToBigint(input.transferId);
      const originalTransfers = await client.lookupTransfers([originalTransferId]);

      if (!originalTransfers || originalTransfers.length === 0 || !originalTransfers[0]) {
        throw new TransferNotFoundError(input.transferId, input.tenantId);
      }

      const original = originalTransfers[0];
      if (original.user_data_128 !== tenantFingerprint(input.tenantId)) {
        throw new TransferNotFoundError(input.transferId, input.tenantId);
      }

      const isPending = Boolean(original.flags & TransferFlags.pending);
      const reversalId = generateTransferId(
        `${isPending ? "void" : "reversal"}-${input.transferId}`,
        input.tenantId
      );
      const now = new Date();

      const reversalTransfer: Transfer = {
        id: reversalId,
        debit_account_id: isPending ? original.debit_account_id : original.credit_account_id,
        credit_account_id: isPending ? original.credit_account_id : original.debit_account_id,
        amount: isPending ? 0n : original.amount,
        pending_id: isPending ? originalTransferId : 0n,
        timeout: 0,
        ledger: 1,
        code: 1,
        flags: isPending ? TransferFlags.void_pending_transfer : TransferFlags.none,
        user_data_128: tenantFingerprint(input.tenantId),
        user_data_64: BigInt(0),
        user_data_32: 0,
        timestamp: 0n,
      };

      const results = await client.createTransfers([reversalTransfer]);
      const result = results[0];
      if (
        !result ||
        (result.status !== CreateTransferStatus.created &&
          result.status !== CreateTransferStatus.exists)
      ) {
        throw new LedgerOperationError(
          "reverseTransfer",
          `TigerBeetle error code: ${result?.status ?? "missing result"}`
        );
      }

      return {
        id: bigintToString(reversalId),
        tenantId: input.tenantId,
        debitAccountId: bigintToString(reversalTransfer.debit_account_id),
        creditAccountId: bigintToString(reversalTransfer.credit_account_id),
        amount: {
          value: fromTigerBeetleAmount(original.amount, "USD"),
          currency: "USD",
        },
        status: "reversed",
        idempotencyKey: `${isPending ? "void" : "reversal"}-${input.transferId}`,
        reversalReason: input.reason,
        reversedByTransferId: input.transferId,
        createdAt: now,
        updatedAt: now,
        postedAt: now,
      };
    });
  }

  async getReversals(originalTransferId: string, _tenantId: string): Promise<LedgerTransfer[]> {
    logger.warn(
      `getReversals(${originalTransferId}): Finding reversals requires external indexing.`
    );
    return [];
  }

  async postPendingTransfer(transferId: string, tenantId: string): Promise<LedgerTransfer | null> {
    return this.executeWithBreaker("postPendingTransfer", async () => {
      const client = await this.ensureInitialized();
      const tbTransferId = stringToBigint(transferId);
      const transfers = await client.lookupTransfers([tbTransferId]);

      if (!transfers || transfers.length === 0 || !transfers[0]) {
        return null;
      }

      const original = transfers[0];
      if (original.user_data_128 !== tenantFingerprint(tenantId)) {
        return null;
      }
      if (!(original.flags & TransferFlags.pending)) {
        throw new InvalidTransferStateError(transferId, "posted", "pending");
      }

      const now = new Date();
      const postTransfer: Transfer = {
        ...original,
        id: generateTransferId(`post-${transferId}`, tenantId),
        pending_id: tbTransferId,
        flags: TransferFlags.post_pending_transfer,
        timestamp: 0n,
      };

      const results = await client.createTransfers([postTransfer]);
      const result = results[0];
      if (
        !result ||
        (result.status !== CreateTransferStatus.created &&
          result.status !== CreateTransferStatus.exists)
      ) {
        throw new LedgerOperationError(
          "postPendingTransfer",
          `TB Error: ${result?.status ?? "missing result"}`
        );
      }

      return {
        id: bigintToString(postTransfer.id),
        tenantId,
        debitAccountId: bigintToString(original.debit_account_id),
        creditAccountId: bigintToString(original.credit_account_id),
        amount: {
          value: fromTigerBeetleAmount(original.amount, "USD"),
          currency: "USD",
        },
        status: "posted",
        idempotencyKey: `post-${transferId}`,
        createdAt: now,
        updatedAt: now,
        postedAt: now,
      };
    });
  }

  async voidPendingTransfer(transferId: string, tenantId: string): Promise<LedgerTransfer | null> {
    return this.executeWithBreaker("voidPendingTransfer", async () => {
      const client = await this.ensureInitialized();
      const tbTransferId = stringToBigint(transferId);
      const transfers = await client.lookupTransfers([tbTransferId]);

      if (!transfers || transfers.length === 0 || !transfers[0]) {
        return null;
      }

      const original = transfers[0];
      if (original.user_data_128 !== tenantFingerprint(tenantId)) {
        return null;
      }
      if (!(original.flags & TransferFlags.pending)) {
        throw new InvalidTransferStateError(transferId, "voided", "pending");
      }

      const now = new Date();
      const voidTransfer: Transfer = {
        ...original,
        id: generateTransferId(`void-${transferId}`, tenantId),
        amount: 0n,
        pending_id: tbTransferId,
        flags: TransferFlags.void_pending_transfer,
        timestamp: 0n,
      };

      const results = await client.createTransfers([voidTransfer]);
      const result = results[0];
      if (
        !result ||
        (result.status !== CreateTransferStatus.created &&
          result.status !== CreateTransferStatus.exists)
      ) {
        throw new LedgerOperationError(
          "voidPendingTransfer",
          `TB Error: ${result?.status ?? "missing result"}`
        );
      }

      return {
        id: bigintToString(voidTransfer.id),
        tenantId,
        debitAccountId: bigintToString(original.debit_account_id),
        creditAccountId: bigintToString(original.credit_account_id),
        amount: {
          value: fromTigerBeetleAmount(original.amount, "USD"),
          currency: "USD",
        },
        status: "reversed",
        idempotencyKey: `void-${transferId}`,
        createdAt: now,
        updatedAt: now,
        postedAt: now,
      };
    });
  }

  async getTransfer(transferId: string, tenantId: string): Promise<LedgerTransfer | null> {
    return this.executeWithBreaker("getTransfer", async () => {
      const client = await this.ensureInitialized();
      const tbTransferId = stringToBigint(transferId);
      const transfers = await client.lookupTransfers([tbTransferId]);

      if (!transfers || transfers.length === 0 || !transfers[0]) {
        return null;
      }

      const t = transfers[0];
      if (t.user_data_128 !== tenantFingerprint(tenantId)) {
        return null;
      }

      return {
        id: bigintToString(t.id),
        tenantId,
        debitAccountId: bigintToString(t.debit_account_id),
        creditAccountId: bigintToString(t.credit_account_id),
        amount: {
          value: fromTigerBeetleAmount(t.amount, "USD"),
          currency: "USD",
        },
        status:
          t.flags & TransferFlags.pending
            ? "pending"
            : t.flags & TransferFlags.void_pending_transfer
              ? "reversed"
              : "posted",
        idempotencyKey: "",
        createdAt: new Date(Number(t.timestamp) / 1_000_000),
        updatedAt: new Date(Number(t.timestamp) / 1_000_000),
      };
    });
  }

  // =============================================================================
  // Circuit Breaker Wrapper
  // =============================================================================

  private async executeWithBreaker<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await this.executeBreaker.fire(fn);
    } catch (error: any) {
      if (error instanceof LedgerError) {
        throw error;
      }

      // Opossum adds specific codes for its errors
      if (error.code === "ETIMEDOUT") {
        throw new LedgerTimeoutError(operation, this.config.timeout || 5000);
      }
      if (error.code === "EOPENBREAKER" || error.message?.includes("breaker is open")) {
        throw new LedgerConnectionError(`Circuit breaker open for operation: ${operation}`);
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new LedgerOperationError(operation, message);
    }
  }

  async getTransferByIdempotencyKey(
    idempotencyKey: string,
    tenantId: string
  ): Promise<LedgerTransfer | null> {
    const transferId = generateTransferId(idempotencyKey, tenantId);
    const transfer = await this.getTransfer(bigintToString(transferId), tenantId);
    return transfer ? { ...transfer, idempotencyKey } : null;
  }
}

/**
 * Check if error is a ledger error
 */
export function isLedgerError(error: unknown): error is LedgerError {
  return error instanceof LedgerError;
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a TigerBeetleLedgerRepository instance
 */
export function createTigerBeetleLedgerRepository(
  config?: Partial<TigerBeetleConfig>
): TigerBeetleLedgerRepository {
  return new TigerBeetleLedgerRepository(config);
}
