/**
 * Receipt Auto-Matching Service
 * Automatically matches receipts to transactions during reconciliation
 */
export type MatchConfidence = "high" | "medium" | "low" | "manual";
export interface ReceiptMatch {
    receiptId: string;
    transactionId: string;
    confidence: MatchConfidence;
    confidenceScore: number;
    matchReasons: string[];
}
/**
 * Match receipts to transactions
 */
export declare function matchReceiptsToTransactions(tenantId: string, reconciliationRunId: string, receipts: Array<{
    id: string;
    amount: number;
    date: Date;
    vendor?: string;
    description?: string;
}>, transactions: Array<{
    id: string;
    amount: number;
    date: Date;
    description?: string;
}>): Promise<ReceiptMatch[]>;
/**
 * Verify a receipt-transaction link
 */
export declare function verifyReceiptLink(tenantId: string, linkId: string, verifiedBy: string): Promise<void>;
/**
 * Get receipt matches for a reconciliation run
 */
export declare function getReceiptMatches(tenantId: string, reconciliationRunId: string): Promise<Array<{
    id: string;
    receiptId: string;
    transactionId: string;
    confidence: MatchConfidence;
    confidenceScore: number;
    verified: boolean;
}>>;
//# sourceMappingURL=receipt-matching.d.ts.map