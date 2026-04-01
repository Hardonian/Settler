import express from "express";
import request from "supertest";

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const submitMetricsMock = jest.fn(
  (_tenantId: string, _metrics: unknown) =>
    ({ accepted: true }) as { accepted: boolean; reason?: string }
);
jest.mock("../../../services/network-effects/performance-pools", () => ({
  performanceTuningPools: {
    optIn: jest.fn(),
    submitMetrics: (tenantId: string, metrics: unknown) => submitMetricsMock(tenantId, metrics),
    getInsights: jest.fn(() => []),
    getRecommendedRules: jest.fn(() => []),
    getStats: jest.fn(() => ({
      totalMetrics: 0,
      optInCustomers: 0,
      adapters: [],
      topPerformers: [],
    })),
  },
}));

jest.mock("../../../services/network-effects/cross-customer-intelligence", () => ({
  crossCustomerIntelligence: {
    optIn: jest.fn(),
    optOut: jest.fn(),
    checkPattern: jest.fn(() => null),
    getNetworkInsights: jest.fn(() => ({
      totalPatterns: 0,
      fraudPatterns: 0,
      anomalyPatterns: 0,
      topPatterns: [],
    })),
  },
}));

const router = require("../network-effects").default;

describe("network effects route authz", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v2/network-effects", router);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW;
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
  });

  it("fails closed when control-plane authz denies", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).post("/api/v2/network-effects/performance/submit").send({
      jobId: "job-1",
      adapter: "csv",
      ruleType: "exact",
    });

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(submitMetricsMock).not.toHaveBeenCalled();
  });

  it("returns explicit unavailable state when preview is disabled", async () => {
    const response = await request(app).get("/api/v2/network-effects/stats");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("STRATEGIC_SURFACE_UNAVAILABLE");
    expect(response.body.capability.state).toBe("unavailable");
  });

  it("returns explicit opt-in-required state instead of false success", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";
    submitMetricsMock.mockReturnValue({
      accepted: false,
      reason: "Tenant must opt in to performance tuning pools before submitting metrics.",
    });

    const response = await request(app).post("/api/v2/network-effects/performance/submit").send({
      jobId: "job-1",
      adapter: "csv",
      ruleType: "exact",
      accuracy: 0.98,
      latency: 12,
      throughput: 200,
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("PERFORMANCE_POOL_OPT_IN_REQUIRED");
    expect(response.body.capability.state).toBe("degraded");
    expect(response.body.metadata.tenantId).toBe("tenant-1");
  });
});
