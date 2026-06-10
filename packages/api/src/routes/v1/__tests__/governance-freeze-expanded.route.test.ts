import express from "express";
import request from "supertest";
import notificationsRouter from "../notifications";
import progressRouter from "../progress";
import slaRouter from "../sla";
import toleranceSettingsRouter from "../../tolerance-settings";
import type { AuthRequest } from "../../../middleware/auth";

jest.mock("../../../utils/governance-cache", () => ({
  getCachedTenantFreezeState: jest.fn(),
}));

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../../middleware/validation", () => ({
  validateRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../../services/notifications", () => ({
  updateNotificationPreferences: jest.fn(),
  getNotificationPreferences: jest.fn(),
  getNotificationLogs: jest.fn(),
}));

jest.mock("../../../services/progress-tracking", () => ({
  createCheckpoint: jest.fn(),
  getLatestCheckpoint: jest.fn(),
  getReconciliationProgress: jest.fn(),
  getReconciliationResultProgress: jest.fn(),
  resumeFromCheckpoint: jest.fn(),
}));

jest.mock("../../../services/sla-monitoring", () => ({
  acknowledgeSLAViolation: jest.fn(),
  createSLAAgreement: jest.fn(),
  getSLAViolations: jest.fn(),
  recordSLAMetric: jest.fn(),
}));

jest.mock("../../../db", () => ({
  queryWithTenant: jest.fn(),
}));

jest.mock("../../../utils/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

const { getCachedTenantFreezeState } = require("../../../utils/governance-cache");
const { updateNotificationPreferences } = require("../../../services/notifications");
const { createCheckpoint, resumeFromCheckpoint } = require("../../../services/progress-tracking");
const { createSLAAgreement, acknowledgeSLAViolation } = require("../../../services/sla-monitoring");
const { queryWithTenant } = require("../../../db");

describe("expanded governance freeze enforcement", () => {
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

    app.use("/api/v1/notifications", notificationsRouter);
    app.use("/api/v1/progress", progressRouter);
    app.use("/api/v1/sla", slaRouter);
    app.use("/api/v1/tolerance", toleranceSettingsRouter);

    jest.clearAllMocks();
    getCachedTenantFreezeState.mockResolvedValue({
      frozen: true,
      frozen_at: "2026-03-17T10:00:00Z",
      freeze_reason: "Validation lock",
    });
  });

  it("blocks notification preference updates while frozen", async () => {
    const response = await request(app)
      .put("/api/v1/notifications/preferences")
      .send({ preferences: [{ channel: "email", enabled: true }] });

    expect(response.status).toBe(423);
    expect(response.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
    expect(updateNotificationPreferences).not.toHaveBeenCalled();
  });

  it("blocks checkpoint creation and resume while frozen", async () => {
    const createResponse = await request(app)
      .post("/api/v1/progress/checkpoints")
      .send({
        jobId: "job-1",
        checkpointData: { offset: 42 },
        transactionsProcessed: 42,
      });

    expect(createResponse.status).toBe(423);
    expect(createCheckpoint).not.toHaveBeenCalled();

    const resumeResponse = await request(app).post("/api/v1/progress/checkpoints/cp-1/resume");

    expect(resumeResponse.status).toBe(423);
    expect(resumeFromCheckpoint).not.toHaveBeenCalled();
  });

  it("blocks SLA agreement creation and acknowledgement while frozen", async () => {
    const createResponse = await request(app).post("/api/v1/sla/agreements").send({
      slaType: "uptime",
      targetValue: 99.9,
    });

    expect(createResponse.status).toBe(423);
    expect(createSLAAgreement).not.toHaveBeenCalled();

    const acknowledgeResponse = await request(app).post(
      "/api/v1/sla/violations/viol-1/acknowledge"
    );

    expect(acknowledgeResponse.status).toBe(423);
    expect(acknowledgeSLAViolation).not.toHaveBeenCalled();
  });

  it("blocks tolerance updates while frozen", async () => {
    const response = await request(app)
      .put("/api/v1/tolerance/11111111-1111-1111-1111-111111111111")
      .send({ amountTolerance: 0.25 });

    expect(response.status).toBe(423);
    expect(queryWithTenant).not.toHaveBeenCalled();
  });
});
