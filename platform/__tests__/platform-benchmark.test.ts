/**
 * Platform Performance Benchmarks
 *
 * Simulates scale scenarios to verify platform can handle
 * production workloads for all subsystems.
 */

import { describe, it, expect } from "vitest";
import { TrustGraph } from "../trust-graph";
import { PolicySimulator } from "../policy-simulator";
import { AICopilot } from "../ai-copilot";
import { DeterminismAuditor } from "../determinism";
import { ChaosHarness } from "../chaos-harness";
import { ObservabilityConsumer, EventConsumerRegistry } from "../event-consumers";
import type { Execution, Policy, PlatformEvent } from "../primitives";

function makeExecution(i: number, tenantId: string): Execution {
  return {
    executionId: `exec-${i}`,
    runId: `run-${i}`,
    tenantId,
    policyId: "policy-bench",
    engineVersion: "1.0.0",
    status: "completed",
    startedAt: `2025-01-01T00:00:${String(i % 60).padStart(2, "0")}Z`,
    inputHash: `input-${i}`,
    configHash: `config-${i}`,
    outputHash: `output-${i}`,
    runFingerprint: `fp-${i}`,
  };
}

function makeEvent(i: number, tenantId: string): PlatformEvent {
  return {
    eventId: `ev-${i}`,
    idempotencyKey: `ik-${i}`,
    tenantId,
    executionId: `exec-${i}`,
    eventType: "execution.completed",
    eventVersion: 1,
    sequence: i,
    occurredAt: new Date().toISOString(),
    source: "platform.benchmark",
    severity: "info",
    correlation: {
      correlationId: `corr-${i}`,
      tenantId,
      executionId: `exec-${i}`,
      runId: `run-${i}`,
    },
    payload: { runFingerprint: `fp-${i}` },
  };
}

describe("Performance Benchmarks", () => {
  it("Trust Graph: 10k nodes + edges under 2s", () => {
    const graph = new TrustGraph();
    const start = Date.now();

    for (let i = 0; i < 10_000; i++) {
      const exec = makeExecution(i, "t-bench");
      graph.recordExecution(exec);
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
    expect(graph.stats.nodeCount).toBe(10_000);
  });

  it("Trust Graph: snapshot of 1k nodes under 500ms", () => {
    const graph = new TrustGraph();
    for (let i = 0; i < 1000; i++) {
      graph.recordExecution(makeExecution(i, "t-snap"));
    }

    const start = Date.now();
    const snapshot = graph.snapshot("t-snap");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(500);
    expect(snapshot.rootHash).toBeTruthy();
  });

  it("Policy Simulator: 1k executions under 100ms", () => {
    const simulator = new PolicySimulator();
    const policy: Policy = {
      policyId: "p-bench",
      version: "1.0.0",
      policyHash: "h",
      tenantId: "t-bench",
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
    const executions = Array.from({ length: 1000 }, (_, i) => makeExecution(i, "t-bench"));

    const start = Date.now();
    const result = simulator.simulate({ policy, executions });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(result.executionsEvaluated).toBe(1000);
  });

  it("Event dispatch: 10k events under 1s", async () => {
    const registry = new EventConsumerRegistry();
    const observability = new ObservabilityConsumer();
    registry.register(observability);

    const start = Date.now();
    for (let i = 0; i < 10_000; i++) {
      await registry.dispatch(makeEvent(i, "t-events"));
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    expect(observability.getRecords().length).toBe(10_000);
  });

  it("Determinism Auditor: 10k checks under 500ms", () => {
    const auditor = new DeterminismAuditor();
    const start = Date.now();

    for (let i = 0; i < 10_000; i++) {
      auditor.assertReplayMatch(`fp-${i}`, `fp-${i}`, `exec-${i}`);
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(auditor.hasViolations()).toBe(false);
  });

  it("AI Copilot: 100 suggestions under 100ms", () => {
    const copilot = new AICopilot({ maxSuggestionsPerExecution: 200 });
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      copilot.suggest({
        tenantId: "t-bench",
        executionId: `exec-${i}`,
        category: "anomaly_detection",
        title: `Suggestion ${i}`,
        description: `Anomaly detected in batch ${i}`,
        confidence: 0.8,
      });
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it("Chaos Harness: scenario with 3 invariants under 200ms", async () => {
    const harness = new ChaosHarness();
    harness.registerFaultHandler("worker_crash", async () => {});
    harness.registerInvariantChecker("replay_correctness", async () => ({
      invariantId: "rc",
      name: "RC",
      description: "ok",
      check: "replay_correctness",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));
    harness.registerInvariantChecker("proof_integrity", async () => ({
      invariantId: "pi",
      name: "PI",
      description: "ok",
      check: "proof_integrity",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));
    harness.registerInvariantChecker("execution_idempotency", async () => ({
      invariantId: "ei",
      name: "EI",
      description: "ok",
      check: "execution_idempotency",
      passed: true,
      checkedAt: new Date().toISOString(),
      details: {},
    }));

    const start = Date.now();
    const result = await harness.runScenario(ChaosHarness.workerCrashScenario());
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(result.passed).toBe(true);
  });
});
