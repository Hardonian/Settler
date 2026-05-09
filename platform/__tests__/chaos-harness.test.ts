import { describe, it, expect, beforeEach } from "vitest";
import { ChaosHarness } from "../chaos-harness";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

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
