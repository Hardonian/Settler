/**
 * Edge Computing Agent
 *
 * Lightweight agent that runs in customer infrastructure to perform
 * reconciliation locally without sending data to Settler cloud.
 */
import { EventEmitter } from 'events';
export interface EdgeAgentConfig {
    customerId: string;
    apiKey: string;
    cloudEndpoint: string;
    reconciliationRules: ReconciliationRule[];
    encryptionKey?: string;
}
export interface ReconciliationRule {
    field: string;
    type: 'exact' | 'fuzzy' | 'range' | 'date_range';
    threshold?: number;
    tolerance?: number;
    days?: number;
}
export interface ReconciliationResult {
    matched: number;
    unmatched: number;
    errors: number;
    accuracy: number;
    executionTime: number;
    metadata: Record<string, unknown>;
}
export declare class EdgeAgent extends EventEmitter {
    private config;
    private isRunning;
    constructor(config: EdgeAgentConfig);
    /**
     * Initialize the edge agent
     */
    initialize(): Promise<void>;
    /**
     * Perform local reconciliation
     */
    reconcile(sourceData: Record<string, unknown>[], targetData: Record<string, unknown>[]): Promise<ReconciliationResult>;
    /**
     * Check if source and target match according to rules
     */
    private matches;
    /**
     * Check if values match according to rule
     */
    private matchesRule;
    /**
     * Calculate string similarity
     */
    private stringSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Create encrypted metadata (only results, not raw data)
     */
    private createEncryptedMetadata;
    /**
     * Send encrypted metadata to cloud (not raw data)
     */
    private sendMetadataToCloud;
    /**
     * Test connection to cloud endpoint
     */
    private testCloudConnection;
    /**
     * Shutdown the edge agent
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=edge-agent.d.ts.map