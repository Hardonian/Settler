import { ExceptionReviewService } from "../ExceptionReviewService";

describe("ExceptionReviewService", () => {
  const reconciliationMatch = {
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  const auditLog = {
    create: jest.fn(),
  };
  const tx = {
    reconciliationMatch,
    auditLog,
  };
  const prisma = {
    $transaction: jest.fn(),
  };
  const provenanceService = {
    recordReviewDecisionInTransaction: jest.fn(),
  };

  let service: ExceptionReviewService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx)
    );
    reconciliationMatch.update.mockResolvedValue(undefined);
    auditLog.create.mockResolvedValue(undefined);
    provenanceService.recordReviewDecisionInTransaction.mockResolvedValue(undefined);
    service = new ExceptionReviewService(prisma as any, provenanceService as any);
  });

  it("records exception adjudication atomically with audit and provenance details", async () => {
    reconciliationMatch.findFirst.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000099",
      runId: "00000000-0000-4000-8000-000000000042",
      metadata: {},
      status: "open",
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null,
      matchReason: null,
      resolutionReason: null,
      notes: null,
    });

    const result = await service.resolveException({
      tenantId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000002",
      exceptionId: "00000000-0000-4000-8000-000000000099",
      resolution: "manual",
      notes: "Reviewed against settlement evidence",
      traceId: "00000000-0000-4000-8000-000000000003",
      requestId: "req-123",
      ipAddress: "127.0.0.1",
      userAgent: "jest",
    });

    expect(result.outcome).toBe("resolved");
    expect(result.status).toBe("resolved");
    expect(reconciliationMatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "00000000-0000-4000-8000-000000000099" },
        data: expect.objectContaining({
          reviewed: true,
          reviewedBy: "00000000-0000-4000-8000-000000000002",
          matchReason: "Reviewed against settlement evidence",
          metadata: expect.objectContaining({
            latestAdjudication: expect.objectContaining({
              resolution: "manual",
              outcome: "resolved",
              requestId: "req-123",
              traceId: "00000000-0000-4000-8000-000000000003",
              status: "resolved",
            }),
          }),
        }),
      })
    );
    expect(provenanceService.recordReviewDecisionInTransaction).toHaveBeenCalledWith(tx, {
      tenantId: "00000000-0000-4000-8000-000000000001",
      runId: "00000000-0000-4000-8000-000000000042",
      matchId: "00000000-0000-4000-8000-000000000099",
      decision: "override",
      actorUserId: "00000000-0000-4000-8000-000000000002",
      reason: "Reviewed against settlement evidence",
    });
    expect(auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "exception_resolved",
          traceId: "00000000-0000-4000-8000-000000000003",
          requestId: "req-123",
          reason: "Reviewed against settlement evidence",
        }),
      })
    );
  });

  it("treats identical repeat resolutions as idempotent no-ops", async () => {
    reconciliationMatch.findFirst.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000099",
      runId: "00000000-0000-4000-8000-000000000042",
      metadata: {
        latestAdjudication: {
          resolution: "ignored",
        },
      },
      status: "dismissed",
      reviewed: true,
      reviewedBy: "00000000-0000-4000-8000-000000000002",
      reviewedAt: new Date("2026-03-20T12:00:00Z"),
      matchReason: "ignored resolution",
      resolutionReason: "ignored",
      notes: null,
    });

    const result = await service.resolveException({
      tenantId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000002",
      exceptionId: "00000000-0000-4000-8000-000000000099",
      resolution: "ignored",
    });

    expect(result.outcome).toBe("already_resolved");
    expect(reconciliationMatch.update).not.toHaveBeenCalled();
    expect(provenanceService.recordReviewDecisionInTransaction).not.toHaveBeenCalled();
    expect(auditLog.create).not.toHaveBeenCalled();
  });

  it("deduplicates bulk requests and reports missing exceptions explicitly", async () => {
    reconciliationMatch.findFirst
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000099",
        runId: "00000000-0000-4000-8000-000000000042",
        metadata: {},
        status: "open",
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        matchReason: null,
        resolutionReason: null,
        notes: null,
      })
      .mockResolvedValueOnce(null);

    const result = await service.resolveExceptions({
      tenantId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000002",
      exceptionIds: [
        "00000000-0000-4000-8000-000000000099",
        "00000000-0000-4000-8000-000000000099",
        "00000000-0000-4000-8000-000000000100",
      ],
      resolution: "matched",
    });

    expect(result.requestedCount).toBe(3);
    expect(result.uniqueExceptionCount).toBe(2);
    expect(result.duplicateRequestCount).toBe(1);
    expect(result.resolvedCount).toBe(1);
    expect(result.notFoundCount).toBe(1);
    expect(result.results).toHaveLength(1);
  });
});
