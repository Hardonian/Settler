/**
 * @jest-environment node
 */

jest.mock("./uuid-collision-log.js", () => ({
  logConflict: jest.fn(async () => undefined),
}));

import { resolveOperatorRunDetailForTenants } from "./operator-run-detail-resolve.js";

function basePrismaMock() {
  return {
    prisma: {
      reconJob: { findFirst: jest.fn() },
      reconResult: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      runSnapshot: { findFirst: jest.fn() },
      runDelta: { findFirst: jest.fn() },
      reconAudit: { findMany: jest.fn() },
      reconciliationRun: { findFirst: jest.fn(), findMany: jest.fn() },
      reconciliationMatch: { count: jest.fn(), findMany: jest.fn() },
      exceptionAdjudicationMemory: { findMany: jest.fn() },
      proofPackage: { findMany: jest.fn() },
      $queryRaw: jest.fn(),
    },
  };
}

describe("resolveOperatorRunDetailForTenants", () => {
  it("returns not_found when tenant scope is empty", async () => {
    const { prisma } = basePrismaMock();
    const out = await resolveOperatorRunDetailForTenants(prisma as never, [], "any-id");
    expect(out).toEqual({ kind: "not_found" });
  });

  it("returns ingestion_run detail through the shared serializer boundary", async () => {
    const { prisma } = basePrismaMock();
    prisma.reconResult.findFirst.mockResolvedValue(null);
    prisma.reconJob.findFirst.mockResolvedValue(null);
    prisma.reconciliationRun.findFirst.mockResolvedValue({
      id: "ing-1",
      tenantId: "t1",
      userId: "u1",
      ingestionId: "ingestion-1",
      name: "Ingestion",
      status: "completed",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: new Date("2026-01-01T00:01:00.000Z"),
      sourceCount: 5,
      targetCount: 5,
      matchedCount: 4,
      unmatchedSourceCount: 1,
      unmatchedTargetCount: 0,
      confidenceAvg: null,
      errorMessage: null,
      traceId: null,
      metadata: {},
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:01:00.000Z"),
    });

    const out = await resolveOperatorRunDetailForTenants(prisma as never, ["t1"], "ing-1");
    expect(out.kind).toBe("ok");
    if (out.kind !== "ok") {
      return;
    }
    expect(out.detail.runKind).toBe("ingestion_run");
    expect(out.detail.sourceModel).toBe("recon_results");
    expect(out.detail.kindDetail.kind).toBe("ingestion_run");
    expect(out.detail.resultContext.latestResultId).toBeNull();
  });

  it("returns recon_job detail with persisted result count and config snapshot fields", async () => {
    const { prisma } = basePrismaMock();
    const jobId = "job-1";
    const tenantId = "t1";

    const res = {
      id: "res-1",
      reconJobId: jobId,
      tenantId,
      status: "completed",
      startedAt: new Date("2026-01-01T00:10:00.000Z"),
      completedAt: new Date("2026-01-01T00:11:00.000Z"),
      sourceCount: 2,
      targetCount: 2,
      matchedCount: 2,
      unmatchedSourceCount: 0,
      unmatchedTargetCount: 0,
      conflictCount: 0,
      errorMessage: null,
      inputHash: "ih",
      snapshotId: "snap-1",
      summary: {},
      metadata: {},
    };

    prisma.reconciliationRun.findFirst.mockResolvedValue(null);
    prisma.reconResult.findFirst.mockResolvedValue(res);
    prisma.reconJob.findFirst.mockResolvedValue({
      id: jobId,
      tenantId,
      name: "Job",
      status: "completed",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      templateId: "tpl-1",
      sourceAdapter: "a",
      targetAdapter: "b",
      sourceConfigEncrypted: "x",
      targetConfigEncrypted: "y",
      validationRules: [],
      reconStrategy: "deterministic",
      metadata: {},
      results: [
        {
          ...res,
        },
      ],
      _count: { results: 3 },
    });

    prisma.reconResult.findMany.mockResolvedValue([res]);
    prisma.reconResult.count.mockResolvedValue(3);
    prisma.runSnapshot.findFirst.mockResolvedValue({
      id: "snap-1",
      inputHash: "ih",
      adapterConfigHashes: {},
      jobConfig: {},
      ruleVersions: [],
      createdAt: new Date("2026-01-01T00:09:00.000Z"),
    });
    prisma.reconAudit.findMany.mockResolvedValue([]);
    prisma.runDelta.findFirst.mockResolvedValue(null);
    prisma.reconciliationMatch.findMany.mockResolvedValue([]);
    prisma.exceptionAdjudicationMemory.findMany.mockResolvedValue([]);
    prisma.proofPackage.findMany.mockResolvedValue([]);
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.reconciliationRun.findMany.mockResolvedValue([{ id: "ing-1" }, { id: "ing-2" }]);
    prisma.reconciliationMatch.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const out = await resolveOperatorRunDetailForTenants(prisma as never, [tenantId], jobId);
    expect(out.kind).toBe("ok");
    if (out.kind !== "ok") {
      return;
    }
    expect(out.detail.runKind).toBe("recon_job");
    expect(out.detail.resultContext.persistedResultCount).toBe(3);
    expect(out.detail.config.snapshotId).toBe("snap-1");
    expect(out.detail.kindDetail.kind).toBe("recon_job");
  });

  it("returns ambiguous_uuid_collision when both backing rows exist", async () => {
    const { prisma } = basePrismaMock();
    const dup = "dup-id";
    const tenantId = "t1";
    prisma.reconResult.findFirst.mockResolvedValue(null);
    prisma.reconJob.findFirst.mockResolvedValue({
      id: dup,
      tenantId,
      name: "J",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceAdapter: "s",
      targetAdapter: "t",
      reconStrategy: "deterministic",
      templateId: null,
      validationRules: [],
      sourceConfigEncrypted: "a",
      targetConfigEncrypted: "b",
      metadata: {},
      results: [],
      _count: { results: 0 },
    });
    prisma.reconciliationRun.findFirst.mockResolvedValue({
      id: dup,
      tenantId,
      userId: "u",
      ingestionId: "ing",
      name: "I",
      status: "completed",
      startedAt: new Date(),
      completedAt: null,
      sourceCount: 0,
      targetCount: 0,
      matchedCount: 0,
      unmatchedSourceCount: 0,
      unmatchedTargetCount: 0,
      confidenceAvg: null,
      errorMessage: null,
      traceId: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.reconciliationRun.findMany.mockResolvedValue([]);

    const out = await resolveOperatorRunDetailForTenants(prisma as never, [tenantId], dup);
    expect(out).toEqual({
      kind: "ambiguous_uuid_collision",
      jobId: dup,
      ingestionRunId: dup,
    });
  });
});
