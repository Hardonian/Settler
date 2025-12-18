/**
 * Reconciliation Matcher
 * Deterministic matching algorithm: exact amount + date window + fuzzy description
 */
import { MatchResult, ReconciliationConfig } from "./types";
/**
 * Match source transaction to target transactions
 */
export declare function matchTransaction(sourceTransactionId: string, targetTransactionIds: string[], config?: ReconciliationConfig): Promise<MatchResult | null>;
/**
 * Run reconciliation for an ingestion
 */
export declare function runReconciliation(ingestionId: string, tenantId: string, userId: string, config?: ReconciliationConfig): Promise<string>;
//# sourceMappingURL=reconciliation-matcher.d.ts.map