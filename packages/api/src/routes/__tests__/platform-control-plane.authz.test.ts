import express from "express";
import request from "supertest";

const requirePermissionMock = jest.fn(
  (_permission?: unknown) => (_req: unknown, res: express.Response) => {
    res.status(403).json({ error: "forbidden" });
  }
);

const queryMock = jest.fn();

jest.mock("../../middleware/authorization", () => ({
  requirePermission: (permission: unknown) => requirePermissionMock(permission),
}));

jest.mock("../../services/capabilities/registry", () => ({
  getOperatorIntelligenceProvider: jest.fn(() => ({
    getPlatformOverview: jest.fn().mockResolvedValue({}),
    getTelemetryForExport: jest.fn().mockResolvedValue([]),
    status: () => ({
      key: "operator_intelligence",
      state: "available",
      available: true,
      source: "oss",
    }),
  })),
  getUnavailableOperatorIntelligenceProvider: jest.fn(),
  getEnterpriseAnalyticsProvider: jest.fn(() => ({
    status: () => ({
      key: "enterprise_analytics",
      state: "available",
      available: true,
      source: "oss",
    }),
  })),
}));

jest.mock("../../services/capabilities/errors", () => ({
  isMissingOptionalCapabilityDependency: jest.fn(() => false),
}));

jest.mock("../../services/capabilities/telemetry", () => ({
  observeCapabilityStatus: jest.fn(),
}));

jest.mock("../../utils/error-handler", () => ({
  handleRouteError: jest.fn(),
}));

jest.mock("../../db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

const router = require("../platform-control-plane").platformControlPlaneRouter;

describe("platform control plane authz", () => {
  function createApp() {
    const app = express();
    app.use((req, _res, next) => {
      (req as any).tenantId = "tenant-1";
      (req as any).userId = "user-1";
      next();
    });
    app.use(router);
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("protects the overview route with admin permission", async () => {
    const response = await request(createApp()).get("/platform-control-plane/overview");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("forbidden");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("protects the analytics export route with admin permission", async () => {
    const response = await request(createApp()).get("/platform-control-plane/analytics/export");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("forbidden");
    expect(queryMock).not.toHaveBeenCalled();
  });
});
