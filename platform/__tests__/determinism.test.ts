import { describe, it, expect, beforeEach } from "vitest";
import {
  DeterminismAuditor,
  DeterministicExecutionFence,
  normalizeConnectorOutput,
  deterministicId,
} from "../determinism";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

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
