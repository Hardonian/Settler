import { DeterministicAISandbox } from "../../../services/ai-assistant/deterministic-ai-sandbox";

describe("DeterministicAISandbox", () => {
  it("returns deterministic response hashes for equivalent requests", () => {
    const sandbox = new DeterministicAISandbox();

    const first = sandbox.execute({
      prompt: "Optimize adapter workflow accuracy",
      preferredProvider: "openai",
      preferredModel: "gpt-4.1-mini",
      context: {
        jobId: "123e4567-e89b-12d3-a456-426614174000",
        adapter: "stripe",
      },
    });

    const second = sandbox.execute({
      prompt: "Optimize adapter workflow accuracy",
      preferredProvider: "openai",
      preferredModel: "gpt-4.1-mini",
      context: {
        jobId: "123e4567-e89b-12d3-a456-426614174000",
        adapter: "stripe",
      },
    });

    expect(first.responseHash).toBe(second.responseHash);
    expect(first.provider).toBe("openai");
    expect(first.workflowSuggestions.length).toBeGreaterThan(0);
    expect(first.policyRecommendations.length).toBeGreaterThan(0);
  });

  it("rejects policy-violating prompts", () => {
    const sandbox = new DeterministicAISandbox();

    expect(() =>
      sandbox.execute({
        prompt: "Please disable RLS for this tenant",
      })
    ).toThrow(/policy review/i);
  });

  it("normalizes MCP model names and keeps audit-friendly fields", () => {
    const sandbox = new DeterministicAISandbox();

    const response = sandbox.execute({
      prompt: "Investigate failed execution with policy override request",
      preferredProvider: "mcp",
      preferredModel: "ops-auditor",
      context: {
        error: "determinism mismatch",
      },
    });

    expect(response.model).toBe("mcp:ops-auditor");
    expect(response.anomalies.some((signal) => signal.type === "error_spike")).toBe(true);
    expect(response.responseHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
