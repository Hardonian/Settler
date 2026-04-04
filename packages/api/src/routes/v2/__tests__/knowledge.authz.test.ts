import express from "express";
import request from "supertest";

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const createDecisionMock: jest.Mock = jest.fn();
const queryDecisionsMock: jest.Mock = jest.fn(() => []);
const getDecisionMock: jest.Mock = jest.fn();
const getRelatedDecisionsMock: jest.Mock = jest.fn(() => []);
const updateOutcomesMock: jest.Mock = jest.fn();
jest.mock("../../../services/knowledge/decision-log", () => ({
  DECISION_STATUSES: ["proposed", "accepted", "rejected", "superseded"],
  decisionLog: {
    createDecision: (decision: unknown) => createDecisionMock(decision),
    queryDecisions: (query: unknown) => queryDecisionsMock(query),
    getDecision: (id: unknown) => getDecisionMock(id),
    getRelatedDecisions: (id: unknown) => getRelatedDecisionsMock(id),
    updateOutcomes: (id: unknown, outcome: unknown) => updateOutcomesMock(id, outcome),
  },
}));

const assistantQueryMock: jest.Mock = jest.fn();
const assistantStatsMock: jest.Mock = jest.fn(() => ({
  totalItems: 0,
  byType: {},
}));
jest.mock("../../../services/knowledge/ai-assistant", () => ({
  aiKnowledgeAssistant: {
    query: (...args: unknown[]) => assistantQueryMock(...args),
    getStats: () => assistantStatsMock(),
  },
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const router = require("../knowledge").default;

const makeDecision = (id: string) => ({
  id,
  title: `Decision ${id}`,
  date: new Date("2026-03-01T12:00:00.000Z"),
  decisionMakers: ["user-1"],
  status: "accepted",
  context: "Context",
  decision: "Decision text",
  rationale: "Rationale",
  alternativesConsidered: [],
  expectedOutcomes: "",
  actualOutcomes: [],
  lessonsLearned: "",
  relatedDecisions: [],
  tags: ["knowledge"],
});

describe("knowledge route authz", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v2/knowledge", router);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW;
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
    queryDecisionsMock.mockReturnValue([]);
    getDecisionMock.mockReturnValue(undefined);
    getRelatedDecisionsMock.mockReturnValue([]);
    assistantStatsMock.mockReturnValue({
      totalItems: 0,
      byType: {},
    });
  });

  it("fails closed when authz denies read", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).get("/api/v2/knowledge/decisions");

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
  });

  it("returns tenant-context-required when tenant is missing", async () => {
    const appNoTenant = express();
    appNoTenant.use(express.json());
    appNoTenant.use((req, _res, next) => {
      (req as any).tenantId = null;
      (req as any).userId = "user-1";
      (req as any).traceId = "trace-1";
      next();
    });
    appNoTenant.use("/api/v2/knowledge", router);

    const response = await request(appNoTenant).get("/api/v2/knowledge/stats");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
  });

  it("returns explicit unavailable state when preview is disabled", async () => {
    const response = await request(app).get("/api/v2/knowledge/stats");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("STRATEGIC_SURFACE_UNAVAILABLE");
    expect(response.body.capability.state).toBe("unavailable");
  });

  it("validates structured decision query filters", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";

    const response = await request(app).get(
      "/api/v2/knowledge/decisions?startDate=2026-03-01T00:00:00.000Z"
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
    expect(response.body.details.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "startDate and endDate must be provided together",
          path: "query.dateRange",
        }),
      ])
    );
    expect(queryDecisionsMock).not.toHaveBeenCalled();
  });

  it("returns normalized list responses with count and preview metadata", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";
    queryDecisionsMock.mockReturnValue([makeDecision("dec-1"), makeDecision("dec-2")]);

    const response = await request(app).get(
      "/api/v2/knowledge/decisions?status=accepted&search=policy&startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-31T23:59:59.999Z"
    );

    expect(response.status).toBe(200);
    expect(queryDecisionsMock).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      status: "accepted",
      decisionMaker: undefined,
      tag: undefined,
      search: "policy",
      dateRange: {
        start: new Date("2026-03-01T00:00:00.000Z"),
        end: new Date("2026-03-31T23:59:59.999Z"),
      },
    });
    expect(response.body.count).toBe(2);
    expect(response.body.capability.state).toBe("degraded");
    expect(response.body.metadata).toEqual({
      tenantId: "tenant-1",
      preview: true,
      guarantee: "local_only",
    });
    expect(response.body.data).toHaveLength(2);
  });

  it("returns coherent detail responses with decision and related decisions separated", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";
    getDecisionMock.mockReturnValue({
      ...makeDecision("dec-1"),
      relatedDecisions: ["dec-2"],
    });
    getRelatedDecisionsMock.mockReturnValue([makeDecision("dec-2")]);

    const response = await request(app).get("/api/v2/knowledge/decisions/dec-1");

    expect(response.status).toBe(200);
    expect(response.body.data.decision.id).toBe("dec-1");
    expect(response.body.data.decision.relatedDecisions).toEqual(["dec-2"]);
    expect(response.body.data.relatedDecisions).toEqual([expect.objectContaining({ id: "dec-2" })]);
  });

  it("returns assistant responses with explicit mock generation metadata", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";
    assistantQueryMock.mockResolvedValue({
      answer: "Preview answer",
      confidence: 85,
      sources: [],
      relatedQuestions: [],
      generation: {
        mode: "mock_template",
        degraded: true,
        productionIntegrationPath:
          "Replace template generation with a tenant-scoped retrieval pipeline.",
      },
    });

    const response = await request(app)
      .post("/api/v2/knowledge/assistant/query")
      .send({ question: "How do we handle disputes?" });

    expect(response.status).toBe(200);
    expect(response.body.data.generation.mode).toBe("mock_template");
    expect(response.body.data.generation.degraded).toBe(true);
    expect(response.body.capability.state).toBe("degraded");
  });
});
