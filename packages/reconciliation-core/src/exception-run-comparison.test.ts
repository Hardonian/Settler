import {
  buildExceptionRunComparisonSnapshotForRunIds,
  resolveRunKindsForTenantRunIds,
  resolveCanonicalRunAndJobIds,
} from "./exception-run-comparison.js";

describe("exception run comparison", () => {
  it("resolves run kinds with recon_job preferred when both tables have the id", async () => {
    const sharedId = "11111111-1111-4111-8111-111111111111";
    const prisma = {
      reconJob: {
        findMany: jest.fn().mockResolvedValue([{ id: sharedId }]),
      },
      reconciliationRun: {
        findMany: jest.fn().mockResolvedValue([{ id: sharedId }]),
      },
    } as any;

    const kinds = await resolveRunKindsForTenantRunIds(prisma, "tenant-a", [sharedId]);
    expect(kinds.get(sharedId)).toBe("recon_job");
  });

  it("marks ingestion runs as not comparable via unavailable index", async () => {
    const prisma = {
      reconJob: { findMany: jest.fn().mockResolvedValue([]) },
      reconciliationRun: {
        findMany: jest.fn().mockResolvedValue([{ id: "ing-1", jobId: null }]),
      },
    } as any;

    const byRun = await buildExceptionRunComparisonSnapshotForRunIds(prisma, "tenant-a", ["ing-1"]);
    const snap = byRun.get("ing-1");
    expect(snap?.available).toBe(false);
    expect(snap?.reasonCodes).toContain("ingestion_run_history_not_comparable");
  });

  it("resolves ReconciliationRun.id to parent ReconJob.id via resolveCanonicalRunAndJobIds", async () => {
    const prisma = {
      reconciliationRun: {
        findMany: jest.fn().mockResolvedValue([
          { id: "run-uuid-1", jobId: "job-uuid-1" },
          { id: "run-uuid-2", jobId: null },
        ]),
      },
    } as any;

    const result = await resolveCanonicalRunAndJobIds(prisma, "tenant-a", [
      "run-uuid-1",
      "run-uuid-2",
    ]);

    expect(result.uniqueIncomingIds).toEqual(["run-uuid-1", "run-uuid-2"]);
    expect(result.runIdToJobIdMap.get("run-uuid-1")).toBe("job-uuid-1");
    expect(result.resolvedJobIds).toContain("job-uuid-1");
    expect(result.resolvedJobIds).toContain("run-uuid-1");
    expect(result.resolvedJobIds).toContain("run-uuid-2");
  });

  it("resolves parent ReconJob when passing ReconciliationRun.id and returns comparison metadata indexed under both run.id and job.id", async () => {
    const runId = "rec-run-100";
    const jobId = "recon-job-200";

    const prisma: any = {
      reconciliationRun: {
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          if (where.id && where.id.in) {
            return [{ id: runId, jobId: jobId }];
          }
          return [];
        }),
      },
      reconJob: {
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          if (where.id && where.id.in && where.id.in.includes(jobId)) {
            return [{ id: jobId }];
          }
          return [];
        }),
      },
      reconciliationMatch: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "exception-1",
            runId: jobId,
            severity: "high",
            status: "open",
            resolutionReason: "variance",
          },
        ]),
      },
      exceptionAdjudicationMemory: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      proofPackage: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          recon_job_id: jobId,
          rn: 1,
          id: "result-2",
          started_at: new Date("2026-01-02T00:00:00.000Z"),
          status: "completed",
          matched_count: 15,
          unmatched_source_count: 2,
          unmatched_target_count: 1,
          conflict_count: 0,
        },
        {
          recon_job_id: jobId,
          rn: 2,
          id: "result-1",
          started_at: new Date("2026-01-01T00:00:00.000Z"),
          status: "completed",
          matched_count: 10,
          unmatched_source_count: 1,
          unmatched_target_count: 1,
          conflict_count: 0,
        },
      ]),
    };

    const snapshotMap = await buildExceptionRunComparisonSnapshotForRunIds(prisma, "tenant-a", [
      runId,
    ]);

    expect(snapshotMap.has(runId)).toBe(true);
    expect(snapshotMap.has(jobId)).toBe(true);

    const runSnap = snapshotMap.get(runId);
    const jobSnap = snapshotMap.get(jobId);

    expect(runSnap).toBeDefined();
    expect(jobSnap).toBeDefined();
    expect(runSnap).toEqual(jobSnap);
    expect(runSnap?.available).toBe(true);
    expect(runSnap?.state).toBe("available");
    expect(runSnap?.baseline.priorResultId).toBe("result-1");
    expect(runSnap?.deltas.matched).toBe(5);
  });
});
