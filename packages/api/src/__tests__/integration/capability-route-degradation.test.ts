import express from "express";
import request from "supertest";
import operatorIntelligenceRouter from "../../routes/v1/operator-intelligence";
import { platformControlPlaneRouter } from "../../routes/platform-control-plane";
import capabilitiesRouter from "../../routes/v1/capabilities";

jest.mock("../../middleware/authorization", () => ({
  requirePermission:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

jest.mock("../../services/capabilities/registry", () => ({
  getOperatorIntelligenceProvider: jest.fn(),
  getUnavailableOperatorIntelligenceProvider: jest.fn(),
  getCapabilityRegistry: jest.fn(),
  getEnterpriseAnalyticsProvider: jest.fn(() => ({
    status: () => ({
      key: "enterprise_analytics",
      state: "degraded",
      available: true,
      source: "oss",
    }),
  })),
}));

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

const registry = jest.requireMock("../../services/capabilities/registry") as {
  getOperatorIntelligenceProvider: jest.Mock;
  getUnavailableOperatorIntelligenceProvider: jest.Mock;
  getCapabilityRegistry: jest.Mock;
};

const db = jest.requireMock("../../db") as {
  query: jest.Mock;
};

describe("capability route degradation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function withTenant(app: express.Express): express.Express {
    app.use((req, _res, next) => {
      (req as any).tenantId = "tenant-1";
      (req as any).userId = "user-1";
      next();
    });
    return app;
  }

  it("degrades operator intelligence route when optional tables are absent", async () => {
    const providerError = Object.assign(new Error("relation does not exist"), { code: "42P01" });
    registry.getOperatorIntelligenceProvider.mockResolvedValue({
      getSystemHealthSnapshot: jest.fn().mockRejectedValue(providerError),
      status: () => ({
        key: "operator_intelligence",
        state: "available",
        available: true,
        source: "oss",
      }),
    });
    registry.getUnavailableOperatorIntelligenceProvider.mockReturnValue({
      getSystemHealthSnapshot: jest.fn().mockResolvedValue({ runsPerDay: 0, errorRate: 0 }),
      status: () => ({
        key: "operator_intelligence",
        state: "unavailable",
        available: false,
        source: "oss",
      }),
    });

    const app = withTenant(express());
    app.use(operatorIntelligenceRouter);

    const response = await request(app).get("/operator/intelligence/system-health");

    expect(response.status).toBe(200);
    expect(response.body.capability.state).toBe("unavailable");
  });

  it("degrades platform control plane route when optional tables are absent", async () => {
    const providerError = Object.assign(new Error("relation does not exist"), { code: "42P01" });
    registry.getOperatorIntelligenceProvider.mockResolvedValue({
      getPlatformOverview: jest.fn().mockRejectedValue(providerError),
      status: () => ({
        key: "operator_intelligence",
        state: "available",
        available: true,
        source: "oss",
      }),
    });
    registry.getUnavailableOperatorIntelligenceProvider.mockReturnValue({
      getPlatformOverview: jest.fn().mockResolvedValue({
        telemetry: {},
        analytics: {},
        costs: {},
        autonomousOperations: {},
        leaderboard: [],
      }),
      status: () => ({
        key: "operator_intelligence",
        state: "unavailable",
        available: false,
        source: "oss",
      }),
    });

    const app = withTenant(express());
    app.use(platformControlPlaneRouter);

    const response = await request(app).get("/platform-control-plane/overview");

    expect(response.status).toBe(200);
    expect(response.body.capability.operatorIntelligence.state).toBe("unavailable");
  });

  it("projects capabilities by role/scope for consumers", async () => {
    registry.getCapabilityRegistry.mockResolvedValue({
      list: () => [
        { key: "operator_intelligence", state: "available", available: true, source: "oss" },
        { key: "support_intake", state: "available", available: true, source: "oss" },
      ],
    });
    db.query.mockResolvedValueOnce([{ role: "viewer" }]);

    const app = withTenant(express());
    app.use(capabilitiesRouter);

    const response = await request(app).get("/capabilities/projected");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].key).toBe("support_intake");
  });

  it("scopes projected capability resolution to the active tenant", async () => {
    registry.getCapabilityRegistry.mockResolvedValue({
      list: () => [
        { key: "operator_intelligence", state: "available", available: true, source: "oss" },
        { key: "support_intake", state: "available", available: true, source: "oss" },
      ],
    });
    db.query.mockResolvedValueOnce([{ scopes: [] }]).mockResolvedValueOnce([{ role: "viewer" }]);

    const app = express();
    app.use((req, _res, next) => {
      (req as any).tenantId = "tenant-7";
      (req as any).userId = "user-1";
      (req as any).apiKeyId = "key-1";
      next();
    });
    app.use(capabilitiesRouter);

    const response = await request(app).get("/capabilities/projected");

    expect(response.status).toBe(200);
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining("FROM api_keys"), [
      "key-1",
      "tenant-7",
    ]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining("FROM users"), [
      "user-1",
      "tenant-7",
    ]);
    expect(response.body.metadata.tenantId).toBe("tenant-7");
  });

  it("requires tenant context for projected capabilities", async () => {
    registry.getCapabilityRegistry.mockResolvedValue({
      list: () => [],
    });

    const app = express();
    app.use((req, _res, next) => {
      (req as any).tenantId = null;
      (req as any).userId = "user-1";
      next();
    });
    app.use(capabilitiesRouter);

    const response = await request(app).get("/capabilities/projected");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
  });
});
