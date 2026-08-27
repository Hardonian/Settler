import express from "express";
import request from "supertest";
import { runsRouter } from "../runs";
import type { AuthRequest } from "../../middleware/auth";

jest.mock("../../infrastructure/db/prisma", () => {
  const reconResult = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };

  return {
    prisma: {
      reconResult,
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({ reconResult })),
    },
  };
});

jest.mock("@settler/reconciliation-core", () => ({
  scanMergedRunsForLegacyPage: jest.fn(),
  resolveOperatorRunDetailForTenants: jest.fn(),
  buildRunProofpackIndexByRunId: jest.fn(),
  resolveRunCompactProofSummary: jest.fn(),
}));

jest.mock("../../utils/governance-cache", () => ({
  getCachedTenantFreezeState: jest.fn(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
}));

const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const { getCachedTenantFreezeState } = require("../../utils/governance-cache");

describe("runs retry freeze enforcement", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      (req as AuthRequest).traceId = "trace-789";
      next();
    });
    app.use("/api/runs", runsRouter);

    jest.clearAllMocks();
  });

  it("blocks retry when the tenant is frozen", async () => {
    getCachedTenantFreezeState.mockResolvedValueOnce({
      frozen: true,
      frozen_at: "2026-03-17T10:00:00Z",
      freeze_reason: "Pre-launch validation mode",
    });

    const response = await request(app).post("/api/runs/run-1/retry");

    expect(response.status).toBe(423);
    expect(response.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
    expect(response.body.freeze_reason).toBe("Pre-launch validation mode");
    expect(mockedPrisma.reconResult.findFirst).not.toHaveBeenCalled();
  });
});
