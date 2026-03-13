import { getSyncDurabilityPresentation } from "@/lib/integrations/sync-run-persistence";

describe("getSyncDurabilityPresentation", () => {
  it("returns recovery-required when explicit recovery flag is true", () => {
    expect(getSyncDurabilityPresentation("durable_atomic", true)).toEqual({
      label: "Recovery required",
      tone: "danger",
      description:
        "Partial write detected. Review sync_recovery_required evidence before trusting this run.",
    });
  });

  it("returns atomic durable when status is durable_atomic", () => {
    expect(getSyncDurabilityPresentation("durable_atomic", false)).toEqual({
      label: "Atomic durable",
      tone: "success",
      description: "Persistence completed atomically.",
    });
  });

  it("returns degraded durable when status is durable_non_atomic", () => {
    expect(getSyncDurabilityPresentation("durable_non_atomic", false)).toEqual({
      label: "Degraded durable",
      tone: "warning",
      description: "Write completed through fallback path. Verify sync_atomic_fallback evidence.",
    });
  });

  it("returns unknown for legacy runs without durability metadata", () => {
    expect(getSyncDurabilityPresentation(null, false)).toEqual({
      label: "Durability unknown",
      tone: "neutral",
      description: "Run predated durability truth fields or status was not captured.",
    });
  });
});
