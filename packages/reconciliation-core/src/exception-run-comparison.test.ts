import {
  buildExceptionRunComparisonSnapshotForRunIds,
  resolveRunKindsForTenantRunIds,
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
        findMany: jest.fn().mockResolvedValue([{ id: "ing-1" }]),
      },
    } as any;

    const byRun = await buildExceptionRunComparisonSnapshotForRunIds(prisma, "tenant-a", ["ing-1"]);
    const snap = byRun.get("ing-1");
    expect(snap?.available).toBe(false);
    expect(snap?.reasonCodes).toContain("ingestion_run_history_not_comparable");
  });
});
