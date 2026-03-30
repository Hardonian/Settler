import { ExportLifecycleService } from "../ExportLifecycleService";

describe("ExportLifecycleService", () => {
  const exportModel = {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const tx = {
    export: exportModel,
    $queryRaw: jest.fn(),
  };
  const prisma = {
    $transaction: jest.fn(),
  };
  const exportQueue = {
    enqueue: jest.fn(),
    cancelJob: jest.fn(),
  };

  let service: ExportLifecycleService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx)
    );
    tx.$queryRaw.mockResolvedValue(undefined);
    service = new ExportLifecycleService(prisma as any, exportQueue as any);
  });

  it("creates a canonical export row for a newly queued job", async () => {
    exportQueue.enqueue.mockResolvedValueOnce({
      id: "job-1",
      tenantId: "tenant-1",
      type: "reconciliation-export",
      status: "queued",
      createdAt: new Date("2026-03-29T12:00:00Z"),
    });
    exportModel.findMany.mockResolvedValueOnce([]);
    exportModel.create.mockResolvedValueOnce({
      id: "export-1",
      type: "reconciliation",
      format: "csv",
      status: "pending",
      createdAt: new Date("2026-03-29T12:00:00Z"),
    });

    const result = await service.requestExport({
      tenantId: "tenant-1",
      userId: "user-1",
      type: "reconciliation",
      format: "csv",
      runId: "run-1",
      options: { includeMatched: true },
    });

    expect(exportQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        userId: "user-1",
        type: "reconciliation-export",
        format: "csv",
      })
    );
    expect(exportModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          userId: "user-1",
          reconciliationRunId: "run-1",
          metadata: expect.objectContaining({
            jobId: "job-1",
            jobType: "reconciliation-export",
          }),
        }),
      })
    );
    expect(result).toMatchObject({
      exportId: "export-1",
      jobId: "job-1",
      status: "pending",
      idempotent: false,
      createdNew: true,
    });
  });

  it("returns the canonical export and supersedes duplicate rows tied to the same job", async () => {
    const canonical = {
      id: "export-1",
      tenantId: "tenant-1",
      userId: "user-1",
      type: "reconciliation",
      format: "csv",
      reconciliationRunId: "run-1",
      status: "pending",
      storageLocation: null,
      signedUrl: null,
      signedUrlExpiresAt: null,
      fileSizeBytes: null,
      rowCount: null,
      errorMessage: null,
      metadata: { jobId: "job-1" },
      createdAt: new Date("2026-03-29T12:00:00Z"),
    };
    const duplicate = {
      ...canonical,
      id: "export-2",
      createdAt: new Date("2026-03-29T12:01:00Z"),
    };

    exportQueue.enqueue.mockResolvedValueOnce({
      id: "job-1",
      tenantId: "tenant-1",
      type: "reconciliation-export",
      status: "queued",
      createdAt: new Date("2026-03-29T12:00:00Z"),
    });
    exportModel.findMany.mockResolvedValueOnce([canonical, duplicate]);
    exportModel.update.mockResolvedValueOnce(undefined);

    const result = await service.requestExport({
      tenantId: "tenant-1",
      userId: "user-1",
      type: "reconciliation",
      format: "csv",
      runId: "run-1",
    });

    expect(result).toMatchObject({
      exportId: "export-1",
      jobId: "job-1",
      idempotent: true,
      createdNew: false,
    });
    expect(exportModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "export-2" },
        data: expect.objectContaining({
          status: "failed",
          metadata: expect.objectContaining({
            duplicateOfExportId: "export-1",
            duplicateJobId: "job-1",
          }),
        }),
      })
    );
  });

  it("records successful export completion against the exact queued job", async () => {
    exportModel.findMany.mockResolvedValueOnce([
      {
        id: "export-1",
        tenantId: "tenant-1",
        userId: "user-1",
        type: "reconciliation",
        format: "csv",
        reconciliationRunId: "run-1",
        status: "processing",
        storageLocation: null,
        signedUrl: null,
        signedUrlExpiresAt: null,
        fileSizeBytes: null,
        rowCount: null,
        errorMessage: null,
        metadata: { jobId: "job-1" },
        createdAt: new Date("2026-03-29T12:00:00Z"),
      },
    ]);
    exportModel.update.mockResolvedValueOnce(undefined);

    await service.recordJobSuccess({
      tenantId: "tenant-1",
      jobId: "job-1",
      result: {
        success: true,
        runId: "run-1",
        format: "csv",
        exportedAt: "2026-03-29T12:05:00.000Z",
        rowCount: 18,
        fileSizeBytes: 2048,
        metadata: { matchedCount: 12, exceptionCount: 6 },
      },
    });

    expect(exportModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "export-1" },
        data: expect.objectContaining({
          status: "completed",
          rowCount: 18,
          fileSizeBytes: 2048,
          metadata: expect.objectContaining({
            jobId: "job-1",
            exportedAt: "2026-03-29T12:05:00.000Z",
            matchedCount: 12,
            exceptionCount: 6,
          }),
        }),
      })
    );
  });

  it("records retry scheduling truth on the export row", async () => {
    exportModel.findMany.mockResolvedValueOnce([
      {
        id: "export-1",
        tenantId: "tenant-1",
        userId: "user-1",
        type: "reconciliation",
        format: "csv",
        reconciliationRunId: "run-1",
        status: "processing",
        storageLocation: null,
        signedUrl: null,
        signedUrlExpiresAt: null,
        fileSizeBytes: null,
        rowCount: null,
        errorMessage: null,
        metadata: { jobId: "job-1" },
        createdAt: new Date("2026-03-29T12:00:00Z"),
      },
    ]);
    exportModel.update.mockResolvedValueOnce(undefined);

    await service.recordJobRetryScheduled({
      tenantId: "tenant-1",
      jobId: "job-1",
      errorMessage: "temporary storage outage",
      retryScheduledAt: new Date("2026-03-29T12:10:00Z"),
      attempt: 2,
      maxAttempts: 5,
    });

    expect(exportModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "export-1" },
        data: expect.objectContaining({
          status: "pending",
          metadata: expect.objectContaining({
            lastAttemptError: "temporary storage outage",
            retryScheduledAt: "2026-03-29T12:10:00.000Z",
            retryAttempt: 2,
            maxAttempts: 5,
          }),
        }),
      })
    );
  });

  it("delegates queued cancellation to the export job queue", async () => {
    exportQueue.cancelJob.mockResolvedValueOnce(true);

    await expect(
      service.cancelQueuedJob({
        tenantId: "tenant-1",
        jobId: "job-9",
      })
    ).resolves.toBe(true);

    expect(exportQueue.cancelJob).toHaveBeenCalledWith("job-9", "tenant-1");
  });
});
