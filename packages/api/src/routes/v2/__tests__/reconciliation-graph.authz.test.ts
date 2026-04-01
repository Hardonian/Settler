import express from "express";
import request from "supertest";

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const addNodeMock = jest.fn();
const queryMock = jest.fn();
jest.mock("../../../services/reconciliation-graph/graph-engine", () => ({
  graphEngine: {
    addNode: (jobId: string, node: unknown) => addNodeMock(jobId, node),
    addEdge: jest.fn(),
    query: (query: unknown) => queryMock(query),
    getGraphState: jest.fn(),
    subscribe: jest.fn(() => () => undefined),
  },
}));

jest.mock("../../../services/reconciliation-graph/stream-processor", () => ({
  streamProcessor: {
    addEvent: jest.fn(),
  },
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const router = require("../reconciliation-graph").default;

describe("reconciliation graph authz", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v2/reconciliation-graph", router);

  beforeEach(() => {
    jest.clearAllMocks();
    queryMock.mockReturnValue({ nodes: [], edges: [] });
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
  });

  it("fails closed on graph mutation when authz denies", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).post("/api/v2/reconciliation-graph/job-1/nodes").send({});

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(addNodeMock).not.toHaveBeenCalled();
  });

  it("returns explicit unavailable state when preview is disabled", async () => {
    delete process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW;

    const response = await request(app).get("/api/v2/reconciliation-graph/job-1/state");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("STRATEGIC_SURFACE_UNAVAILABLE");
    expect(response.body.capability.state).toBe("unavailable");
  });
});
