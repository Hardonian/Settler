import { describe, it, expect, beforeEach } from "vitest";
import { AICopilot } from "../ai-copilot";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

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
