/**
 * Continuous Reconciliation Graph Engine - Supabase Integration
 *
 * Persists graph state to Supabase PostgreSQL and uses Realtime for updates
 */
import { ReconciliationNode, ReconciliationEdge, ReconciliationGraph, GraphQuery } from './types';
import { EventEmitter } from 'events';
export declare class ReconciliationGraphEngineSupabase extends EventEmitter {
    private updateSubscribers;
    /**
     * Initialize Realtime subscriptions
     */
    initialize(jobId: string): Promise<void>;
    /**
     * Add or update a node in the graph
     */
    addNode(jobId: string, node: ReconciliationNode): Promise<ReconciliationNode>;
    /**
     * Add or update an edge in the graph
     */
    addEdge(_jobId: string, edge: ReconciliationEdge): Promise<ReconciliationEdge>;
    /**
     * Query the graph
     */
    query(query: GraphQuery): Promise<{
        nodes: ReconciliationNode[];
        edges: ReconciliationEdge[];
    }>;
    /**
     * Get graph state
     */
    getGraphState(jobId: string): Promise<ReconciliationGraph | null>;
    /**
     * Subscribe to real-time updates
     */
    subscribe(jobId: string, callback: (update: any) => void): () => void;
    /**
     * Notify subscribers of updates
     */
    private notifySubscribers;
}
export declare const graphEngineSupabase: ReconciliationGraphEngineSupabase;
//# sourceMappingURL=graph-engine-supabase.d.ts.map