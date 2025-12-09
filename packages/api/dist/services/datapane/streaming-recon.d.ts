/**
 * Streaming Reconciliation
 *
 * Incremental file ingestion, streaming schema diffs, real-time validation
 * Part 10: Next-Gen Data Plane & Processing Layers
 */
import { EventEmitter } from 'events';
export interface StreamingReconConfig {
    batchSize: number;
    flushInterval: number;
    enableSchemaDiff: boolean;
    enableRealTimeValidation: boolean;
}
export interface StreamingUpdate {
    type: 'ingestion' | 'schema_diff' | 'validation' | 'recon';
    data: Record<string, unknown>;
    timestamp: Date;
}
export interface BufferedItem {
    data: Record<string, unknown>;
    sourceId: string;
    timestamp: Date;
}
export interface SchemaDefinition {
    fields: Array<{
        name: string;
        type: string;
        nullable?: boolean;
    }>;
    [key: string]: unknown;
}
export declare class StreamingRecon extends EventEmitter {
    private config;
    private buffer;
    private schemaCache;
    constructor(config: StreamingReconConfig);
    /**
     * Ingest data incrementally
     */
    ingestIncremental(data: Record<string, unknown>, sourceId: string): Promise<void>;
    /**
     * Process streaming schema diff
     */
    processSchemaDiff(schema: SchemaDefinition, sourceId: string): Promise<void>;
    /**
     * Real-time validation
     */
    validateRealTime(data: Record<string, unknown>, rules: Array<Record<string, unknown>>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Progressive recon update
     */
    progressiveRecon(sourceData: Record<string, unknown>[], targetData: Record<string, unknown>[]): Promise<{
        matched: number;
        unmatched: number;
        progress: number;
    }>;
    /**
     * Flush buffer
     */
    private flush;
    /**
     * Compute schema diff
     */
    private computeSchemaDiff;
    /**
     * Apply validation rule
     */
    private applyValidationRule;
    /**
     * Match two records
     */
    private match;
}
//# sourceMappingURL=streaming-recon.d.ts.map