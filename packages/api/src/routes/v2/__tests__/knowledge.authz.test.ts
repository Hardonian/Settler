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

const router = require("../knowledge").default;

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
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
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
});
