/**
 * Platform Integration Tests
 *
 * Validates that all subsystems work together as a unified platform.
 * Tests cover: primitives consistency, trust graph lineage, determinism
 * enforcement, AI safety boundaries, policy simulation, chaos harness
 * invariants, event consumer dispatch, and MCP tool surface.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TrustGraph } from "../trust-graph";
import { PolicySimulator } from "../policy-simulator";
import { AICopilot } from "../ai-copilot";
import {
  DeterminismAuditor,
  DeterministicExecutionFence,
  normalizeConnectorOutput,
  deterministicId,
} from "../determinism";
import { ChaosHarness } from "../chaos-harness";
import {
  TrustGraphConsumer,
  ObservabilityConsumer,
  PolicyAuditConsumer,
  ConnectorMetricsConsumer,
  EventConsumerRegistry,
} from "../event-consumers";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

// ────────────────────────────────────────────────────────────
// Trust Graph
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
// Determinism Enforcement
// ────────────────────────────────────────────────────────────
describe("DeterminismAuditor", () => {
  let auditor: DeterminismAuditor;

  beforeEach(() => {
    auditor = new DeterminismAuditor();
  });

  it("should detect timestamp in deterministic path", () => {
    auditor.assertNoTimestampInDeterministicPath(
      { ts: "2025-01-01T00:00:00Z" },
      "engine",
      "output"
    );
    expect(auditor.hasCriticalViolations()).toBe(true);
  });

  it("should detect connector non-deterministic output", () => {
    auditor.assertConnectorOutputDeterministic(
      { id: "550e8400-e29b-41d4-a716-446655440000" },
      "stripe"
    );
    expect(auditor.hasViolations()).toBe(true);
  });

  it("should detect AI state mutation", () => {
    auditor.assertAIAdvisoryOnly("modify_workflow", true, "copilot");
    expect(auditor.hasCriticalViolations()).toBe(true);
  });

  it("should detect replay mismatch", () => {
    const result = auditor.assertReplayMatch("fp-a", "fp-b", "exec-1");
    expect(result).toBe(false);
    expect(auditor.hasCriticalViolations()).toBe(true);
  });

  it("should produce a report", () => {
    auditor.assertAIAdvisoryOnly("x", true, "test");
    const report = auditor.report();
    expect(report).toContain("CRITICAL");
  });
});

describe("DeterministicExecutionFence", () => {
  it("should block operations inside fence", async () => {
    const fence = new DeterministicExecutionFence();
    let blocked = false;
    await fence.guard(async () => {
      try {
        fence.assertNotInFence("Date.now()");
      } catch {
        blocked = true;
      }
    });
    expect(blocked).toBe(true);
  });

  it("should allow operations outside fence", () => {
    const fence = new DeterministicExecutionFence();
    expect(() => fence.assertNotInFence("Date.now()")).not.toThrow();
  });
});

describe("normalizeConnectorOutput", () => {
  it("should replace UUIDs deterministically", () => {
    const output = { id: "550e8400-e29b-41d4-a716-446655440000" };
    const normalized = normalizeConnectorOutput(output, "stripe");
    expect(normalized.id).not.toBe(output.id);
    // Same input produces same output
    const normalized2 = normalizeConnectorOutput(output, "stripe");
    expect(normalized.id).toBe(normalized2.id);
  });
});

describe("deterministicId", () => {
  it("should produce stable IDs", () => {
    const id1 = deterministicId("ns", "a", "b");
    const id2 = deterministicId("ns", "a", "b");
    expect(id1).toBe(id2);
  });
});

// ────────────────────────────────────────────────────────────
// AI Copilot Safety
// ────────────────────────────────────────────────────────────
describe("AICopilot", () => {
  let copilot: AICopilot;

  beforeEach(() => {
    copilot = new AICopilot();
  });

  it("should create suggestions", () => {
    const suggestion = copilot.suggest({
      tenantId: "t-1",
      category: "anomaly_detection",
      title: "Unusual spike",
      description: "Transaction volume 3x above normal",
      confidence: 0.85,
    });
    expect(suggestion.status).toBe("pending");
    expect(suggestion.auditTrail.length).toBe(1);
  });

  it("should require human review for acceptance", () => {
    const suggestion = copilot.suggest({
      tenantId: "t-1",
      category: "anomaly_detection",
      title: "Test",
      description: "Test",
      confidence: 0.5,
    });
    expect(() => copilot.accept(suggestion.suggestionId, "")).toThrow("Human review");
  });

  it("should block suggestions during deterministic execution", async () => {
    const fence = copilot.executionFence;
    let blocked = false;
    await fence.guard(async () => {
      try {
        copilot.suggest({
          tenantId: "t-1",
          category: "anomaly_detection",
          title: "Test",
          description: "Test",
          confidence: 0.5,
        });
      } catch {
        blocked = true;
      }
    });
    expect(blocked).toBe(true);
  });

  it("should enforce max suggestions per execution", () => {
    const config = { maxSuggestionsPerExecution: 2 };
    const limited = new AICopilot(config);
    limited.suggest({
      tenantId: "t",
      executionId: "e",
      category: "anomaly_detection",
      title: "1",
      description: "1",
      confidence: 0.5,
    });
    limited.suggest({
      tenantId: "t",
      executionId: "e",
      category: "anomaly_detection",
      title: "2",
      description: "2",
      confidence: 0.5,
    });
    expect(() =>
      limited.suggest({
        tenantId: "t",
        executionId: "e",
        category: "anomaly_detection",
        title: "3",
        description: "3",
        confidence: 0.5,
      })
    ).toThrow("Max suggestions");
  });
});

// ────────────────────────────────────────────────────────────
// Policy Simulator
// ────────────────────────────────────────────────────────────
describe("PolicySimulator", () => {
  let simulator: PolicySimulator;
  const policy: Policy = {
    policyId: "p-1",
    version: "1.0.0",
    policyHash: "hash-1",
    tenantId: "t-1",
    evidenceLevel: "full",
    replayRequired: true,
    budgets: {
      maxComputeUnits: 100,
      maxMemoryUnits: 500,
      maxCasIoUnits: 50,
      maxReplayCalls: 3,
    },
    identity: { requiredRole: "operator", requiredScopes: [] },
    metadata: { allowDeterministicOverride: false },
  };

  beforeEach(() => {
    simulator = new PolicySimulator();
  });

  it("should simulate policy against executions", () => {
    const executions: Execution[] = [
      {
        executionId: "e-1",
        runId: "r-1",
        tenantId: "t-1",
        policyId: "p-1",
        engineVersion: "1.0.0",
        status: "completed",
        startedAt: "2025-01-01T00:00:00Z",
        inputHash: "a",
        configHash: "b",
      },
    ];
    const result = simulator.simulate({ policy, executions });
    expect(result.executionsEvaluated).toBe(1);
  });

  it("should compare two policies", () => {
    const policyB: Policy = {
      ...policy,
      policyId: "p-2",
      budgets: { ...policy.budgets, maxComputeUnits: 10 },
    };
    const executions: Execution[] = [
      {
        executionId: "e-1",
        runId: "r-1",
        tenantId: "t-1",
        policyId: "p-1",
        engineVersion: "1.0.0",
        status: "completed",
        startedAt: "2025-01-01T00:00:00Z",
        inputHash: "a",
        configHash: "b",
      },
    ];
    const comparison = simulator.compare(policy, policyB, executions);
    expect(comparison.diff).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────
// Chaos Harness
// ────────────────────────────────────────────────────────────
describe("ChaosHarness", () => {
  it("should run worker crash scenario", async () => {
    const harness = new ChaosHarness();
    harness.registerFaultHandler("worker_crash", async () => {
      // Simulate worker crash (no-op in test)
    });
    harness.registerInvariantChecker("replay_correctness", async () => ({
      invariantId: "replay_correctness",
      name: "Replay Correctness",
      description: "Replay produces identical output",
      check: "replay_correctness",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));
    harness.registerInvariantChecker("proof_integrity", async () => ({
      invariantId: "proof_integrity",
      name: "Proof Integrity",
      description: "Proof hash chain is valid",
      check: "proof_integrity",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));
    harness.registerInvariantChecker("execution_idempotency", async () => ({
      invariantId: "execution_idempotency",
      name: "Execution Idempotency",
      description: "Re-execution produces same result",
      check: "execution_idempotency",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));

    const scenario = ChaosHarness.workerCrashScenario();
    const result = await harness.runScenario(scenario);
    expect(result.passed).toBe(true);
    expect(result.invariantsPassed).toBe(3);
  });

  it("should detect failed invariants", async () => {
    const harness = new ChaosHarness();
    harness.registerFaultHandler("connector_failure", async () => {});
    harness.registerInvariantChecker("replay_correctness", async () => ({
      invariantId: "replay_correctness",
      name: "Replay Correctness",
      description: "Failed under connector failure",
      check: "replay_correctness",
      passed: false,
      checkedAt: new Date().toISOString(),
      details: { reason: "connector data missing" },
    }));
    harness.registerInvariantChecker("proof_integrity", async () => ({
      invariantId: "proof_integrity",
      name: "Proof Integrity",
      description: "OK",
      check: "proof_integrity",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));
    harness.registerInvariantChecker("tenant_isolation", async () => ({
      invariantId: "tenant_isolation",
      name: "Tenant Isolation",
      description: "OK",
      check: "tenant_isolation",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));

    const scenario = ChaosHarness.connectorFailureScenario();
    const result = await harness.runScenario(scenario);
    expect(result.passed).toBe(false);
    expect(result.invariantsFailed).toBe(1);
  });

  it("should provide built-in scenarios", () => {
    expect(ChaosHarness.workerCrashScenario().faults.length).toBeGreaterThan(0);
    expect(ChaosHarness.connectorFailureScenario().faults.length).toBeGreaterThan(0);
    expect(ChaosHarness.eventDelayScenario().faults.length).toBeGreaterThan(0);
    expect(ChaosHarness.tenantIsolationScenario().faults.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// Event Consumer Registry
// ────────────────────────────────────────────────────────────
describe("EventConsumerRegistry", () => {
  it("should dispatch events to matching consumers", async () => {
    const graph = new TrustGraph();
    const registry = new EventConsumerRegistry();
    const observability = new ObservabilityConsumer();
    const policyAudit = new PolicyAuditConsumer();
    const connectorMetrics = new ConnectorMetricsConsumer();

    registry.register(new TrustGraphConsumer(graph));
    registry.register(observability);
    registry.register(policyAudit);
    registry.register(connectorMetrics);

    const event: PlatformEvent = {
      eventId: "ev-1",
      idempotencyKey: "ik-1",
      tenantId: "t-1",
      executionId: "exec-1",
      eventType: "execution.completed",
      eventVersion: 1,
      sequence: 1,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-1",
        tenantId: "t-1",
        executionId: "exec-1",
        runId: "run-1",
      },
      payload: { runFingerprint: "fp-1" },
    };

    await registry.dispatch(event);

    // Observability should capture all events
    expect(observability.getRecords().length).toBe(1);

    // Policy audit should not capture execution events
    expect(policyAudit.getDecisions().length).toBe(0);

    // Connector metrics should not capture execution events
    expect(connectorMetrics.getMetrics().length).toBe(0);
  });

  it("should route connector events to connector consumer", async () => {
    const registry = new EventConsumerRegistry();
    const connectorMetrics = new ConnectorMetricsConsumer();
    registry.register(connectorMetrics);

    const event: PlatformEvent = {
      eventId: "ev-2",
      idempotencyKey: "ik-2",
      tenantId: "t-1",
      executionId: "exec-1",
      eventType: "connector.sync.completed",
      eventVersion: 1,
      sequence: 2,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-2",
        tenantId: "t-1",
        executionId: "exec-1",
        runId: "run-1",
      },
      payload: { connectorId: "stripe", durationMs: 1500, recordCount: 42 },
    };

    await registry.dispatch(event);
    const metrics = connectorMetrics.getMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].connectorId).toBe("stripe");
    expect(metrics[0].recordCount).toBe(42);
  });

  it("should route policy events to policy audit consumer", async () => {
    const registry = new EventConsumerRegistry();
    const policyAudit = new PolicyAuditConsumer();
    registry.register(policyAudit);

    const event: PlatformEvent = {
      eventId: "ev-3",
      idempotencyKey: "ik-3",
      tenantId: "t-1",
      executionId: "exec-1",
      eventType: "policy.evaluated",
      eventVersion: 1,
      sequence: 3,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-3",
        tenantId: "t-1",
        executionId: "exec-1",
        runId: "run-1",
      },
      payload: { policyId: "p-1", decision: "allowed" },
    };

    await registry.dispatch(event);
    const decisions = policyAudit.getDecisions();
    expect(decisions.length).toBe(1);
    expect(decisions[0].decision).toBe("allowed");
  });
});

// ────────────────────────────────────────────────────────────
// End-to-End Platform Integration
// ────────────────────────────────────────────────────────────
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
