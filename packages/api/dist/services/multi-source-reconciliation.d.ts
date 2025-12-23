/**
 * Multi-Source Reconciliation Service
 * Handles reconciliation with multiple source adapters against a single target
 */
export interface MultiSourceConfig {
    sourceAdapters: Array<{
        adapter: string;
        config: Record<string, unknown>;
    }>;
    targetAdapter: string;
    targetConfig: Record<string, unknown>;
    conflictResolutionStrategy: "first_wins" | "last_wins" | "highest_amount" | "lowest_amount" | "manual";
    duplicateDetectionEnabled: boolean;
}
export interface ConflictDetectionResult {
    conflictId: string;
    conflictType: string;
    sourceAdapter1: string;
    sourceAdapter2: string;
    transactionId1?: string;
    transactionId2?: string;
    conflictDetails: Record<string, unknown>;
}
export interface MultiSourceReconciliationResult {
    multiSourceJobId: string;
    conflicts: ConflictDetectionResult[];
    duplicateCount: number;
    consolidatedMatches: number;
}
/**
 * Create a multi-source reconciliation job
 */
export declare function createMultiSourceJob(tenantId: string, userId: string, config: MultiSourceConfig): Promise<string>;
/**
 * Detect conflicts between multiple sources
 */
export declare function detectConflicts(tenantId: string, multiSourceJobId: string, transactions: Array<{
    adapter: string;
    transactionId: string;
    amount: number;
    date: Date;
    description: string;
    externalId?: string;
}>): Promise<ConflictDetectionResult[]>;
/**
 * Resolve a conflict
 */
export declare function resolveConflict(tenantId: string, conflictId: string, resolutionStrategy: "first_wins" | "last_wins" | "highest_amount" | "lowest_amount" | "manual", resolvedBy: string): Promise<void>;
/**
 * Run multi-source reconciliation
 */
export declare function runMultiSourceReconciliation(tenantId: string, multiSourceJobId: string, reconRunId: string): Promise<MultiSourceReconciliationResult>;
/**
 * Get multi-source job details
 */
export declare function getMultiSourceJob(tenantId: string, multiSourceJobId: string): Promise<{
    id: string;
    sourceAdapters: Array<{
        adapter: string;
        config: Record<string, unknown>;
    }>;
    targetAdapter: string;
    conflictResolutionStrategy: string;
    conflicts: ConflictDetectionResult[];
} | null>;
//# sourceMappingURL=multi-source-reconciliation.d.ts.map