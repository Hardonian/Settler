import express from "express";
import request from "supertest";

const approveRequestMock = jest.fn();

jest.mock("../../../services/approval-workflows", () => ({
  createApprovalRequest: jest.fn(),
  approveRequest: (...args: unknown[]) => approveRequestMock(...args),
  rejectRequest: jest.fn(),
  getApprovalRequest: jest.fn(),
  listApprovalRequests: jest.fn().mockResolvedValue([]),
  addApprover: jest.fn(),
}));

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const router = require("../approvals").default;

describe("approvals authz hardening", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v1/approvals", router);

  beforeEach(() => {
    jest.clearAllMocks();
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
  });

  it("fails closed on approve when canonical authz denies", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).post("/api/v1/approvals/requests/appr-1/approve").send({});

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(approveRequestMock).not.toHaveBeenCalled();
  });

  it("returns 409 with explicit SoD reason when requester tries to approve", async () => {
    approveRequestMock.mockRejectedValue(
      new Error("separation_of_duties_violation: requester cannot approve own request")
    );

    const response = await request(app).post("/api/v1/approvals/requests/appr-1/approve").send({});

    expect(response.status).toBe(409);
    expect(response.body.reason).toBe("separation_of_duties_violation");
  });
});
