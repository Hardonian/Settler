import type { ReconciliationProofCapsule } from "@settler/protocol";
import {
  findPolicyImpact,
  getExecutionGraph,
  traceArtifactLineage,
  verifyProofChain,
} from "@/lib/trust-graph/explorer";

describe("trust graph explorer", () => {
  const proofCapsule = {
    capsuleVersion: "1.0.0",
    jobId: "run_123",
    inputHash: "input_hash",
    ruleHash: "rule_hash",
    outputHash: "output_hash",
    versionHash: "version_hash",
    createdAt: "2026-01-01T00:00:00.000Z",
    signature: "sig",
    signer: "Settler-Core",
  } as ReconciliationProofCapsule;

  const baseInput = {
    tenantId: "tenant_1",
    runId: "run_123",
    proofCapsule,
    metadata: { sourceAdapter: "stripe", fingerprint: "fp_1", policyId: "strict" },
    summary: { policyEvaluation: "approved" },
  };

  it("builds deterministic graph shape", () => {
    const graphA = getExecutionGraph(baseInput);
    const graphB = getExecutionGraph(baseInput);

    expect(graphA.graphHash).toBe(graphB.graphHash);
    expect(graphA.nodes.map((node) => node.type).sort()).toEqual([
      "artifact",
      "connector",
      "external_input",
      "policy_decision",
      "workflow_execution",
    ]);
    expect(graphA.edges.map((edge) => edge.type).sort()).toEqual([
      "derived_from",
      "derived_from",
      "policy_evaluated_by",
      "produced_artifact",
      "verified_by",
    ]);
  });

  it("traces artifact lineage back to input", () => {
    const lineage = traceArtifactLineage(baseInput);
    const nodeTypes = lineage.lineage.map((item) => item.node.type);
    expect(nodeTypes).toContain("artifact");
    expect(nodeTypes).toContain("policy_decision");
    expect(nodeTypes).toContain("workflow_execution");
    expect(nodeTypes).toContain("connector");
    expect(nodeTypes).toContain("external_input");
  });

  it("verifies proof chain references graph nodes", () => {
    const graph = getExecutionGraph(baseInput);
    const verification = verifyProofChain({
      ...baseInput,
      proofCapsule: {
        ...proofCapsule,
        graphHash: graph.graphHash,
      } as unknown as ReconciliationProofCapsule,
    });

    expect(verification.verified).toBe(true);
    expect(verification.checks.proofReferencesGraphNodes).toBe(true);
  });

  it("calculates policy impact", () => {
    const impact = findPolicyImpact(baseInput);
    expect(impact.impactedArtifacts.length).toBeGreaterThan(0);
    expect(impact.impactedExecutionNodes.length).toBeGreaterThan(0);
  });
});
