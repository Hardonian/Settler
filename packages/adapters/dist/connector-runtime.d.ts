/**
 * Connector Runtime
 *
 * Orchestrates connector execution, credential management, sync runs, and error handling.
 */
import { ConnectorDriver, SyncOptions, SyncResult } from "./connector-driver";
export interface RuntimeConfig {
    supabaseUrl: string;
    supabaseServiceKey: string;
    encryptionKey?: string;
}
export interface SyncRunContext {
    tenantId: string;
    connectorId: string;
    syncRunId: string;
    userId?: string;
}
interface SaveNormalizedDataPayload {
    accounts?: Array<{
        providerAccountId: string;
        accountName: string;
        accountType?: string;
        currency: string;
        institutionName?: string;
        institutionId?: string;
        metadata?: Record<string, unknown>;
    }>;
    transactions?: Array<{
        externalId: string;
        accountId?: string;
        transactionType: string;
        amountCents: number;
        currency: string;
        occurredAt: Date;
        description?: string;
        referenceId?: string;
        referenceType?: string;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
    }>;
    balances?: Array<{
        accountId: string;
        balanceCents: number;
        availableBalanceCents?: number;
        currency: string;
        snapshotAt: Date;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
    }>;
    payouts?: Array<{
        externalId: string;
        accountId?: string;
        amountCents: number;
        currency: string;
        status: string;
        initiatedAt: Date;
        completedAt?: Date;
        feeCents?: number;
        netAmountCents?: number;
        destinationType?: string;
        destinationId?: string;
        description?: string;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
    }>;
    invoices?: Array<{
        externalId: string;
        invoiceNumber?: string;
        customerId?: string;
        customerName?: string;
        amountCents: number;
        currency: string;
        status: string;
        issueDate?: Date;
        dueDate?: Date;
        paidAt?: Date;
        lineItems?: Array<{
            description: string;
            quantity: number;
            unitPriceCents: number;
            totalCents: number;
        }>;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
    }>;
    subscriptions?: Array<{
        externalId: string;
        customerId: string;
        customerName?: string;
        planId?: string;
        planName?: string;
        status: string;
        billingCycle?: string;
        amountCents: number;
        currency: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
        cancelAtPeriodEnd?: boolean;
        cancelledAt?: Date;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
    }>;
    taxEstimates?: Array<{
        externalId: string;
        transactionId?: string;
        transactionType?: string;
        amountCents: number;
        currency: string;
        taxAmountCents: number;
        taxRate?: number;
        jurisdiction?: string;
        taxType?: string;
        occurredAt: Date;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
    }>;
    rawPayloads?: Array<{
        type: string;
        payload: unknown;
    }>;
}
type PersistenceStatus = "durable_atomic" | "durable_non_atomic" | "failed_partial";
interface PersistenceStageResult {
    stage: "sync_input_snapshot" | "accounts" | "transactions" | "balances" | "payouts" | "invoices" | "subscriptions" | "taxEstimates" | "rawPayloads";
    attempted: boolean;
    completed: boolean;
}
interface PersistenceOutcome {
    status: PersistenceStatus;
    recoveryRequired: boolean;
    fallbackUsed: boolean;
    reason?: string;
    stages: PersistenceStageResult[];
}
/**
 * Connector Runtime
 */
export declare class ConnectorRuntime {
    private config;
    private supabase;
    private alertManager;
    private retryQueue;
    constructor(config: RuntimeConfig);
    /**
     * Get connector credentials (decrypted)
     */
    getCredentials(tenantId: string, connectorId: string): Promise<Record<string, unknown>>;
    /**
     * Create a sync run
     */
    createSyncRun(tenantId: string, connectorId: string, options: SyncOptions): Promise<string>;
    /**
     * Update sync run status
     */
    updateSyncRun(syncRunId: string, updates: {
        status?: "pending" | "running" | "completed" | "failed" | "cancelled";
        persistenceStatus?: PersistenceStatus;
        recoveryRequired?: boolean;
        finishedAt?: Date;
        accountsSynced?: number;
        transactionsSynced?: number;
        balancesSynced?: number;
        payoutsSynced?: number;
        invoicesSynced?: number;
        subscriptionsSynced?: number;
        errorsCount?: number;
        warningsCount?: number;
        errorMessage?: string;
        errorDetails?: Record<string, unknown>;
        cursor?: string;
    }): Promise<void>;
    /**
     * Save normalized data to database
     */
    saveNormalizedData(tenantId: string, connectorId: string, syncRunId: string, data: SaveNormalizedDataPayload): Promise<PersistenceOutcome>;
    private getConnectorRecord;
    private getAccountMap;
    private assertUpsert;
    private tryAtomicNormalizedWrite;
    private persistInputSnapshot;
    /**
     * Save normalized data in batches (for large datasets)
     */
    saveNormalizedDataBatched(tenantId: string, connectorId: string, syncRunId: string, data: Parameters<ConnectorRuntime["saveNormalizedData"]>[3]): Promise<void>;
    /**
     * Update sync cursor
     */
    updateSyncCursor(tenantId: string, connectorId: string, cursorKey: string, cursorValue: string, accountId?: string): Promise<void>;
    /**
     * Get sync cursor
     */
    getSyncCursor(tenantId: string, connectorId: string, cursorKey: string, accountId?: string): Promise<string | null>;
    /**
     * Execute sync with driver
     */
    executeSync(driver: ConnectorDriver, tenantId: string, connectorId: string, options: SyncOptions): Promise<SyncResult>;
}
export {};
//# sourceMappingURL=connector-runtime.d.ts.map