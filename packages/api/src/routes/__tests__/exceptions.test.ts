import request from "supertest";
import express from "express";
import { exceptionsRouter } from "../exceptions";
import { AuthRequest } from "../../middleware/auth";

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    reconciliationMatch: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    reconciliationProvenance: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconciliationMatch = mockedPrisma.reconciliationMatch;

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: jest.fn(() => jest.fn((_req: any, _res: any, next: any) => next())),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../services/recon-core/provenance-service", () => ({
  ProvenanceService: jest.fn().mockImplementation(() => ({
    recordReviewDecision: jest.fn().mockResolvedValue(undefined),
    recordReviewDecisionInTransaction: jest.fn().mockResolvedValue(undefined),
    recordStatusTransition: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe("exceptions routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      (req as AuthRequest).traceId = "00000000-0000-4000-8000-000000000010";
      (req as AuthRequest).requestId = "req-123";
      next();
    });
    app.use("/api", exceptionsRouter);

    jest.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockedPrisma) => unknown) =>
      callback(mockedPrisma)
    );
  });

  it("lists exceptions with tenant-scoped status filtering", async () => {
    mockReconciliationMatch.findMany.mockResolvedValueOnce([
      {
        id: "exc-1",
        tenantId: "tenant-123",
        runId: "run-1",
        status: "dismissed",
        matchType: "unmatched",
        confidence: 0.5,
        reviewed: true,
        reviewedAt: new Date("2026-03-17T10:00:00Z"),
        reviewedBy: "user-456",
        matchReason: "ignored resolution",
        resolutionReason: "ignored",
        notes: "False positive",
        amountDiff: null,
        dateDiff: null,
        severity: "high",
        createdAt: new Date("2026-03-17T09:00:00Z"),
        updatedAt: new Date("2026-03-17T10:00:00Z"),
        sourceTransaction: { category: "timing_difference", description: "Timing diff" },
      },
    ]);
    mockReconciliationMatch.count.mockResolvedValueOnce(1);

    const res = await request(app).get("/api/exceptions?status=dismissed");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ total: 1, hasMore: false });
    expect(res.body.data[0]).toMatchObject({ id: "exc-1", status: "dismissed" });
    expect(mockReconciliationMatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-123",
          status: "dismissed",
        }),
      })
    );
  });

  it("returns exception detail with provenance and adjudication history", async () => {
    mockReconciliationMatch.findFirst.mockResolvedValueOnce({
      id: "exc-1",
      tenantId: "tenant-123",
      runId: "run-1",
      status: "open",
      matchType: "unmatched",
      confidence: 0.5,
      reviewed: false,
      reviewedAt: null,
      reviewedBy: null,
      matchReason: null,
      resolutionReason: null,
      notes: null,
      amountDiff: null,
      dateDiff: null,
      severity: "medium",
      metadata: {
        adjudicationHistory: [{ actorId: "user-1", action: "note_added" }],
      },
      createdAt: new Date("2026-03-17T09:00:00Z"),
      updatedAt: new Date("2026-03-17T10:00:00Z"),
      run: { id: "run-1", status: "completed", startedAt: new Date(), completedAt: new Date() },
      sourceTransaction: { id: "src-1", category: "amount_mismatch", description: "Amount mismatch" },
    });
    mockedPrisma.reconciliationProvenance.findMany.mockResolvedValueOnce([
      { id: "prov-1", sequence: 1, eventType: "review_decision", createdAt: new Date() },
    ]);

    const res = await request(app).get("/api/exceptions/exc-1");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: "exc-1",
      status: "open",
      adjudicationHistory: [{ actorId: "user-1", action: "note_added" }],
    });
    expect(mockedPrisma.reconciliationProvenance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-123", matchId: "exc-1" },
      })
    );
  });

  it("resolves an open exception and returns explicit outcome semantics", async () => {
    mockReconciliationMatch.findFirst.mockResolvedValueOnce({
      id: "exc-1",
      runId: "run-1",
      tenantId: "tenant-123",
      status: "open",
      metadata: {},
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null,
      matchReason: null,
      resolutionReason: null,
      notes: null,
    });

    const res = await request(app)
      .post("/api/exceptions/exc-1/resolve")
      .send({ resolution: "matched", notes: "Matched after manual review" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Exception resolved successfully");
    expect(res.body.data).toMatchObject({
      id: "exc-1",
      status: "resolved",
      resolution: "matched",
      resolutionReason: "matched",
      outcome: "resolved",
    });
  });

  it("treats identical repeat resolutions as idempotent no-ops", async () => {
    mockReconciliationMatch.findFirst.mockResolvedValueOnce({
      id: "exc-1",
      runId: "run-1",
      tenantId: "tenant-123",
      status: "resolved",
      metadata: {
        latestAdjudication: {
          resolution: "matched",
        },
      },
      reviewed: true,
      reviewedBy: "user-456",
      reviewedAt: new Date("2026-03-20T12:00:00Z"),
      matchReason: "Matched after manual review",
      resolutionReason: "matched",
      notes: "Matched after manual review",
    });

    const res = await request(app)
      .post("/api/exceptions/exc-1/resolve")
      .send({ resolution: "matched", notes: "Matched after manual review" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Exception already resolved");
    expect(res.body.data.outcome).toBe("already_resolved");
    expect(mockReconciliationMatch.update).not.toHaveBeenCalled();
    expect(mockedPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("bulk resolves exceptions with duplicate suppression and explicit skipped counts", async () => {
    mockReconciliationMatch.findFirst
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000001",
        runId: "run-1",
        tenantId: "tenant-123",
        status: "dismissed",
        metadata: {
          latestAdjudication: {
            resolution: "ignored",
          },
        },
        reviewed: true,
        reviewedBy: "user-456",
        reviewedAt: new Date("2026-03-20T12:00:00Z"),
        matchReason: "Bulk ignore - false positives",
        resolutionReason: "ignored",
        notes: "Bulk ignore - false positives",
      })
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000002",
        runId: "run-2",
        tenantId: "tenant-123",
        status: "open",
        metadata: {},
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        matchReason: null,
        resolutionReason: null,
        notes: null,
      });

    const res = await request(app)
      .post("/api/exceptions/bulk-resolve")
      .send({
        exceptionIds: [
          "00000000-0000-4000-8000-000000000001",
          "00000000-0000-4000-8000-000000000001",
          "00000000-0000-4000-8000-000000000002",
        ],
        resolution: "ignored",
        notes: "Bulk ignore - false positives",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      resolved: 1,
      alreadyResolved: 1,
      duplicateRequestCount: 1,
      skipped: 2,
    });
  });

  it("returns exception statistics with status buckets", async () => {
    mockReconciliationMatch.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);
    mockReconciliationMatch.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/exceptions/stats");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      total: 10,
      byStatus: {
        open: 4,
        inProgress: 2,
        resolved: 3,
        dismissed: 1,
      },
    });
  });
});
