/**
 * Matching Engine
 *
 * Implements comprehensive matching strategies as specified in the Product & Technical Specification:
 * - 1-to-1 matching (single transaction → single settlement)
 * - 1-to-many matching (single transaction → multiple settlements)
 * - Many-to-1 matching (multiple transactions → single settlement)
 * - Fuzzy matching (reference ID variations, amount tolerance)
 */
import { Transaction, Settlement, ReconciliationMatch, MatchingRulesConfig, Exception } from '@settler/types';
export interface MatchResult {
    match: ReconciliationMatch;
    confidence: number;
}
export interface MatchingContext {
    transactions: Transaction[];
    settlements: Settlement[];
    rules: MatchingRulesConfig;
    tenantId: string;
    executionId?: string;
    jobId?: string;
}
export declare class MatchingEngine {
    /**
     * Match transactions to settlements using configured rules
     */
    match(context: MatchingContext): Promise<{
        matches: ReconciliationMatch[];
        exceptions: Exception[];
    }>;
    /**
     * Apply a single matching rule
     */
    private applyRule;
    /**
     * Match by transaction ID (exact)
     */
    private matchByTransactionId;
    /**
     * Match by amount (with tolerance)
     */
    private matchByAmount;
    /**
     * Match by date (with tolerance)
     */
    private matchByDate;
    /**
     * Match by reference ID (fuzzy)
     */
    private matchByReferenceId;
    /**
     * Match by multiple fields (composite matching)
     */
    private matchByMultipleFields;
    /**
     * Extract transaction IDs from settlement metadata
     */
    private extractTransactionIdsFromSettlement;
    /**
     * Extract reference ID from transaction or settlement
     */
    private extractReferenceId;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
    /**
     * Sort rules by priority
     */
    private sortRules;
    /**
     * Generate UUID
     */
    private generateId;
}
//# sourceMappingURL=MatchingEngine.d.ts.map