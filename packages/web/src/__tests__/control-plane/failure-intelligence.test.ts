import {
  computeControlPlaneInsights,
  diagnoseFailure,
} from "@/lib/control-plane/failure-intelligence";

describe("failure intelligence diagnosis", () => {
  it("maps API key errors to API_KEY_MISSING", () => {
    const diagnosis = diagnoseFailure({ error: "Missing API key for provider" });
    expect(diagnosis.category).toBe("API_KEY_MISSING");
    expect(diagnosis.safeAutoRemediationEligible).toBe(false);
  });

  it("maps throttling errors to RATE_LIMITED", () => {
    const diagnosis = diagnoseFailure({ error: "429 rate limit exceeded" });
    expect(diagnosis.category).toBe("RATE_LIMITED");
    expect(diagnosis.safeAutoRemediationEligible).toBe(true);
  });

  it("falls back to UNKNOWN_FATAL when unmatched", () => {
    const diagnosis = diagnoseFailure({ error: "segmentation-fault-ish-unexpected" });
    expect(diagnosis.category).toBe("UNKNOWN_FATAL");
    expect(diagnosis.escalationRequired).toBe(true);
  });
});

describe("control-plane computed insights", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns provider-key insight when model providers are unavailable", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const insights = computeControlPlaneInsights();
    expect(insights.some((insight) => insight.id === "insight-provider-key-missing")).toBe(true);
  });

  it("returns insufficient-data insight when base configuration exists", () => {
    process.env.OPENAI_API_KEY = "sk-test-123456789";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-12345";

    const insights = computeControlPlaneInsights();
    expect(insights).toHaveLength(1);
    expect(insights[0]?.id).toBe("insight-insufficient-failures");
  });
});
