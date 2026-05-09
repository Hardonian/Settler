import { describe, it, expect, beforeEach } from "vitest";
import { PolicySimulator } from "../policy-simulator";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

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
