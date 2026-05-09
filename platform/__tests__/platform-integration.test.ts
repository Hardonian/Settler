/**
 * Platform Integration Tests
 *
 * Validates that all subsystems work together as a unified platform.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { TrustGraph } from "../trust-graph";
import { PolicySimulator } from "../policy-simulator";
import { AICopilot } from "../ai-copilot";
import { DeterminismAuditor } from "../determinism";
import {
  TrustGraphConsumer,
  ObservabilityConsumer,
  PolicyAuditConsumer,
  EventConsumerRegistry,
} from "../event-consumers";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

describe("Platform Integration (E2E)", () => {
  it("should flow execution through trust graph, events, policy, and observability", async () => {
    // 1. Set up platform components
    const graph = new TrustGraph();
    const copilot = new AICopilot();
    const simulator = new PolicySimulator();
    const auditor = new DeterminismAuditor();
    const registry = new EventConsumerRegistry();
    const observability = new ObservabilityConsumer();
    const policyAudit = new PolicyAuditConsumer();

    registry.register(new TrustGraphConsumer(graph));
    registry.register(observability);
    registry.register(policyAudit);

    const tenantId = "t-integration";

    // 2. Record an execution in the trust graph
    const execution: Execution = {
      executionId: "exec-int-1",
      runId: "run-int-1",
      tenantId,
      policyId: "policy-strict",
      engineVersion: "1.0.0",
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      inputHash: "input-hash",
      configHash: "config-hash",
      outputHash: "output-hash",
      runFingerprint: "fp-integration",
    };
    const execNode = graph.recordExecution(execution);

    // 3. Record artifact + proof
    const artifact: Artifact = {
      artifactId: "art-int-1",
      contentHash: "artifact-hash",
      artifactType: "evidence_bundle",
      tenantId,
      executionId: "exec-int-1",
      createdAt: "2025-01-01T00:00:01Z",
      sizeBytes: 2048,
      storageRef: "/artifacts/int-1",
    };
    graph.recordArtifact(artifact, execNode.nodeId);

    const proof: Proof = {
      proofId: "proof-int-1",
      executionId: "exec-int-1",
      tenantId,
      runFingerprint: "fp-integration",
      hashChain: ["h1", "h2", "h3"],
      inputHash: "input-hash",
      configHash: "config-hash",
      outputHash: "output-hash",
      policyHash: "policy-hash",
      engineVersion: "1.0.0",
      createdAt: "2025-01-01T00:00:02Z",
      verified: true,
      verifiedAt: "2025-01-01T00:00:03Z",
    };
    graph.recordProof(proof, execNode.nodeId);
    graph.recordPolicyGovernance(execNode.nodeId, "policy-strict", "policy-hash", tenantId);

    // 4. Dispatch events through the registry
    await registry.dispatch({
      eventId: "ev-int-1",
      idempotencyKey: "ik-int-1",
      tenantId,
      executionId: "exec-int-1",
      eventType: "execution.completed",
      eventVersion: 1,
      sequence: 1,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-int-1",
        tenantId,
        executionId: "exec-int-1",
        runId: "run-int-1",
      },
      payload: { runFingerprint: "fp-integration" },
    });

    await registry.dispatch({
      eventId: "ev-int-2",
      idempotencyKey: "ik-int-2",
      tenantId,
      executionId: "exec-int-1",
      eventType: "policy.evaluated",
      eventVersion: 1,
      sequence: 2,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-int-2",
        tenantId,
        executionId: "exec-int-1",
        runId: "run-int-1",
      },
      payload: { policyId: "policy-strict", decision: "allowed" },
    });

    // 5. Verify trust graph state
    const snapshot = graph.snapshot(tenantId);
    expect(snapshot.nodes.length).toBeGreaterThanOrEqual(4); // exec, artifact, proof, policy
    expect(snapshot.edges.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.rootHash).toBeTruthy();

    // 6. Verify observability captured events
    expect(observability.getRecords(tenantId).length).toBe(2);

    // 7. Verify policy audit captured decision
    const decisions = policyAudit.getDecisions(tenantId);
    expect(decisions.length).toBe(1);
    expect(decisions[0].decision).toBe("allowed");

    // 8. Verify determinism auditor detects replay match
    expect(auditor.assertReplayMatch("fp-integration", "fp-integration", "exec-int-1")).toBe(true);
    expect(auditor.hasViolations()).toBe(false);

    // 9. AI copilot can suggest but not execute
    const suggestion = copilot.suggest({
      tenantId,
      executionId: "exec-int-1",
      category: "anomaly_detection",
      title: "Unusual pattern",
      description: "Revenue divergence detected",
      confidence: 0.92,
    });
    expect(suggestion.status).toBe("pending");

    // 10. Policy simulator can evaluate
    const policy: Policy = {
      policyId: "policy-strict",
      version: "1.0.0",
      policyHash: "policy-hash",
      tenantId,
      evidenceLevel: "full",
      replayRequired: true,
      budgets: {
        maxComputeUnits: 1500,
        maxMemoryUnits: 5000,
        maxCasIoUnits: 200,
        maxReplayCalls: 3,
      },
      identity: { requiredRole: "operator", requiredScopes: [] },
      metadata: { allowDeterministicOverride: false },
    };
    const simResult = simulator.simulate({ policy, executions: [execution] });
    expect(simResult.executionsEvaluated).toBe(1);

    // 11. Trust graph lineage trace
    const lineage = graph.traceLineage("exec-int-1", tenantId);
    expect(lineage.policies.length).toBeGreaterThan(0);
    expect(lineage.proofs.length).toBeGreaterThan(0);
  });
});
