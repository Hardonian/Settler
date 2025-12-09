"use strict";
/**
 * Stream Processor for Continuous Reconciliation Graph
 *
 * Processes transaction events in real-time and updates the graph.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamProcessor = exports.StreamProcessor = void 0;
const graph_engine_1 = require("./graph-engine");
const events_1 = require("events");
class StreamProcessor extends events_1.EventEmitter {
    processingQueue = [];
    isProcessing = false;
    batchSize = 100;
    processingInterval = 100; // ms
    constructor() {
        super();
        this.startProcessing();
    }
    /**
     * Add transaction event to processing queue
     */
    async addEvent(event) {
        this.processingQueue.push(event);
        this.emit('event_added', event);
    }
    /**
     * Start processing queue
     */
    startProcessing() {
        setInterval(() => {
            if (!this.isProcessing && this.processingQueue.length > 0) {
                this.processBatch();
            }
        }, this.processingInterval);
    }
    /**
     * Process a batch of events
     */
    async processBatch() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        const batch = this.processingQueue.splice(0, this.batchSize);
        try {
            for (const event of batch) {
                await this.processEvent(event);
            }
        }
        catch (error) {
            console.error('Error processing batch:', error);
            this.emit('processing_error', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Process a single event
     */
    async processEvent(event) {
        // Create node from event
        const node = {
            id: event.id,
            type: 'transaction',
            jobId: event.jobId,
            ...(event.sourceId !== undefined && { sourceId: event.sourceId }),
            ...(event.targetId !== undefined && { targetId: event.targetId }),
            data: event.data,
            ...(event.amount !== undefined && { amount: event.amount }),
            ...(event.currency !== undefined && { currency: event.currency }),
            timestamp: event.timestamp,
            metadata: {
                processedAt: new Date(),
            },
        };
        // Add node to graph
        graph_engine_1.graphEngine.addNode(event.jobId, node);
        // Try to find matches (if we have matching rules)
        // In production, this would fetch rules from database
        const matchingRules = await this.getMatchingRules(event.jobId);
        if (matchingRules.length > 0) {
            const matches = graph_engine_1.graphEngine.findMatches(event.jobId, node.id, matchingRules);
            for (const match of matches) {
                graph_engine_1.graphEngine.addEdge(event.jobId, match);
                // Update node confidence
                const sourceNode = graph_engine_1.graphEngine.getGraphState(event.jobId)?.nodes.get(match.source);
                const targetNode = graph_engine_1.graphEngine.getGraphState(event.jobId)?.nodes.get(match.target);
                if (sourceNode && targetNode) {
                    sourceNode.confidence = match.confidence;
                    targetNode.confidence = match.confidence;
                    sourceNode.type = 'match';
                    targetNode.type = 'match';
                }
            }
        }
        this.emit('event_processed', event);
    }
    /**
     * Get matching rules for a job
     * In production, this would fetch from database
     */
    async getMatchingRules(_jobId) {
        // TODO: Fetch from database
        // For now, return default rules
        return [
            {
                field: 'amount',
                type: 'range',
                tolerance: 0.01,
                weight: 1,
            },
            {
                field: 'referenceId',
                type: 'exact',
                weight: 2,
            },
        ];
    }
    /**
     * Get processing stats
     */
    getStats() {
        return {
            queueLength: this.processingQueue.length,
            isProcessing: this.isProcessing,
            batchSize: this.batchSize,
        };
    }
}
exports.StreamProcessor = StreamProcessor;
exports.streamProcessor = new StreamProcessor();
//# sourceMappingURL=stream-processor.js.map