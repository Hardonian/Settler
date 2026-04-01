import express from "express";
import request from "supertest";

const queryMock = jest.fn();

jest.mock("../../db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
  transaction: jest.fn(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const router = require("../api-keys").apiKeysRouter;

describe("api keys authz hardening", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v1", router);

  beforeEach(() => {
    jest.clearAllMocks();
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
    queryMock.mockResolvedValue([]);
  });

  it("fails closed on list when canonical authz denies", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).get("/api/v1/api-keys");

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns 400 with machine-visible reason when tenant context is missing", async () => {
    const appNoTenant = express();
    appNoTenant.use(express.json());
    appNoTenant.use((req, _res, next) => {
      (req as any).tenantId = null;
      (req as any).userId = "user-1";
      (req as any).traceId = "trace-1";
      next();
    });
    appNoTenant.use("/api/v1", router);

    const response = await request(appNoTenant).get("/api/v1/api-keys");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("TENANT_CONTEXT_REQUIRED");
    expect(response.body.reason).toBe("missing_tenant_context");
  });
});
