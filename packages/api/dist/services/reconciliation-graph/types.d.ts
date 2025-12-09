/**
 * Continuous Reconciliation Graph Types
 *
 * Graph-based reconciliation that updates continuously as transactions occur.
 * Each transaction is a node; reconciliation is edge relationships.
 */
export interface ReconciliationNode {
    id: string;
    type: 'transaction' | 'match' | 'unmatched' | 'error';
    jobId: string;
    sourceId?: string;
    targetId?: string;
    data: Record<string, unknown>;
    amount?: number;
    currency?: string;
    timestamp: Date;
    confidence?: number;
    metadata?: Record<string, unknown>;
}
export interface ReconciliationEdge {
    id: string;
    source: string;
    target: string;
    type: 'matches' | 'conflicts' | 'related' | 'derived';
    confidence: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface ReconciliationGraph {
    nodes: Map<string, ReconciliationNode>;
    edges: Map<string, ReconciliationEdge>;
    jobId: string;
    updatedAt: Date;
}
export interface GraphQuery {
    jobId: string;
    nodeId?: string;
    nodeType?: ReconciliationNode['type'];
    sourceId?: string;
    targetId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    limit?: number;
    offset?: number;
}
export interface GraphUpdate {
    node?: ReconciliationNode;
    edge?: ReconciliationEdge;
    removeNode?: string;
    removeEdge?: string;
}
export interface RealTimeUpdate {
    type: 'node_added' | 'node_updated' | 'edge_added' | 'edge_updated' | 'graph_updated';
    data: ReconciliationNode | ReconciliationEdge | ReconciliationGraph;
    timestamp: Date;
}
//# sourceMappingURL=types.d.ts.map