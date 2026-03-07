export type TrustGraphNodeType =
  | "workflow_execution"
  | "artifact"
  | "policy_decision"
  | "connector"
  | "external_input";

export type TrustGraphEdgeType =
  | "derived_from"
  | "verified_by"
  | "policy_evaluated_by"
  | "produced_artifact";

export interface TrustGraphNode {
  id: string;
  type: TrustGraphNodeType;
  hashRef: string;
  label: string;
  runId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface TrustGraphEdge {
  id: string;
  from: string;
  to: string;
  type: TrustGraphEdgeType;
  hashRef: string;
  metadata: Record<string, unknown>;
}

export interface TrustGraph {
  graphId: string;
  runId: string;
  tenantId: string;
  graphHash: string;
  casIndex: Record<string, string>;
  nodeHashRefs: Record<string, string>;
  nodes: TrustGraphNode[];
  edges: TrustGraphEdge[];
}

export interface ArtifactLineage {
  runId: string;
  artifactNodeId: string;
  lineage: Array<{
    node: TrustGraphNode;
    viaEdge: TrustGraphEdge | null;
  }>;
}

export interface PolicyImpact {
  runId: string;
  policyNodeId: string;
  impactedArtifacts: TrustGraphNode[];
  impactedExecutionNodes: TrustGraphNode[];
}

export interface ProofVerification {
  runId: string;
  verified: boolean;
  checks: {
    hasWorkflowNode: boolean;
    hasArtifactNode: boolean;
    hasPolicyNode: boolean;
    graphHashMatches: boolean;
    proofReferencesGraphNodes: boolean;
  };
  graphHash: string;
  proofNodeRefs: string[];
}
