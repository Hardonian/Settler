import request from "supertest";
import express from "express";
import { exportsRouter } from "../exports";
import { AuthRequest } from "../../middleware/auth";

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
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
  ExportJobQueue: jest.fn().mockImplementation(() => ({
    enqueue: jest.fn(),
    cancelJob: jest.fn(),
  })),
}));

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
});
