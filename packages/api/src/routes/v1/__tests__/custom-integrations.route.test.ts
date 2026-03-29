import express from "express";
import request from "supertest";

const createCustomIntegrationMock = jest.fn();
const listCustomIntegrationsMock = jest.fn();

jest.mock("../../../services/custom-integrations", () => ({
  createCustomIntegration: (...args: unknown[]) => createCustomIntegrationMock(...args),
  listCustomIntegrations: (...args: unknown[]) => listCustomIntegrationsMock(...args),
  getCustomIntegration: jest.fn(),
  updateCustomIntegration: jest.fn(),
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

const router = require("../custom-integrations").default;

describe("custom integrations authz hardening", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    next();
  });
  app.use("/api/v1/custom-integrations", router);

  beforeEach(() => {
    jest.clearAllMocks();
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
  });

  it("returns 403 and does not mutate when OpenFGA denies integration management", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app)
      .post("/api/v1/custom-integrations")
      .send({
        integrationName: "ERP",
        integrationType: "erp",
        adapterConfig: { provider: "x" },
      });

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(createCustomIntegrationMock).not.toHaveBeenCalled();
  });

  it("returns 400 when tenant context is missing for list route", async () => {
    const appNoTenant = express();
    appNoTenant.use(express.json());
    appNoTenant.use((req, _res, next) => {
      (req as any).tenantId = null;
      (req as any).userId = "user-1";
      next();
    });
    appNoTenant.use("/api/v1/custom-integrations", router);

    const response = await request(appNoTenant).get("/api/v1/custom-integrations");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
    expect(listCustomIntegrationsMock).not.toHaveBeenCalled();
  });
});
