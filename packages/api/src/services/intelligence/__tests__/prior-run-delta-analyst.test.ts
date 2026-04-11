import { PriorRunDeltaAnalystService } from "../prior-run-delta-analyst";
import type { RunDeltaResult } from "../run-delta";

jest.mock("@settler/reconciliation-core", () =>
  jest.requireActual<typeof import("@settler/reconciliation-core")>("@settler/reconciliation-core")
);

describe("PriorRunDeltaAnalystService", () => {
  it("persists worker run with content hash", async () => {
    const created: Record<string, unknown> = {};
    const prisma = {
      workerRun: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(created, data, { id: "wr-1" });
          return {
            id: "wr-1",
            tenantId: data["tenantId"],
            workerKey: data["workerKey"],
            workerVersion: data["workerVersion"],
            trigger: data["trigger"],
            runDeltaId: data["runDeltaId"],
            status: data["status"],
            output: data["output"],
            evidence: data["evidence"],
            degradedReasons: data["degradedReasons"],
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            completedAt: new Date("2026-01-01T00:00:00.000Z"),
          };
        }),
      },
    };

    const delta: RunDeltaResult = {
      id: "delta-1",
      tenantId: "t1",
      currentRunId: "c1",
      previousRunId: "p1",
      jobId: "j1",
      inputChanged: false,
      sourceDataChanged: false,
      targetDataChanged: false,
      totalDelta: 0,
      matchedDelta: 0,
      unmatchedDelta: 0,
      exceptionDelta: 1,
      severityDeltas: { critical: 0, high: 1, medium: 0, low: 0 },
      newExceptionPatterns: [],
      resolvedPatterns: [],
      configDriftDetected: false,
      configDriftSummary: [],
      confidenceDelta: null,
      qualityScoreDelta: null,
      deltaGeneratedAt: new Date(),
    };

    const svc = new PriorRunDeltaAnalystService(prisma as never);
    const out = await svc.recordAnalysis({
      tenantId: "t1",
      runDeltaId: "delta-1",
      delta,
      trigger: "test",
    });

    expect(out).not.toBeNull();
    expect(out?.output.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(prisma.workerRun.create).toHaveBeenCalled();
  });
});
