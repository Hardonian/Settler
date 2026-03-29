import express from "express";
import request from "supertest";

const serviceMock = {
  listPolicyEvolutionProposals: jest.fn(),
  getPolicyEvolutionProposalDetail: jest.fn(),
  reviewPolicyEvolutionProposal: jest.fn(),
  getProposalHistory: jest.fn(),
  getExceptionPlaybooks: jest.fn(),
  getDecisionHistory: jest.fn(),
  getSnapshot: jest.fn(),
  getProofGraph: jest.fn(),
  buildEvidencePack: jest.fn(),
  simulatePolicy: jest.fn(),
};

jest.mock("../../../services/operator-mode/exception-intelligence-service", () => ({
  ExceptionIntelligenceService: jest.fn(() => serviceMock),
}));

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const router = require("../exception-intelligence").default;

describe("exception intelligence route contracts", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    next();
  });
  app.use("/api/v1", router);

  beforeEach(() => jest.clearAllMocks());

  it("serves policy proposal list", async () => {
    serviceMock.listPolicyEvolutionProposals.mockResolvedValue([{ proposalId: "proposal-1" }]);
    const response = await request(app).get("/api/v1/operator/intelligence/policy/proposals");
    expect(response.status).toBe(200);
    expect(response.body.data[0].proposalId).toBe("proposal-1");
  });

  it("serves policy proposal detail", async () => {
    serviceMock.getPolicyEvolutionProposalDetail.mockResolvedValue({ proposalId: "proposal-1" });
    const response = await request(app).get(
      "/api/v1/operator/intelligence/policy/proposals/proposal-1"
    );
    expect(response.status).toBe(200);
    expect(response.body.data.proposalId).toBe("proposal-1");
  });

  it("serves proposal review action", async () => {
    serviceMock.reviewPolicyEvolutionProposal.mockResolvedValue({
      accepted: true,
      status: "approved",
    });
    const response = await request(app)
      .post("/api/v1/operator/intelligence/policy/proposals/proposal-1/review")
      .send({ decision: "approved", reason: "evidence_quality" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("approved");
  });

  it("serves proposal history", async () => {
    serviceMock.getProposalHistory.mockResolvedValue({ proposalId: "proposal-1", reviews: [] });
    const response = await request(app).get(
      "/api/v1/operator/intelligence/policy/proposals/proposal-1/history"
    );
    expect(response.status).toBe(200);
    expect(response.body.data.proposalId).toBe("proposal-1");
  });

  it("serves playbooks and decision history", async () => {
    serviceMock.getExceptionPlaybooks.mockResolvedValue({ playbooks: [], degraded: false });
    serviceMock.getDecisionHistory.mockResolvedValue({ decisions: [], degraded: true });

    const playbookRes = await request(app).get("/api/v1/operator/intelligence/playbooks");
    const decisionsRes = await request(app).get("/api/v1/operator/intelligence/decisions/history");

    expect(playbookRes.status).toBe(200);
    expect(decisionsRes.status).toBe(200);
    expect(decisionsRes.body.data.degraded).toBe(true);
  });
});
