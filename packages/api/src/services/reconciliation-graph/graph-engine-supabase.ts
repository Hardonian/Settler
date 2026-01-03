/**
 * Continuous Reconciliation Graph Engine - Supabase Integration
 * 
 * Persists graph state to Supabase PostgreSQL and uses Realtime for updates
 */

import { ReconciliationNode, ReconciliationEdge, ReconciliationGraph, GraphQuery, RealTimeUpdate } from './types';
import { supabase, supabaseRealtime } from '../../infrastructure/supabase/client';
import { EventEmitter } from 'events';
import { logError } from '../../utils/logger';

export class ReconciliationGraphEngineSupabase extends EventEmitter {
  private updateSubscribers: Map<string, Set<(update: RealTimeUpdate) => void>> = new Map();

  /**
   * Initialize Realtime subscriptions
   */
  async initialize(jobId: string): Promise<void> {
    // Subscribe to node updates
    const _nodesChannel = supabaseRealtime
      .channel(`reconciliation-graph-nodes-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reconciliation_graph_nodes',
          filter: `job_id=eq.${jobId}`,
        },
        (payload: {
          eventType: string;
          new: Record<string, unknown>;
        }) => {
          this.emit('node_updated', payload);
          this.notifySubscribers(jobId, {
            type: (payload.eventType === 'INSERT' ? 'node_added' : 'node_updated') as RealTimeUpdate['type'],
            data: payload.new as ReconciliationNode,
            timestamp: new Date(),
          });
        }
      )
      .subscribe();
    void _nodesChannel;

    // Subscribe to edge updates
    const _edgesChannel = supabaseRealtime
      .channel(`reconciliation-graph-edges-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reconciliation_graph_edges',
        },
        (payload: {
          eventType: string;
          new: Record<string, unknown>;
        }) => {
          this.emit('edge_updated', payload);
          this.notifySubscribers(jobId, {
            type: (payload.eventType === 'INSERT' ? 'edge_added' : 'edge_updated') as RealTimeUpdate['type'],
            data: payload.new as ReconciliationEdge,
            timestamp: new Date(),
          });
        }
      )
      .subscribe();
    void _edgesChannel;
  }

  /**
   * Add or update a node in the graph
   */
  async addNode(jobId: string, node: ReconciliationNode): Promise<ReconciliationNode> {
    const { data, error } = await supabase
      .from('reconciliation_graph_nodes')
      .upsert({
        id: node.id,
        job_id: jobId,
        node_type: node.type,
        source_id: node.sourceId,
        target_id: node.targetId,
        data: node.data,
        amount: node.amount,
        currency: node.currency,
        timestamp: node.timestamp,
        confidence: node.confidence,
        metadata: node.metadata || {},
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add node: ${error.message}`);
    }

    const savedNode: ReconciliationNode = {
      id: data.id,
      type: data.node_type as ReconciliationNode['type'],
      jobId: data.job_id,
      sourceId: data.source_id,
      targetId: data.target_id,
      data: data.data,
      amount: data.amount,
      currency: data.currency,
      timestamp: new Date(data.timestamp),
      confidence: data.confidence,
      metadata: data.metadata,
    };

    this.emit('node_added', savedNode);
    return savedNode;
  }

  /**
   * Add or update an edge in the graph
   */
  async addEdge(_jobId: string, edge: ReconciliationEdge): Promise<ReconciliationEdge> {
    // Verify nodes exist
    const { data: sourceNode } = await supabase
      .from('reconciliation_graph_nodes')
      .select('id')
      .eq('id', edge.source)
      .single();

    const { data: targetNode } = await supabase
      .from('reconciliation_graph_nodes')
      .select('id')
      .eq('id', edge.target)
      .single();

    if (!sourceNode || !targetNode) {
      throw new Error(`Nodes ${edge.source} or ${edge.target} do not exist`);
    }

    const { data, error } = await supabase
      .from('reconciliation_graph_edges')
      .upsert({
        id: edge.id,
        source_node_id: edge.source,
        target_node_id: edge.target,
        edge_type: edge.type,
        confidence: edge.confidence,
        metadata: edge.metadata || {},
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add edge: ${error.message}`);
    }

    const savedEdge: ReconciliationEdge = {
      id: data.id,
      source: data.source_node_id,
      target: data.target_node_id,
      type: data.edge_type as ReconciliationEdge['type'],
      confidence: data.confidence,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    };

    this.emit('edge_added', savedEdge);
    return savedEdge;
  }

  /**
   * Query the graph
   */
  async query(query: GraphQuery): Promise<{ nodes: ReconciliationNode[]; edges: ReconciliationEdge[] }> {
    let nodesQuery = supabase
      .from('reconciliation_graph_nodes')
      .select('*')
      .eq('job_id', query.jobId);

    if (query.nodeType) {
      nodesQuery = nodesQuery.eq('node_type', query.nodeType);
    }

    if (query.sourceId) {
      nodesQuery = nodesQuery.eq('source_id', query.sourceId);
    }

    if (query.targetId) {
      nodesQuery = nodesQuery.eq('target_id', query.targetId);
    }

    if (query.dateRange) {
      nodesQuery = nodesQuery
        .gte('timestamp', query.dateRange.start.toISOString())
        .lte('timestamp', query.dateRange.end.toISOString());
    }

    if (query.offset) {
      nodesQuery = nodesQuery.range(query.offset, query.offset + (query.limit || 100) - 1);
    } else if (query.limit) {
      nodesQuery = nodesQuery.limit(query.limit);
    }

    const { data: nodesData, error: nodesError } = await nodesQuery;

    if (nodesError) {
      throw new Error(`Failed to query nodes: ${nodesError.message}`);
    }

    const nodes: ReconciliationNode[] = (nodesData || []).map((n: {
      id: string;
      node_type: string;
      job_id: string;
      source_id: string | null;
      target_id: string | null;
      data: Record<string, unknown>;
      amount: number | null;
      currency: string | null;
      timestamp: string;
      confidence: number | null;
      metadata: Record<string, unknown>;
    }) => ({
      id: n.id,
      type: n.node_type as ReconciliationNode['type'],
      jobId: n.job_id,
      sourceId: n.source_id,
      targetId: n.target_id,
      data: n.data,
      amount: n.amount,
      currency: n.currency,
      timestamp: new Date(n.timestamp),
      confidence: n.confidence,
      metadata: n.metadata,
    }));

    // Get edges for these nodes
    const nodeIds = nodes.map(n => n.id);
    const { data: edgesData, error: edgesError } = await supabase
      .from('reconciliation_graph_edges')
      .select('*')
      .in('source_node_id', nodeIds)
      .in('target_node_id', nodeIds);

    if (edgesError) {
      throw new Error(`Failed to query edges: ${edgesError.message}`);
    }

    const edges: ReconciliationEdge[] = (edgesData || []).map((e: {
      id: string;
      source_node_id: string;
      target_node_id: string;
      edge_type: string;
      confidence: number | null;
      metadata: Record<string, unknown>;
      created_at: string;
    }) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      type: e.edge_type as ReconciliationEdge['type'],
      confidence: e.confidence ?? 0,
      metadata: e.metadata,
      createdAt: new Date(e.created_at),
    }));

    return { nodes, edges };
  }

  /**
   * Get graph state
   */
  async getGraphState(jobId: string): Promise<ReconciliationGraph | null> {
    const { nodes, edges } = await this.query({ jobId });

    if (nodes.length === 0) {
      return null;
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edgeMap = new Map(edges.map(e => [e.id, e]));

    return {
      nodes: nodeMap,
      edges: edgeMap,
      jobId,
      updatedAt: new Date(),
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(jobId: string, callback: (update: RealTimeUpdate) => void): () => void {
    if (!this.updateSubscribers.has(jobId)) {
      this.updateSubscribers.set(jobId, new Set());
      this.initialize(jobId).catch((error) => {
        logError('Failed to initialize graph subscriptions', error);
      });
    }

    this.updateSubscribers.get(jobId)!.add(callback);

    return () => {
      this.updateSubscribers.get(jobId)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of updates
   */
  private notifySubscribers(jobId: string, update: RealTimeUpdate): void {
    const subscribers = this.updateSubscribers.get(jobId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          logError('Error notifying subscriber', error);
        }
      });
    }
  }
}

export const graphEngineSupabase = new ReconciliationGraphEngineSupabase();
