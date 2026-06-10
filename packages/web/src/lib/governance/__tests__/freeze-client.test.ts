import {
  getApiErrorMessage,
  getGovernanceRecoveryHref,
  parseGovernanceFreezeError,
} from "@/lib/governance/freeze-client";

describe("freeze-client helpers", () => {
  it("parses governance freeze payloads", () => {
    expect(
      parseGovernanceFreezeError(
        {
          error: "GOVERNANCE_FREEZE_ACTIVE",
          message: "Writes are frozen",
          freeze_reason: "Validation window",
          frozen_at: "2026-03-17T10:00:00Z",
          traceId: "trace-123",
        },
        423
      )
    ).toEqual({
      message: "Writes are frozen",
      reason: "Validation window",
      frozenAt: "2026-03-17T10:00:00Z",
      traceId: "trace-123",
    });
  });

  it("returns null for non-freeze payloads", () => {
    expect(parseGovernanceFreezeError({ error: "NOPE" }, 400)).toBeNull();
  });

  it("falls back to readable API messages", () => {
    expect(getApiErrorMessage({ message: "Readable error" }, "fallback")).toBe("Readable error");
    expect(getApiErrorMessage({ error: "Only error" }, "fallback")).toBe("Only error");
    expect(getApiErrorMessage({}, "fallback")).toBe("fallback");
  });

  it("returns the canonical governance recovery href", () => {
    expect(getGovernanceRecoveryHref()).toBe("/console/settings?tab=governance#governance");
  });
});
