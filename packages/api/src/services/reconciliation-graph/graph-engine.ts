/**
 * Continuous Reconciliation Graph Engine
 *
 * Maintains a real-time graph of transactions and their relationships.
 * Updates continuously as new transactions arrive.
 */

import {
  ReconciliationNode,
  ReconciliationEdge,
  ReconciliationGraph,
  GraphQuery,
  RealTimeUpdate,
} from "./types";
import { EventEmitter } from "events";
import { logError } from "../../utils/logger";
import { DEFAULT_TOLERANCES } from "../matching-rules-loader";
import { levenshteinDistance } from "../../lib/levenshtein";

export class ReconciliationGraphEngine extends EventEmitter {
  private graphs: Map<string, ReconciliationGraph> = new Map();
  private updateSubscribers: Map<string, Set<(update: RealTimeUpdate) => void>> = new Map();

  /**
   * Create or get a reconciliation graph for a job
   */
  getOrCreateGraph(jobId: string): ReconciliationGraph {
    if (!this.graphs.has(jobId)) {
      this.graphs.set(jobId, {
        nodes: new Map(),
        edges: new Map(),
        jobId,
        updatedAt: new Date(),
      });
    }
    return this.graphs.get(jobId)!;
  }

  /**
   * Add or update a node in the graph
   */
  addNode(jobId: string, node: ReconciliationNode): void {
    const graph = this.getOrCreateGraph(jobId);
    graph.nodes.set(node.id, node);
    graph.updatedAt = new Date();

    this.emit("node_added", {
      type: "node_added",
      data: node,
      timestamp: new Date(),
    } as RealTimeUpdate);

    this.notifySubscribers(jobId, {
      type: "node_added",
      data: node,
      timestamp: new Date(),
    });
  }

  /**
   * Add or update an edge in the graph
   */
  addEdge(jobId: string, edge: ReconciliationEdge): void {
    const graph = this.getOrCreateGraph(jobId);

    // Validate nodes exist
    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) {
      throw new Error(`Nodes ${edge.source} or ${edge.target} do not exist`);
    }

    graph.edges.set(edge.id, edge);
    graph.updatedAt = new Date();

    this.emit("edge_added", {
      type: "edge_added",
      data: edge,
      timestamp: new Date(),
    } as RealTimeUpdate);

    this.notifySubscribers(jobId, {
      type: "edge_added",
      data: edge,
      timestamp: new Date(),
    });
  }

  /**
   * Find matching nodes and create edges
   */
  findMatches(
    jobId: string,
    sourceNodeId: string,
    matchingRules: MatchingRule[],
    minConfidence: number = 0.5
  ): ReconciliationEdge[] {
    const graph = this.getOrCreateGraph(jobId);
    const sourceNode = graph.nodes.get(sourceNodeId);

    if (!sourceNode) {
      return [];
    }

    const matches: ReconciliationEdge[] = [];
    // Reserved for future source node filtering
    const _sourceNodes = Array.from(graph.nodes.values()).filter(
      (n) => n.jobId === jobId && n.type === "transaction" && n.sourceId
    );
    void _sourceNodes;
    const targetNodes = Array.from(graph.nodes.values()).filter(
      (n) => n.jobId === jobId && n.type === "transaction" && n.targetId
    );

    for (const targetNode of targetNodes) {
      if (targetNode.id === sourceNodeId) continue;

      const confidence = this.calculateMatchConfidence(sourceNode, targetNode, matchingRules);

      if (confidence > minConfidence) {
        // Configurable threshold for match
        const edge: ReconciliationEdge = {
          id: `edge_${sourceNode.id}_${targetNode.id}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: "matches",
          confidence,
          metadata: {
            matchedAt: new Date(),
            rules: matchingRules.map((r) => r.field),
          },
          createdAt: new Date(),
        };

        matches.push(edge);
      }
    }

    return matches;
  }

  /**
   * Calculate match confidence between two nodes
   */
  private calculateMatchConfidence(
    source: ReconciliationNode,
    target: ReconciliationNode,
    rules: MatchingRule[]
  ): number {
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const rule of rules) {
      const weight = rule.weight || 1;
      totalWeight += weight;

      const sourceValue = this.getFieldValue(source, rule.field);
      const targetValue = this.getFieldValue(target, rule.field);

      if (this.matchesRule(sourceValue, targetValue, rule)) {
        matchedWeight += weight;
      }
    }

    return totalWeight > 0 ? matchedWeight / totalWeight : 0;
  }

  /**
   * Get field value from node data
   */
  private getFieldValue(node: ReconciliationNode, field: string): unknown {
    if (field === "amount") return node.amount;
    if (field === "currency") return node.currency;
    if (field === "timestamp") return node.timestamp;
    return node.data[field];
  }

  /**
   * Check if values match according to rule
   */
  private matchesRule(sourceValue: unknown, targetValue: unknown, rule: MatchingRule): boolean {
    if (sourceValue === undefined || targetValue === undefined) return false;

    switch (rule.type) {
      case "exact":
        return sourceValue === targetValue;

      case "fuzzy":
        if (typeof sourceValue === "string" && typeof targetValue === "string") {
          const similarity = this.stringSimilarity(sourceValue, targetValue);
          return similarity >= (rule.threshold ?? 0.8);
        }
        return false;

      case "range":
        if (typeof sourceValue === "number" && typeof targetValue === "number") {
          const diff = Math.abs(sourceValue - targetValue);
          return diff <= (rule.tolerance ?? DEFAULT_TOLERANCES.amount);
        }
        return false;

      case "date_range":
        if (sourceValue instanceof Date && targetValue instanceof Date) {
          const diffDays = Math.abs(
            (sourceValue.getTime() - targetValue.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diffDays <= (rule.days ?? DEFAULT_TOLERANCES.dateDays);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Query the graph
   */
  query(query: GraphQuery): { nodes: ReconciliationNode[]; edges: ReconciliationEdge[] } {
    const graph = this.getOrCreateGraph(query.jobId);

    let nodes = Array.from(graph.nodes.values());
    const edges = Array.from(graph.edges.values());

    // Filter by node type
    if (query.nodeType) {
      nodes = nodes.filter((n) => n.type === query.nodeType);
    }

    // Filter by source/target ID
    if (query.sourceId) {
      nodes = nodes.filter((n) => n.sourceId === query.sourceId);
    }

    if (query.targetId) {
      nodes = nodes.filter((n) => n.targetId === query.targetId);
    }

    // Filter by date range
    if (query.dateRange) {
      nodes = nodes.filter(
        (n) => n.timestamp >= query.dateRange!.start && n.timestamp <= query.dateRange!.end
      );
    }

    // Pagination
    if (query.offset) {
      nodes = nodes.slice(query.offset);
    }
    if (query.limit) {
      nodes = nodes.slice(0, query.limit);
    }

    return { nodes, edges };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(jobId: string, callback: (update: RealTimeUpdate) => void): () => void {
    if (!this.updateSubscribers.has(jobId)) {
      this.updateSubscribers.set(jobId, new Set());
    }

    this.updateSubscribers.get(jobId)!.add(callback);

    // Return unsubscribe function
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
      subscribers.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          logError("Error notifying subscriber", error);
        }
      });
    }
  }

  /**
   * Get graph state
   */
  getGraphState(jobId: string): ReconciliationGraph | null {
    return this.graphs.get(jobId) || null;
  }
}

export interface MatchingRule {
  field: string;
  type: "exact" | "fuzzy" | "range" | "date_range";
  weight?: number;
  threshold?: number;
  tolerance?: number;
  days?: number;
}

export const graphEngine = new ReconciliationGraphEngine();
