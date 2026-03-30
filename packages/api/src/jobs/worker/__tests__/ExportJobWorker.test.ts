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
      expect.stringContaining("RETURNING j.id, j.tenant_id, j.type, j.payload, j.status, j.attempts, j.max_attempts"),
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
    const worker = new ExportJobWorker("worker-unknown-type");
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
      message: "No handler for job type",
    });
  });

  it("fails fast when a CSV export job is missing a runId", async () => {
    const worker = new ExportJobWorker("worker-missing-run");

    await expect(
      (worker as any).handleCSVExportJob({
        type: "csv-export",
        tenantId: "tenant-1",
        userId: "user-1",
      })
    ).rejects.toThrow("Missing runId for CSV export job");
  });
});
