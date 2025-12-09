/**
 * Stream Processor for Continuous Reconciliation Graph
 *
 * Processes transaction events in real-time and updates the graph.
 */
import { EventEmitter } from 'events';
export interface TransactionEvent {
    id: string;
    jobId: string;
    type: 'source' | 'target';
    sourceId?: string;
    targetId?: string;
    data: Record<string, unknown>;
    amount?: number;
    currency?: string;
    timestamp: Date;
}
export declare class StreamProcessor extends EventEmitter {
    private processingQueue;
    private isProcessing;
    private batchSize;
    private processingInterval;
    constructor();
    /**
     * Add transaction event to processing queue
     */
    addEvent(event: TransactionEvent): Promise<void>;
    /**
     * Start processing queue
     */
    private startProcessing;
    /**
     * Process a batch of events
     */
    private processBatch;
    /**
     * Process a single event
     */
    private processEvent;
    /**
     * Get matching rules for a job
     * In production, this would fetch from database
     */
    private getMatchingRules;
    /**
     * Get processing stats
     */
    getStats(): {
        queueLength: number;
        isProcessing: boolean;
        batchSize: number;
    };
}
export declare const streamProcessor: StreamProcessor;
//# sourceMappingURL=stream-processor.d.ts.map