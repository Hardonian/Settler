import express from "express";
import request from "supertest";

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const listAgentsMock = jest.fn(() => []);
const getStatsMock = jest.fn(() => ({
  totalAgents: 0,
  enabledAgents: 0,
  queueLength: 0,
  isProcessing: false,
}));
jest.mock("../../../services/ai-agents/orchestrator", () => ({
  BaseAgent: class {},
  agentOrchestrator: {
    getAgent: jest.fn(() => undefined),
    listAgents: () => listAgentsMock(),
    getStats: () => getStatsMock(),
    registerAgent: jest.fn(),
    initializeAll: jest.fn(async () => undefined),
    execute: jest.fn(),
  },
}));

jest.mock("../../../services/ai-agents/infrastructure-optimizer", () => ({
  InfrastructureOptimizerAgent: class {
    id = "infrastructure-optimizer";
    name = "Infrastructure Optimizer";
    type = "optimizer";

    constructor(_config: unknown) {}

    async getStatus() {
      return { state: "idle" };
    }
  },
}));

jest.mock("../../../services/ai-agents/anomaly-detector", () => ({
  AnomalyDetectorAgent: class {
    id = "anomaly-detector";
    name = "Anomaly Detector";
    type = "detector";

    constructor(_config: unknown) {}

    async getStatus() {
      return { state: "idle" };
    }
  },
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const router = require("../ai-agents").default;

describe("ai agents route authz", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v2/ai-agents", router);

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

  it("fails closed when authz denies access", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).get("/api/v2/ai-agents");

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(listAgentsMock).not.toHaveBeenCalled();
  });

  it("returns explicit unavailable state when preview is disabled", async () => {
    const response = await request(app).get("/api/v2/ai-agents/stats");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("STRATEGIC_SURFACE_UNAVAILABLE");
    expect(response.body.capability.state).toBe("unavailable");
    expect(getStatsMock).not.toHaveBeenCalled();
  });

  it("routes /stats to the stats handler when preview is enabled", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";

    const response = await request(app).get("/api/v2/ai-agents/stats");

    expect(response.status).toBe(200);
    expect(getStatsMock).toHaveBeenCalledTimes(1);
    expect(response.body.data.totalAgents).toBe(0);
    expect(response.body.capability.state).toBe("degraded");
  });
});
