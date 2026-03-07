import { stableHash, type ReconciliationProofCapsule } from "@settler/protocol";
import type { TrustGraph, TrustGraphEdge, TrustGraphNode } from "@/lib/trust-graph/types";
import { buildCasRef, graphHashFromShape } from "@/lib/trust-graph/store";

type BuildInput = {
  tenantId: string;
  runId: string;
  proofCapsule: ReconciliationProofCapsule | null;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
};

function makeNode(
  type: TrustGraphNode["type"],
  runId: string,
  label: string,
  metadata: Record<string, unknown>,
  createdAt: string
): TrustGraphNode {
  const hashRef = buildCasRef({ type, runId, label, metadata, createdAt });
  return {
    id: `node_${stableHash({ type, label, hashRef }).slice(0, 16)}`,
    type,
    hashRef,
    label,
    runId,
    createdAt,
    metadata,
  };
}

function makeEdge(
  from: string,
  to: string,
  type: TrustGraphEdge["type"],
  metadata: Record<string, unknown>
): TrustGraphEdge {
  const hashRef = buildCasRef({ from, to, type, metadata });
  return {
    id: `edge_${stableHash({ from, to, type, hashRef }).slice(0, 16)}`,
    from,
    to,
    type,
    hashRef,
    metadata,
  };
}

function sorted<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

export function buildDeterministicTrustGraph(input: BuildInput): TrustGraph {
  const createdAt = input.proofCapsule?.createdAt || new Date(0).toISOString();
  const connectorLabel = String(input.metadata?.sourceAdapter || "connector:unknown");

  const externalInputNode = makeNode(
    "external_input",
    input.runId,
    "External Input",
    {
      inputHash: input.proofCapsule?.inputHash || null,
      canonicalFingerprint: input.metadata?.fingerprint || null,
    },
    createdAt
  );

  const connectorNode = makeNode(
    "connector",
    input.runId,
    connectorLabel,
    {
      sourceConfigHash: buildCasRef(input.metadata?.sourceConfig || {}),
      targetAdapter: input.metadata?.targetAdapter || null,
    },
    createdAt
  );

  const workflowNode = makeNode(
    "workflow_execution",
    input.runId,
    "Workflow Execution",
    {
      status: input.metadata?.status || "unknown",
      runFingerprint: input.metadata?.fingerprint || null,
      versionHash: input.proofCapsule?.versionHash || null,
    },
    createdAt
  );

  const policyNode = makeNode(
    "policy_decision",
    input.runId,
    "Policy Decision",
    {
      ruleHash: input.proofCapsule?.ruleHash || null,
      policyId: input.metadata?.policyId || "default",
      evaluation: input.summary?.policyEvaluation || "applied",
    },
    createdAt
  );

  const artifactNode = makeNode(
    "artifact",
    input.runId,
    "Reconciliation Artifact",
    {
      outputHash: input.proofCapsule?.outputHash || null,
      summaryHash: buildCasRef(input.summary || {}),
      proofCapsuleHash: buildCasRef(input.proofCapsule || {}),
    },
    createdAt
  );

  const edges = sorted([
    makeEdge(externalInputNode.id, connectorNode.id, "derived_from", { trust: "input-bound" }),
    makeEdge(connectorNode.id, workflowNode.id, "derived_from", {
      reason: "connector normalized external input",
    }),
    makeEdge(workflowNode.id, policyNode.id, "policy_evaluated_by", {
      policyHash: input.proofCapsule?.ruleHash || null,
    }),
    makeEdge(policyNode.id, artifactNode.id, "produced_artifact", {
      outputHash: input.proofCapsule?.outputHash || null,
    }),
    makeEdge(artifactNode.id, workflowNode.id, "verified_by", {
      verifier: input.proofCapsule?.signer || "Settler-Core",
      signature: input.proofCapsule?.signature || null,
    }),
  ]);

  const nodes = sorted([externalInputNode, connectorNode, workflowNode, policyNode, artifactNode]);

  const graphHash = graphHashFromShape({
    runId: input.runId,
    nodes: nodes.map((node) => ({ id: node.id, hashRef: node.hashRef, type: node.type })),
    edges: edges.map((edge) => ({ id: edge.id, hashRef: edge.hashRef, type: edge.type })),
  });

  const casIndex = Object.fromEntries(
    nodes
      .map((node) => [node.id, node.hashRef])
      .concat(edges.map((edge) => [edge.id, edge.hashRef]))
  );
  const nodeHashRefs = Object.fromEntries(nodes.map((node) => [node.id, node.hashRef]));

  return {
    graphId: `graph_${stableHash({ tenant: input.tenantId, runId: input.runId }).slice(0, 16)}`,
    tenantId: input.tenantId,
    runId: input.runId,
    graphHash,
    casIndex,
    nodeHashRefs,
    nodes,
    edges,
  };
}
