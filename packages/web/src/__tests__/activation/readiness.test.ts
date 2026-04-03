import {
  readinessStateToTaskState,
  resolveReadinessState,
  summarizeReadinessCounts,
} from "@/lib/activation/readiness";

describe("activation readiness helpers", () => {
  it("treats unavailable as the highest-priority state", () => {
    expect(
      resolveReadinessState([{ state: "ready" }, { state: "degraded" }, { state: "unavailable" }])
    ).toBe("unavailable");
  });

  it("summarizes readiness counts across all explicit states", () => {
    expect(
      summarizeReadinessCounts([
        { state: "ready" },
        { state: "degraded" },
        { state: "degraded" },
        { state: "setup_required" },
        { state: "unavailable" },
      ])
    ).toEqual({
      ready: 1,
      degraded: 2,
      setup_required: 1,
      unavailable: 1,
    });
  });

  it("maps readiness states into actionable task states", () => {
    expect(readinessStateToTaskState("ready")).toBe("completed");
    expect(readinessStateToTaskState("degraded")).toBe("current");
    expect(readinessStateToTaskState("setup_required")).toBe("current");
    expect(readinessStateToTaskState("unavailable")).toBe("blocked");
  });
});
