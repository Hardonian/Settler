import request from "supertest";
import express from "express";
import { exportsRouter } from "../exports";
import { AuthRequest } from "../../middleware/auth";

var mockExportQueue: { enqueue: jest.Mock; cancelJob: jest.Mock };

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    export: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");

jest.mock("../../jobs/queue/ExportJobQueue", () => ({
  __mockExportQueue: (mockExportQueue = {
    enqueue: jest.fn(),
    cancelJob: jest.fn(),
  }),
  ExportJobQueue: jest.fn().mockImplementation(() => mockExportQueue),
}));
const { __mockExportQueue: sharedExportQueueMock } = require("../../jobs/queue/ExportJobQueue");
mockExportQueue = sharedExportQueueMock;

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: jest.fn(() => jest.fn((_req: any, _res: any, next: any) => next())),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe("exports routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      next();
    });
    app.use("/api", exportsRouter);

    jest.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mockedPrisma) => unknown) => callback(mockedPrisma)
    );
    mockedPrisma.$queryRaw.mockResolvedValue(undefined);
  });

  it("returns a truthful 409 when an export is not ready for download", async () => {
    mockedPrisma.export.findFirst.mockResolvedValueOnce({
      id: "export-1",
      tenantId: "tenant-123",
      status: "pending",
      signedUrl: null,
      signedUrlExpiresAt: null,
      fileSizeBytes: null,
      format: "csv",
    });

    const res = await request(app).get("/api/exports/export-1/download");

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      error: "EXPORT_NOT_READY",
      status: "pending",
    });
    expect(mockedPrisma.export.findFirst).toHaveBeenCalledWith({
      where: { id: "export-1", tenantId: "tenant-123" },
    });
  });

  it("returns the signed URL when the export is ready", async () => {
    mockedPrisma.export.findFirst.mockResolvedValueOnce({
      id: "export-2",
      tenantId: "tenant-123",
      status: "completed",
      signedUrl: "https://example.com/exports/export-2.csv",
      signedUrlExpiresAt: new Date("2026-04-01T12:00:00Z"),
      fileSizeBytes: 2048,
      format: "csv",
    });

    const res = await request(app).get("/api/exports/export-2/download");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      downloadUrl: "https://example.com/exports/export-2.csv",
      expiresAt: "2026-04-01T12:00:00.000Z",
      fileSizeBytes: 2048,
      format: "csv",
    });
  });

  it("reuses the canonical export record for duplicate idempotent requests", async () => {
    mockExportQueue.enqueue.mockResolvedValueOnce({
      id: "job-1",
      tenantId: "tenant-123",
      type: "reconciliation-export",
      status: "queued",
      createdAt: new Date("2026-03-29T12:00:00Z"),
    });
    mockedPrisma.export.findMany
      .mockResolvedValueOnce([
        {
          id: "export-1",
          tenantId: "tenant-123",
          userId: "user-456",
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
          metadata: { jobId: "job-1", idempotencyKey: "idem-1" },
          createdAt: new Date("2026-03-29T12:00:00Z"),
        },
      ])
      .mockResolvedValueOnce([]);

    const res = await request(app).post("/api/exports").send({
      runId: "00000000-0000-4000-8000-000000000001",
      format: "csv",
      type: "reconciliation",
      idempotencyKey: "idem-1",
      options: {},
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: {
        exportId: "export-1",
        jobId: "job-1",
        status: "pending",
        idempotent: true,
      },
    });
    expect(mockedPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not mark an export failed when cancellation loses the race to a running job", async () => {
    mockedPrisma.export.findFirst.mockResolvedValueOnce({
      id: "export-3",
      tenantId: "tenant-123",
      status: "pending",
      metadata: { jobId: "job-3" },
    });
    mockExportQueue.cancelJob.mockResolvedValueOnce(false);

    const res = await request(app).post("/api/exports/export-3/cancel");

    expect(res.status).toBe(409);
    expect(mockedPrisma.export.update).not.toHaveBeenCalled();
  });
});
