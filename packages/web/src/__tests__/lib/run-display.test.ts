import { reconciliationRunStatusToBadgeType } from "@/lib/console/run-display";

describe("reconciliationRunStatusToBadgeType", () => {
  test("maps known reconciliation run statuses", () => {
    expect(reconciliationRunStatusToBadgeType("completed")).toBe("completed");
    expect(reconciliationRunStatusToBadgeType("FAILED")).toBe("failed");
    expect(reconciliationRunStatusToBadgeType(" running ")).toBe("running");
    expect(reconciliationRunStatusToBadgeType("pending")).toBe("pending");
  });

  test("maps unknown persisted values to unknown badge type", () => {
    expect(reconciliationRunStatusToBadgeType("cancelled")).toBe("unknown");
    expect(reconciliationRunStatusToBadgeType("")).toBe("unknown");
    expect(reconciliationRunStatusToBadgeType(null)).toBe("unknown");
    expect(reconciliationRunStatusToBadgeType(undefined)).toBe("unknown");
  });

  test("maps extended aliases used by canonical status normalization", () => {
    expect(reconciliationRunStatusToBadgeType("success")).toBe("completed");
    expect(reconciliationRunStatusToBadgeType("queued")).toBe("pending");
  });
});
