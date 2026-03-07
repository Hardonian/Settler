import { describe, expect, it } from "@jest/globals";
import { adaptExecution, buildDashboardData, resolveDataMode } from "@/lib/data/adapters";

describe("dashboard adapters", () => {
  it("maps raw execution into deterministic UI model", () => {
    const model = adaptExecution({
      id: "exec_1",
      tenant_id: "tenant_a",
      state: "completed",
      started_at: "2026-03-01T00:00:00.000Z",
      finished_at: "2026-03-01T00:01:00.000Z",
      expected_hash: "sha256:a",
      observed_hash: "sha256:a",
    });

    expect(model.deterministicReplayReady).toBe(true);
    expect(model.tenantId).toBe("tenant_a");
  });

  it("resolves data modes deterministically", () => {
    expect(resolveDataMode(true, false)).toBe("LIVE");
    expect(resolveDataMode(false, true)).toBe("DEMO");
    expect(resolveDataMode(false, false)).toBe("EMPTY");
  });

  it("returns empty-safe dashboard payload", () => {
    const model = buildDashboardData({ mode: "EMPTY" });

    expect(model.executions).toHaveLength(0);
    expect(model.systemHealth.status).toBe("degraded");
  });
});
