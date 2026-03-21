import express from "express";
import request from "supertest";

const checkThresholds = jest.fn();
const upsertThreshold = jest.fn();

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  bypassFreeze: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../services/capabilities/registry", () => ({
  getAlertRoutingProvider: () => ({
    checkThresholds,
    upsertThreshold,
    status: () => ({ key: "alert_routing", state: "available", available: true, source: "oss" }),
  }),
  getUsageMeteringProvider: () => ({
    setUsageCeiling: jest.fn(),
    getUsageCeiling: jest.fn(),
    getUsageSummary: jest.fn(),
    status: () => ({ key: "usage_metering", state: "available", available: true, source: "oss" }),
  }),
}));

jest.mock("../../services/capabilities/telemetry", () => ({
  observeCapabilityStatus: jest.fn(),
}));

describe("operator alerts tenant scope routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkThresholds.mockResolvedValue([]);
    upsertThreshold.mockResolvedValue("threshold-1");
  });

  async function buildApp() {
    const { operatorModeRouter: router } = await import("../../routes/v1/operator-mode");
    const app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.userId = "user-1";
      const tenantId = req.get("x-tenant-id");
      if (tenantId) {
        req.tenantId = tenantId;
      }
      next();
    });
    app.use("/api/v1", router);
    return app;
  }

  it("requires tenant context for threshold creation", async () => {
    const app = await buildApp();
    const response = await request(app)
      .post("/api/v1/operator/alerts/thresholds")
      .send({
        name: "failed-ingestions",
        metric: "failed_ingestion",
        threshold: 1,
        operator: "gt",
        severity: "medium",
        channels: ["email"],
        enabled: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
    expect(upsertThreshold).not.toHaveBeenCalled();
  });

  it("passes tenant context through threshold creation", async () => {
    const app = await buildApp();
    const response = await request(app)
      .post("/api/v1/operator/alerts/thresholds")
      .set("x-tenant-id", "11111111-1111-4111-8111-111111111111")
      .send({
        name: "failed-ingestions",
        metric: "failed_ingestion",
        threshold: 1,
        operator: "gt",
        severity: "medium",
        channels: ["email"],
        enabled: true,
      });

    expect(response.status).toBe(201);
    expect(upsertThreshold).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "failed-ingestions" }),
      "11111111-1111-4111-8111-111111111111"
    );
  });

  it("requires tenant scope for threshold checks unless global scope is explicit", async () => {
    const app = await buildApp();

    const tenantMissing = await request(app).post("/api/v1/operator/alerts/check").send({});
    expect(tenantMissing.status).toBe(400);
    expect(checkThresholds).not.toHaveBeenCalled();

    const globalScope = await request(app)
      .post("/api/v1/operator/alerts/check?scope=global")
      .send({});
    expect(globalScope.status).toBe(200);
    expect(globalScope.body.scope).toBe("global");
    expect(checkThresholds).toHaveBeenLastCalledWith(undefined);

    const tenantScope = await request(app)
      .post("/api/v1/operator/alerts/check")
      .set("x-tenant-id", "22222222-2222-4222-8222-222222222222")
      .send({});
    expect(tenantScope.status).toBe(200);
    expect(tenantScope.body.scope).toBe("tenant");
    expect(checkThresholds).toHaveBeenLastCalledWith("22222222-2222-4222-8222-222222222222");
  });
});
