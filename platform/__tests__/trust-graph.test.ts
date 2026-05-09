import { describe, it, expect, beforeEach } from "vitest";
import { TrustGraph } from "../trust-graph";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

describe("TrustGraph", () => {
  let graph: TrustGraph;
  const tenantId = "tenant-1";

  beforeEach(() => {
    graph = new TrustGraph();
  });

  it("should record execution and generate node", () => {
    const exec: Execution = {
      executionId: "exec-1",
      runId: "run-1",
      tenantId,
      policyId: "policy-1",
      engineVersion: "1.0.0",
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      inputHash: "abc",
      configHash: "def",
      outputHash: "ghi",
      runFingerprint: "fp-1",
    };
    const node = graph.recordExecution(exec);
    expect(node.nodeId).toBeTruthy();
    expect(node.nodeType).toBe("execution");
    expect(node.tenantId).toBe(tenantId);
  });

  it("should record artifact linked to execution", () => {
    const exec: Execution = {
      executionId: "exec-1",
      runId: "run-1",
      tenantId,
      policyId: "policy-1",
      engineVersion: "1.0.0",
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      inputHash: "abc",
      configHash: "def",
    };
    const execNode = graph.recordExecution(exec);
    const artifact: Artifact = {
      artifactId: "art-1",
      contentHash: "content-hash-1",
      artifactType: "evidence_bundle",
      tenantId,
      executionId: "exec-1",
      createdAt: "2025-01-01T00:00:01Z",
      sizeBytes: 1024,
      storageRef: "/artifacts/art-1",
    };
    const artNode = graph.recordArtifact(artifact, execNode.nodeId);
    expect(artNode.nodeType).toBe("artifact");
    expect(graph.stats.edgeCount).toBe(1);
  });

  it("should enforce tenant isolation on edges", () => {
    const nodeA = graph.addNode({
      tenantId: "tenant-A",
      nodeType: "execution",
      referenceId: "exec-a",
      label: "a",
      contentHash: "h-a",
      createdAt: "2025-01-01T00:00:00Z",
      metadata: {},
    });
    const nodeB = graph.addNode({
      tenantId: "tenant-B",
      nodeType: "execution",
      referenceId: "exec-b",
      label: "b",
      contentHash: "h-b",
      createdAt: "2025-01-01T00:00:00Z",
      metadata: {},
    });
    expect(() => graph.addEdge(nodeA.nodeId, nodeB.nodeId, "produced", "tenant-A")).toThrow(
      "cross-tenant"
    );
  });

  it("should produce a deterministic snapshot hash", () => {
    const exec: Execution = {
      executionId: "exec-1",
      runId: "run-1",
      tenantId,
      policyId: "p",
      engineVersion: "1.0.0",
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      inputHash: "a",
      configHash: "b",
    };
    graph.recordExecution(exec);
    const snap1 = graph.snapshot(tenantId);
    const snap2 = graph.snapshot(tenantId);
    expect(snap1.rootHash).toBe(snap2.rootHash);
  });

  it("should trace lineage for an execution", () => {
    const exec: Execution = {
      executionId: "exec-1",
      runId: "run-1",
      tenantId,
      policyId: "p",
      engineVersion: "1.0.0",
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      inputHash: "a",
      configHash: "b",
    };
    const execNode = graph.recordExecution(exec);
    graph.recordPolicyGovernance(execNode.nodeId, "p", "hash-p", tenantId);
    const artifact: Artifact = {
      artifactId: "art-1",
      contentHash: "ch-1",
      artifactType: "evidence_bundle",
      tenantId,
      executionId: "exec-1",
      createdAt: "2025-01-01T00:00:01Z",
      sizeBytes: 512,
      storageRef: "/art-1",
    };
    graph.recordArtifact(artifact, execNode.nodeId);

    const lineage = graph.traceLineage("exec-1", tenantId);
    expect(lineage.policies.length).toBeGreaterThan(0);
    expect(lineage.descendants.length).toBeGreaterThan(0);
  });
});
