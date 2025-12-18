/**
 * Ingestion Service
 * Core service for managing ingestion pipeline
 */
import { IngestionJobConfig, NormalizedTransactionInput } from "./types";
/**
 * Create a new ingestion record
 */
export declare function createIngestion(config: IngestionJobConfig): Promise<string>;
/**
 * Update ingestion status
 */
export declare function updateIngestionStatus(ingestionId: string, status: string, updates?: {
    rawRecordCount?: number;
    normalizedCount?: number;
    failedCount?: number;
    retryCount?: number;
    errorMessage?: string;
    errorStack?: string;
    completedAt?: Date;
}): Promise<void>;
/**
 * Create raw record
 */
export declare function createRawRecord(ingestionId: string, sourceId: string, tenantId: string, rawData: Record<string, unknown>, options?: {
    rowNumber?: number;
    externalId?: string;
}): Promise<string>;
/**
 * Create normalized transaction
 */
export declare function createNormalizedTransaction(ingestionId: string, sourceId: string, tenantId: string, transaction: NormalizedTransactionInput, rawRecordId?: string): Promise<string>;
/**
 * Get ingestion by ID
 */
export declare function getIngestion(ingestionId: string): Promise<{
    id: string;
    sourceId: string;
    tenantId: string;
    userId: string;
    status: string;
    rawRecordCount: number;
    normalizedCount: number;
    failedCount: number;
    retryCount: number;
    traceId: string | null;
    startedAt: Date;
    completedAt: Date | null;
    errorMessage: string | null;
    metadata: Record<string, unknown>;
} | null>;
/**
 * Batch create normalized transactions (for performance)
 */
export declare function batchCreateNormalizedTransactions(ingestionId: string, sourceId: string, tenantId: string, transactions: Array<{
    transaction: NormalizedTransactionInput;
    rawRecordId?: string;
}>): Promise<string[]>;
//# sourceMappingURL=ingestion-service.d.ts.map