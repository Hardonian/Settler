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
  getSignatureLifecycle: jest.fn(),
  getSourceFrictionSummary: jest.fn(),
  getEntityFingerprints: jest.fn(),
  getProposalEffectivenessSummary: jest.fn(),
  getPackRuntimeSummary: jest.fn(),
  getOperatorDecisionEffectiveness: jest.fn(),
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

  it("serves lifecycle/friction/fingerprint/effectiveness surfaces", async () => {
    serviceMock.getSignatureLifecycle.mockResolvedValue({ signature: "s" });
    serviceMock.getSourceFrictionSummary.mockResolvedValue({ sources: [] });
    serviceMock.getEntityFingerprints.mockResolvedValue({ entities: [] });
    serviceMock.getProposalEffectivenessSummary.mockResolvedValue({ proposals: [] });
    serviceMock.getPackRuntimeSummary.mockResolvedValue({ packs: [] });
    serviceMock.getOperatorDecisionEffectiveness.mockResolvedValue({ patterns: [] });

    const [sig, source, entity, proposal, pack, operator] = await Promise.all([
      request(app).get("/api/v1/operator/intelligence/signatures/12345678901234567890/lifecycle"),
      request(app).get("/api/v1/operator/intelligence/sources/friction"),
      request(app).get("/api/v1/operator/intelligence/entities/fingerprints"),
      request(app).get("/api/v1/operator/intelligence/effectiveness/proposals"),
      request(app).get("/api/v1/operator/intelligence/packs/runtime"),
      request(app).get("/api/v1/operator/intelligence/decisions/effectiveness"),
    ]);

    expect(sig.status).toBe(200);
    expect(source.status).toBe(200);
    expect(entity.status).toBe(200);
    expect(proposal.status).toBe(200);
    expect(pack.status).toBe(200);
    expect(operator.status).toBe(200);
  });

  it("returns 400 without tenant context instead of hard 500", async () => {
    const appNoTenant = express();
    appNoTenant.use(express.json());
    appNoTenant.use((req, _res, next) => {
      (req as any).tenantId = null;
      next();
    });
    appNoTenant.use("/api/v1", router);

    const response = await request(appNoTenant).get(
      "/api/v1/operator/intelligence/sources/friction"
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
  });
});
