const poolInstances: Array<{
  connect: jest.Mock;
  query: jest.Mock;
  end: jest.Mock;
}> = [];

jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => {
    const instance = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    };

    poolInstances.push(instance);
    return instance;
  }),
}));

jest.mock("../../../config", () => ({
  config: {
    database: {
      host: "localhost",
      port: 5432,
      name: "settler_test",
      user: "settler",
      password: "settler",
    },
  },
}));

jest.mock("../../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {},
}));

jest.mock("../../../application/services/ExportLifecycleService", () => ({
  ExportLifecycleService: jest.fn().mockImplementation(() => ({
    markJobProcessing: jest.fn(),
    recordJobSuccess: jest.fn(),
    recordJobRetryScheduled: jest.fn(),
    recordJobFailure: jest.fn(),
  })),
}));

import { ExportJobWorker, ProcessedJob } from "../ExportJobWorker";

describe("ExportJobWorker", () => {
  beforeEach(() => {
    poolInstances.length = 0;
    jest.clearAllMocks();
  });

  it("claims jobs with updated attempts and normalizes payload formats", async () => {
    const worker = new ExportJobWorker("worker-claim-test");
    const pool = poolInstances[0]!;
    const release = jest.fn();
    const client = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: "job-1",
            tenant_id: "tenant-1",
            type: "export",
            payload: JSON.stringify({
              type: "export",
              runId: "run-1",
              tenantId: "tenant-1",
              userId: "user-1",
            }),
            status: "running",
            attempts: 1,
            max_attempts: 5,
          },
          {
            id: "job-2",
            tenant_id: "tenant-1",
            type: "csv-export",
            payload: {
              type: "csv-export",
              runId: "run-2",
              tenantId: "tenant-1",
              userId: "user-1",
            },
            status: "running",
            attempts: 2,
            max_attempts: 5,
          },
        ],
      }),
      release,
    };

    pool.connect.mockResolvedValue(client);

    const jobs = await (worker as any).claimJobs(2);

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "RETURNING j.id, j.tenant_id, j.type, j.payload, j.status, j.attempts, j.max_attempts"
      ),
      [2, "worker-claim-test"]
    );
    expect(jobs).toEqual([
      {
        id: "job-1",
        tenant_id: "tenant-1",
        type: "export",
        payload: {
          type: "export",
          runId: "run-1",
          tenantId: "tenant-1",
          userId: "user-1",
        },
        status: "running",
        attempts: 1,
        max_attempts: 5,
      },
      {
        id: "job-2",
        tenant_id: "tenant-1",
        type: "csv-export",
        payload: {
          type: "csv-export",
          runId: "run-2",
          tenantId: "tenant-1",
          userId: "user-1",
        },
        status: "running",
        attempts: 2,
        max_attempts: 5,
      },
    ]);
    expect(release).toHaveBeenCalled();
  });

  it("returns an explicit no-op result for unknown job types", async () => {
    const lifecycle = {
      markJobProcessing: jest.fn(),
      recordJobSuccess: jest.fn(),
      recordJobRetryScheduled: jest.fn(),
      recordJobFailure: jest.fn(),
    };
    const worker = new ExportJobWorker("worker-unknown-type", undefined, lifecycle as any);
    const job: ProcessedJob = {
      id: "job-3",
      tenant_id: "tenant-1",
      type: "unknown-export",
      payload: {
        type: "export",
        tenantId: "tenant-1",
        userId: "user-1",
      },
      status: "running",
      attempts: 1,
      max_attempts: 3,
    };

    await expect((worker as any).executeJob(job)).resolves.toEqual({
      success: true,
      runId: "job-3",
      format: "json",
      exportedAt: expect.any(String),
      rowCount: 0,
      metadata: { message: "No handler for job type" },
    });
  });

  it("fails fast when a CSV export job is missing a runId", async () => {
    const lifecycle = {
      markJobProcessing: jest.fn(),
      recordJobSuccess: jest.fn(),
      recordJobRetryScheduled: jest.fn(),
      recordJobFailure: jest.fn(),
    };
    const worker = new ExportJobWorker("worker-missing-run", undefined, lifecycle as any);

    await expect(
      (worker as any).handleCSVExportJob({
        type: "csv-export",
        tenantId: "tenant-1",
        userId: "user-1",
      })
    ).rejects.toThrow("Missing runId for CSV export job");
  });

  it("records processing and completion through the export lifecycle service", async () => {
    const lifecycle = {
      markJobProcessing: jest.fn().mockResolvedValue(undefined),
      recordJobSuccess: jest.fn().mockResolvedValue(undefined),
      recordJobRetryScheduled: jest.fn(),
      recordJobFailure: jest.fn(),
    };
    const worker = new ExportJobWorker("worker-success", undefined, lifecycle as any);
    const executeJob = jest.spyOn(worker as any, "executeJob").mockResolvedValue({
      success: true,
      runId: "run-1",
      format: "csv",
      exportedAt: "2026-03-29T12:00:00.000Z",
      rowCount: 18,
      metadata: { matchedCount: 12 },
    });
    const completeJob = jest.spyOn(worker as any, "completeJob").mockResolvedValue(undefined);

    await (worker as any).processJob({
      id: "job-1",
      tenant_id: "tenant-1",
      type: "csv-export",
      payload: {
        type: "csv-export",
        runId: "run-1",
        tenantId: "tenant-1",
        userId: "user-1",
      },
      status: "running",
      attempts: 1,
      max_attempts: 3,
    });

    expect(lifecycle.markJobProcessing).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      jobId: "job-1",
      workerId: "worker-success",
    });
    expect(lifecycle.recordJobSuccess).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      jobId: "job-1",
      result: expect.objectContaining({
        success: true,
        runId: "run-1",
        rowCount: 18,
      }),
    });
    expect(completeJob).toHaveBeenCalledWith(
      "job-1",
      "succeeded",
      expect.objectContaining({ rowCount: 18 })
    );
    executeJob.mockRestore();
    completeJob.mockRestore();
  });
});
