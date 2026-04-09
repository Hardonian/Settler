/**
 * Trust Graph
 *
 * Tracks artifact lineage, execution provenance, and policy governance
 * relationships across the platform. All nodes are content-addressed
 * so the graph itself is verifiable.
 */

import crypto from "node:crypto";
import type { TrustNode, TrustEdge, TrustEdgeType, Execution, Artifact, Proof } from "./primitives";

export interface TrustGraphSnapshot {
  nodes: TrustNode[];
  edges: TrustEdge[];
  rootHash: string;
  snapshotAt: string;
}

export interface LineageTrace {
  executionId: string;
  ancestors: TrustNode[];
  descendants: TrustNode[];
  policies: TrustNode[];
  proofs: TrustNode[];
  depth: number;
}

function stableHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function sortedJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(sortedJson).join(",")}]`;
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  return `{${sorted.map((k) => `${JSON.stringify(k)}:${sortedJson((obj as Record<string, unknown>)[k])}`).join(",")}}`;
}

export class TrustGraph {
  private nodes = new Map<string, TrustNode>();
  private edges = new Map<string, TrustEdge>();
  private adjacency = new Map<string, Set<string>>(); // nodeId → edgeIds
  private reverseAdj = new Map<string, Set<string>>(); // nodeId → incoming edgeIds

  addNode(node: Omit<TrustNode, "nodeId">): TrustNode {
    const nodeId = stableHash(
      sortedJson({
        tenantId: node.tenantId,
        nodeType: node.nodeType,
        referenceId: node.referenceId,
      })
    );
    const full: TrustNode = { ...node, nodeId };
    this.nodes.set(nodeId, full);
    return full;
  }

  addEdge(
    sourceNodeId: string,
    targetNodeId: string,
    edgeType: TrustEdgeType,
    tenantId: string,
    metadata: Record<string, unknown> = {}
  ): TrustEdge {
    if (!this.nodes.has(sourceNodeId)) {
      throw new Error(`Trust graph: source node ${sourceNodeId} not found`);
    }
    if (!this.nodes.has(targetNodeId)) {
      throw new Error(`Trust graph: target node ${targetNodeId} not found`);
    }

    const source = this.nodes.get(sourceNodeId)!;
    const target = this.nodes.get(targetNodeId)!;
    if (source.tenantId !== tenantId || target.tenantId !== tenantId) {
      throw new Error("Trust graph: cross-tenant edges are forbidden");
    }

    const edgeId = stableHash(sortedJson({ sourceNodeId, targetNodeId, edgeType, tenantId }));
    const edge: TrustEdge = {
      edgeId,
      tenantId,
      sourceNodeId,
      targetNodeId,
      edgeType,
      createdAt: new Date().toISOString(),
      metadata,
    };
    this.edges.set(edgeId, edge);

    if (!this.adjacency.has(sourceNodeId)) this.adjacency.set(sourceNodeId, new Set());
    this.adjacency.get(sourceNodeId)!.add(edgeId);

    if (!this.reverseAdj.has(targetNodeId)) this.reverseAdj.set(targetNodeId, new Set());
    this.reverseAdj.get(targetNodeId)!.add(edgeId);

    return edge;
  }

  recordExecution(execution: Execution): TrustNode {
    return this.addNode({
      tenantId: execution.tenantId,
      nodeType: "execution",
      referenceId: execution.executionId,
      label: `run:${execution.runId}`,
      contentHash: stableHash(
        sortedJson({
          inputHash: execution.inputHash,
          configHash: execution.configHash,
          outputHash: execution.outputHash,
          runFingerprint: execution.runFingerprint,
        })
      ),
      createdAt: execution.startedAt,
      metadata: {
        policyId: execution.policyId,
        engineVersion: execution.engineVersion,
        status: execution.status,
      },
    });
  }

  recordArtifact(artifact: Artifact, executionNodeId: string): TrustNode {
    const node = this.addNode({
      tenantId: artifact.tenantId,
      nodeType: "artifact",
      referenceId: artifact.artifactId,
      label: `artifact:${artifact.artifactType}`,
      contentHash: artifact.contentHash,
      createdAt: artifact.createdAt,
      metadata: { artifactType: artifact.artifactType, sizeBytes: artifact.sizeBytes },
    });
    this.addEdge(executionNodeId, node.nodeId, "produced", artifact.tenantId);
    return node;
  }

  recordProof(proof: Proof, executionNodeId: string): TrustNode {
    const node = this.addNode({
      tenantId: proof.tenantId,
      nodeType: "proof",
      referenceId: proof.proofId,
      label: `proof:${proof.runFingerprint.slice(0, 12)}`,
      contentHash: stableHash(
        sortedJson({
          runFingerprint: proof.runFingerprint,
          hashChain: proof.hashChain,
        })
      ),
      createdAt: proof.createdAt,
      metadata: { verified: proof.verified },
    });
    this.addEdge(executionNodeId, node.nodeId, "proved_by", proof.tenantId);
    return node;
  }

  recordPolicyGovernance(
    executionNodeId: string,
    policyId: string,
    policyHash: string,
    tenantId: string
  ): TrustNode {
    const node = this.addNode({
      tenantId,
      nodeType: "policy",
      referenceId: policyId,
      label: `policy:${policyId}`,
      contentHash: policyHash,
      createdAt: new Date().toISOString(),
      metadata: {},
    });
    this.addEdge(executionNodeId, node.nodeId, "governed_by", tenantId);
    return node;
  }

  recordConnectorSource(artifactNodeId: string, connectorId: string, tenantId: string): TrustNode {
    const node = this.addNode({
      tenantId,
      nodeType: "connector",
      referenceId: connectorId,
      label: `connector:${connectorId}`,
      contentHash: stableHash(connectorId),
      createdAt: new Date().toISOString(),
      metadata: {},
    });
    this.addEdge(artifactNodeId, node.nodeId, "sourced_from", tenantId);
    return node;
  }

  recordReplay(
    replayExecutionNodeId: string,
    originalExecutionNodeId: string,
    tenantId: string
  ): void {
    this.addEdge(replayExecutionNodeId, originalExecutionNodeId, "replayed_from", tenantId);
  }

  traceLineage(executionId: string, tenantId: string, maxDepth = 10): LineageTrace {
    const execNodeId = stableHash(
      sortedJson({ tenantId, nodeType: "execution", referenceId: executionId })
    );

    const ancestors: TrustNode[] = [];
    const descendants: TrustNode[] = [];
    const policies: TrustNode[] = [];
    const proofs: TrustNode[] = [];

    // BFS forward (descendants)
    const fwdVisited = new Set<string>();
    let fwdQueue = [execNodeId];
    let depth = 0;
    while (fwdQueue.length > 0 && depth < maxDepth) {
      const nextQueue: string[] = [];
      for (const nid of fwdQueue) {
        if (fwdVisited.has(nid)) continue;
        fwdVisited.add(nid);
        const node = this.nodes.get(nid);
        if (node && nid !== execNodeId) {
          if (node.nodeType === "policy") policies.push(node);
          else if (node.nodeType === "proof") proofs.push(node);
          else descendants.push(node);
        }
        for (const edgeId of this.adjacency.get(nid) ?? []) {
          const edge = this.edges.get(edgeId);
          if (edge) nextQueue.push(edge.targetNodeId);
        }
      }
      fwdQueue = nextQueue;
      depth++;
    }

    // BFS backward (ancestors)
    const bwdVisited = new Set<string>();
    let bwdQueue = [execNodeId];
    depth = 0;
    while (bwdQueue.length > 0 && depth < maxDepth) {
      const nextQueue: string[] = [];
      for (const nid of bwdQueue) {
        if (bwdVisited.has(nid)) continue;
        bwdVisited.add(nid);
        const node = this.nodes.get(nid);
        if (node && nid !== execNodeId) ancestors.push(node);
        for (const edgeId of this.reverseAdj.get(nid) ?? []) {
          const edge = this.edges.get(edgeId);
          if (edge) nextQueue.push(edge.sourceNodeId);
        }
      }
      bwdQueue = nextQueue;
      depth++;
    }

    return { executionId, ancestors, descendants, policies, proofs, depth: maxDepth };
  }

  getNodesByTenant(tenantId: string): TrustNode[] {
    return [...this.nodes.values()].filter((n) => n.tenantId === tenantId);
  }

  getEdgesByTenant(tenantId: string): TrustEdge[] {
    return [...this.edges.values()].filter((e) => e.tenantId === tenantId);
  }

  snapshot(tenantId: string): TrustGraphSnapshot {
    const nodes = this.getNodesByTenant(tenantId);
    const edges = this.getEdgesByTenant(tenantId);
    const contentForHash = sortedJson({ nodes, edges });
    return {
      nodes,
      edges,
      rootHash: stableHash(contentForHash),
      snapshotAt: new Date().toISOString(),
    };
  }

  get stats() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
    };
  }
}
