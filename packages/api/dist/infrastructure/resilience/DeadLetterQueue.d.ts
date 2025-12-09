/**
 * Dead Letter Queue
 * Handles irrecoverable jobs and events
 */
import { Pool } from 'pg';
export interface DeadLetterEntry {
    id: string;
    saga_id?: string;
    event_id?: string;
    error_type: string;
    error_message: string;
    error_stack?: string;
    payload: Record<string, unknown>;
    retry_count: number;
    max_retries: number;
    tenant_id: string;
    correlation_id?: string;
    created_at: Date;
    resolved_at?: Date;
    resolution_notes?: string;
}
export declare class DeadLetterQueue {
    private db;
    constructor(db?: Pool);
    /**
     * Add an entry to the dead letter queue
     */
    addEntry(entry: Omit<DeadLetterEntry, 'id' | 'created_at'>): Promise<string>;
    /**
     * Get unresolved entries
     */
    getUnresolvedEntries(limit?: number): Promise<DeadLetterEntry[]>;
    /**
     * Resolve an entry
     */
    resolveEntry(id: string, resolutionNotes?: string): Promise<void>;
    /**
     * Get entries by tenant
     */
    getEntriesByTenant(tenantId: string, limit?: number): Promise<DeadLetterEntry[]>;
}
//# sourceMappingURL=DeadLetterQueue.d.ts.map