/**
 * Continuous Reconciliation Graph Engine
 *
 * Maintains a real-time graph of transactions and their relationships.
 * Updates continuously as new transactions arrive.
 */
import { ReconciliationNode, ReconciliationEdge, ReconciliationGraph, GraphQuery, RealTimeUpdate } from './types';
import { EventEmitter } from 'events';
export declare class ReconciliationGraphEngine extends EventEmitter {
    private graphs;
    private updateSubscribers;
    /**
     * Create or get a reconciliation graph for a job
     */
    getOrCreateGraph(jobId: string): ReconciliationGraph;
    /**
     * Add or update a node in the graph
     */
    addNode(jobId: string, node: ReconciliationNode): void;
    /**
     * Add or update an edge in the graph
     */
    addEdge(jobId: string, edge: ReconciliationEdge): void;
    /**
     * Find matching nodes and create edges
     */
    findMatches(jobId: string, sourceNodeId: string, matchingRules: MatchingRule[]): ReconciliationEdge[];
    /**
     * Calculate match confidence between two nodes
     */
    private calculateMatchConfidence;
    /**
     * Get field value from node data
     */
    private getFieldValue;
    /**
     * Check if values match according to rule
     */
    private matchesRule;
    /**
     * Calculate string similarity (Levenshtein distance)
     */
    private stringSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Query the graph
     */
    query(query: GraphQuery): {
        nodes: ReconciliationNode[];
        edges: ReconciliationEdge[];
    };
    /**
     * Subscribe to real-time updates
     */
    subscribe(jobId: string, callback: (update: RealTimeUpdate) => void): () => void;
    /**
     * Notify subscribers of updates
     */
    private notifySubscribers;
    /**
     * Get graph state
     */
    getGraphState(jobId: string): ReconciliationGraph | null;
}
export interface MatchingRule {
    field: string;
    type: 'exact' | 'fuzzy' | 'range' | 'date_range';
    weight?: number;
    threshold?: number;
    tolerance?: number;
    days?: number;
}
export declare const graphEngine: ReconciliationGraphEngine;
//# sourceMappingURL=graph-engine.d.ts.map