import { ExceptionReviewService } from "../ExceptionReviewService";

describe("ExceptionReviewService", () => {
  const reconciliationMatch = {
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  const normalizedTransaction = {
    findFirst: jest.fn(),
  };
  const exceptionAdjudicationMemory = {
    create: jest.fn(),
  };
  const exceptionArchetype = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const exceptionArchetypeClassification = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const evidenceArtifact = {
    create: jest.fn(),
  };
  const proofPackage = {
    create: jest.fn(),
  };
  const auditLog = {
    create: jest.fn(),
  };
  const tx = {
    reconciliationMatch,
    normalizedTransaction,
    exceptionAdjudicationMemory,
    exceptionArchetype,
    exceptionArchetypeClassification,
    evidenceArtifact,
    proofPackage,
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
    reconciliationMatch.findFirst.mockReset();
    reconciliationMatch.update.mockReset();
    normalizedTransaction.findFirst.mockReset();
    exceptionAdjudicationMemory.create.mockReset();
    exceptionArchetype.findFirst.mockReset();
    exceptionArchetype.create.mockReset();
    exceptionArchetype.update.mockReset();
    exceptionArchetypeClassification.findFirst.mockReset();
    exceptionArchetypeClassification.create.mockReset();
    exceptionArchetypeClassification.update.mockReset();
    evidenceArtifact.create.mockReset();
    proofPackage.create.mockReset();
    auditLog.create.mockReset();
    prisma.$transaction.mockReset();
    provenanceService.recordReviewDecisionInTransaction.mockReset();
    prisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx)
    );
    reconciliationMatch.update.mockResolvedValue(undefined);
    normalizedTransaction.findFirst.mockResolvedValue({
      id: "txn-source-1",
      amount: 100,
      currency: "USD",
      date: new Date("2026-03-20T11:59:00Z"),
      description: "Source transaction",
      externalId: "ext-src-1",
    });
    evidenceArtifact.create
      .mockResolvedValueOnce({ id: "evidence-1" })
      .mockResolvedValueOnce({ id: "evidence-2" });
    exceptionAdjudicationMemory.create.mockResolvedValue({ id: "memory-1" });
    exceptionArchetype.findFirst.mockResolvedValue(null);
    exceptionArchetype.create.mockResolvedValue({ id: "arch-1", occurrenceCount: 0 });
    exceptionArchetype.update.mockResolvedValue(undefined);
    exceptionArchetypeClassification.findFirst.mockResolvedValue(null);
    exceptionArchetypeClassification.create.mockResolvedValue({ id: "class-1" });
    exceptionArchetypeClassification.update.mockResolvedValue(undefined);
    proofPackage.create.mockResolvedValue({ id: "proof-1" });
    auditLog.create.mockResolvedValue(undefined);
    provenanceService.recordReviewDecisionInTransaction.mockResolvedValue(undefined);
    service = new ExceptionReviewService(prisma as any, provenanceService as any);
  });

  it("records exception adjudication atomically with audit and provenance details", async () => {
    reconciliationMatch.findFirst.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000099",
      runId: "00000000-0000-4000-8000-000000000042",
      sourceTransactionId: "00000000-0000-4000-8000-000000000043",
      targetTransactionId: null,
      confidence: 0.98,
      amountDiff: null,
      dateDiff: null,
      matchType: "unmatched",
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
    expect(evidenceArtifact.create).toHaveBeenCalledTimes(2);
    expect(exceptionAdjudicationMemory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          exceptionId: "00000000-0000-4000-8000-000000000099",
          resolution: "manual",
          resolutionReason: "manual review confirmed",
          resolutionCode: "MANUAL_REVIEW_CONFIRMED",
          evidenceIds: ["evidence-1", "evidence-2"],
        }),
      })
    );
    expect(exceptionArchetype.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "MISSING_IN_TARGET",
          typicalResolution: "MISSING_COUNTERPART_CONFIRMED",
        }),
      })
    );
    expect(exceptionArchetypeClassification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          exceptionId: "00000000-0000-4000-8000-000000000099",
          archetypeId: "arch-1",
        }),
      })
    );
    expect(proofPackage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageType: "exception_resolution",
          packageKey: "exception:00000000-0000-4000-8000-000000000099:memory:memory-1",
          evidenceIds: ["evidence-1", "evidence-2"],
        }),
      })
    );
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
              resolutionCode: "MANUAL_REVIEW_CONFIRMED",
              memoryId: "memory-1",
              proofPackageId: "proof-1",
              evidenceIds: ["evidence-1", "evidence-2"],
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
      sourceTransactionId: "00000000-0000-4000-8000-000000000043",
      targetTransactionId: null,
      confidence: 0.98,
      amountDiff: null,
      dateDiff: null,
      matchType: "unmatched",
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
      resolutionReason: "operator dismissed exception",
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
    expect(exceptionAdjudicationMemory.create).not.toHaveBeenCalled();
    expect(proofPackage.create).not.toHaveBeenCalled();
  });

  it("deduplicates bulk requests and reports missing exceptions explicitly", async () => {
    reconciliationMatch.findFirst
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000099",
        runId: "00000000-0000-4000-8000-000000000042",
        sourceTransactionId: "00000000-0000-4000-8000-000000000043",
        targetTransactionId: null,
        confidence: 0.98,
        amountDiff: null,
        dateDiff: null,
        matchType: "unmatched",
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
