import {
  hasActiveRuns,
  hasOpenExceptions,
  shouldPollExceptions,
  shouldPollRuns,
} from "@/lib/console/polling";

describe("console polling heuristics", () => {
  it("keeps run polling active while visible runs are non-terminal", () => {
    expect(
      shouldPollRuns({
        autoRefresh: true,
        runs: [
          { status: "completed", isTerminal: true },
          { status: "running", isTerminal: false },
        ],
        loadingInitialState: false,
      })
    ).toBe(true);
    expect(hasActiveRuns([{ status: "pending" }, { status: "completed", isTerminal: true }])).toBe(
      true
    );
  });

  it("pauses run polling once all visible runs are terminal", () => {
    expect(
      shouldPollRuns({
        autoRefresh: true,
        runs: [
          { status: "completed", isTerminal: true },
          { status: "failed", isTerminal: true },
        ],
        loadingInitialState: false,
      })
    ).toBe(false);
  });

  it("avoids exception polling for resolved-only views", () => {
    expect(
      shouldPollExceptions({
        autoRefresh: true,
        exceptions: [{ status: "resolved" }, { status: "ignored" }],
        loadingInitialState: false,
        statusFilter: "resolved",
      })
    ).toBe(false);
    expect(hasOpenExceptions([{ status: "resolved" }, { status: "investigating" }])).toBe(true);
  });
});
