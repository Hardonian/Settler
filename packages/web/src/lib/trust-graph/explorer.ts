import type { ReconciliationProofCapsule } from "@settler/protocol";
import { buildDeterministicTrustGraph } from "@/lib/trust-graph/builder";
import { persistTrustGraph, readTrustGraph } from "@/lib/trust-graph/store";
import type {
  ArtifactLineage,
  PolicyImpact,
  ProofVerification,
  TrustGraph,
  TrustGraphEdge,
  TrustGraphNode,
} from "@/lib/trust-graph/types";

function ensureGraph(input: {
  tenantId: string;
  runId: string;
  proofCapsule: ReconciliationProofCapsule | null;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}) {
  const existing = readTrustGraph(input.tenantId, input.runId);
  if (existing) return existing;
  return persistTrustGraph(buildDeterministicTrustGraph(input));
}

export function getExecutionGraph(input: {
  tenantId: string;
  runId: string;
  proofCapsule: ReconciliationProofCapsule | null;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}): TrustGraph {
  return ensureGraph(input);
}

function parentEdge(graph: TrustGraph, nodeId: string): TrustGraphEdge | null {
  return graph.edges.find((edge) => edge.to === nodeId) || null;
}

function findNode(graph: TrustGraph, nodeId: string): TrustGraphNode {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) {
    throw new Error(`Trust graph node not found: ${nodeId}`);
  }
  return node;
}

export function traceArtifactLineage(input: {
  tenantId: string;
  runId: string;
  artifactNodeId?: string;
  proofCapsule: ReconciliationProofCapsule | null;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}): ArtifactLineage {
  const graph = ensureGraph(input);
  const artifactNode =
    (input.artifactNodeId && graph.nodes.find((node) => node.id === input.artifactNodeId)) ||
    graph.nodes.find((node) => node.type === "artifact");

  if (!artifactNode) throw new Error(`Artifact node unavailable for run ${input.runId}`);

  const lineage: ArtifactLineage["lineage"] = [{ node: artifactNode, viaEdge: null }];
  let cursor = artifactNode.id;
  const seen = new Set<string>([cursor]);

  while (true) {
    const edge = parentEdge(graph, cursor);
    if (!edge) break;
    const upstream = findNode(graph, edge.from);
    if (seen.has(upstream.id)) break;
    lineage.push({ node: upstream, viaEdge: edge });
    seen.add(upstream.id);
    cursor = upstream.id;
  }

  return {
    runId: input.runId,
    artifactNodeId: artifactNode.id,
    lineage,
  };
}

export function verifyProofChain(input: {
  tenantId: string;
  runId: string;
  proofCapsule: ReconciliationProofCapsule | null;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}): ProofVerification {
  const graph = ensureGraph(input);
  const proofNodeRefs = ["workflow_execution", "policy_decision", "artifact"].map(
    (type) => graph.nodes.find((node) => node.type === type)?.id || ""
  );

  const proofGraphHash = String(
    (input.proofCapsule as Record<string, unknown> | null)?.graphHash || ""
  );
  const graphHashMatches = Boolean(proofGraphHash && proofGraphHash === graph.graphHash);

  return {
    runId: input.runId,
    verified:
      graph.nodes.some((node) => node.type === "workflow_execution") &&
      graph.nodes.some((node) => node.type === "artifact") &&
      graph.nodes.some((node) => node.type === "policy_decision") &&
      graphHashMatches,
    checks: {
      hasWorkflowNode: graph.nodes.some((node) => node.type === "workflow_execution"),
      hasArtifactNode: graph.nodes.some((node) => node.type === "artifact"),
      hasPolicyNode: graph.nodes.some((node) => node.type === "policy_decision"),
      graphHashMatches,
      proofReferencesGraphNodes: proofNodeRefs.every(Boolean),
    },
    graphHash: graph.graphHash,
    proofNodeRefs,
  };
}

export function findPolicyImpact(input: {
  tenantId: string;
  runId: string;
  policyNodeId?: string;
  proofCapsule: ReconciliationProofCapsule | null;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
}): PolicyImpact {
  const graph = ensureGraph(input);
  const policyNode =
    (input.policyNodeId && graph.nodes.find((node) => node.id === input.policyNodeId)) ||
    graph.nodes.find((node) => node.type === "policy_decision");

  if (!policyNode) throw new Error(`Policy node unavailable for run ${input.runId}`);

  const impactedArtifactIds = graph.edges
    .filter((edge) => edge.from === policyNode.id && edge.type === "produced_artifact")
    .map((edge) => edge.to);

  const impactedExecutionIds = graph.edges
    .filter((edge) => edge.to === policyNode.id && edge.type === "policy_evaluated_by")
    .map((edge) => edge.from);

  return {
    runId: input.runId,
    policyNodeId: policyNode.id,
    impactedArtifacts: graph.nodes.filter((node) => impactedArtifactIds.includes(node.id)),
    impactedExecutionNodes: graph.nodes.filter((node) => impactedExecutionIds.includes(node.id)),
  };
}
