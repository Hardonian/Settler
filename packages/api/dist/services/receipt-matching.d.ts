/**
 * Receipt Auto-Matching Service
 *
 * Automatically matches receipts to transactions based on:
 * - Amount (within tolerance)
 * - Date (within window)
 * - Merchant name (fuzzy matching)
 *
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Configurable matching rules
 * - Confidence scoring
 */
import { PrismaClient } from '@prisma/client';
interface MatchResult {
    receiptId: string;
    transactionId: string;
    confidence: number;
    matchReason: string;
    amountDiff: number;
    dateDiff: number;
}
interface MatchingConfig {
    amountTolerance: number;
    dateWindowDays: number;
    merchantNameSimilarity: number;
}
/**
 * Match a receipt to transactions
 */
export declare function matchReceiptToTransaction(prisma: PrismaClient, receiptId: string, tenantId: string, config?: Partial<MatchingConfig>): Promise<MatchResult | null>;
/**
 * Batch match receipts to transactions
 */
export declare function batchMatchReceipts(prisma: PrismaClient, receiptIds: string[], tenantId: string, config?: Partial<MatchingConfig>): Promise<MatchResult[]>;
/**
 * Match receipts to transactions (for existing route compatibility)
 * Note: This function signature matches the route but uses simplified logic
 * For full matching, use matchReceiptToTransaction with PrismaClient
 */
export declare function matchReceiptsToTransactions(_tenantId: string, _reconciliationRunId: string, receipts: Array<{
    id: string;
}>, transactions: Array<{
    id: string;
    amount: number;
    date: Date;
    currency: string;
}>): Promise<Array<{
    receiptId: string;
    transactionId: string;
    confidence: number;
}>>;
/**
 * Get receipt matches for a reconciliation run
 */
export declare function getReceiptMatches(_tenantId: string, _reconciliationRunId: string): Promise<Array<{
    receiptId: string;
    transactionId: string;
    confidence: number;
}>>;
/**
 * Verify a receipt-transaction link
 */
export declare function verifyReceiptLink(_tenantId: string, _linkId: string, _userId: string): Promise<void>;
export {};
//# sourceMappingURL=receipt-matching.d.ts.map