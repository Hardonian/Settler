import {
  scheduleViewRefresh,
  getScheduledTasks,
  cleanupScheduler,
} from "../MaterializedViewScheduler";

import { query } from "../../db";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

describe("MaterializedViewScheduler cleanup performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Clear scheduled tasks by unscheduling them or just letting them be overwritten
  });

  it("should query pg_matviews exactly once to verify multiple views", async () => {
    // Schedule some views
    scheduleViewRefresh("tenant1", {
      viewId: "view1",
      active: true,
      refreshConfig: { strategy: "automatic", intervalMinutes: 10, maxStalenessMinutes: 60 },
      stalenessStatus: "fresh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    scheduleViewRefresh("tenant2", {
      viewId: "view2",
      active: true,
      refreshConfig: { strategy: "automatic", intervalMinutes: 10, maxStalenessMinutes: 60 },
      stalenessStatus: "fresh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    scheduleViewRefresh("tenant3", {
      viewId: "view3",
      active: true,
      refreshConfig: { strategy: "automatic", intervalMinutes: 10, maxStalenessMinutes: 60 },
      stalenessStatus: "fresh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock the query to return some existing views
    const mockQuery = query as jest.Mock;

    // In optimized version, it calls SELECT matviewname FROM pg_matviews WHERE matviewname IN ($1, $2, $3)
    mockQuery.mockResolvedValue([
      { matviewname: "mv_tenant1_view1" },
      { matviewname: "mv_tenant3_view3" },
    ]);

    const startTime = performance.now();
    await cleanupScheduler();
    const endTime = performance.now();

    console.info(`Cleanup took ${endTime - startTime} ms`);
    console.info(`query was called ${mockQuery.mock.calls.length} times`);

    // After optimization, it should call query exactly 1 time instead of N times
    expect(mockQuery).toHaveBeenCalledTimes(1);

    const tasks = getScheduledTasks();
    // One view (mv_tenant2_view2) was missing, so it should be cleaned up
    expect(tasks.length).toBe(2);

    // Ensure the query logic uses the IN clause and parameterizes it properly
    expect(mockQuery.mock.calls[0][0]).toContain("= ANY($1)");
  });
});
