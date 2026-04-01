import express from "express";
import request from "supertest";

const queryMock = jest.fn();

jest.mock("../../db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
  transaction: jest.fn(async (fn: (client: { query: typeof queryMock }) => unknown) =>
    fn({ query: queryMock })
  ),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../utils/hash", () => ({
  verifyPassword: jest.fn().mockResolvedValue(true),
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const router = require("../users").usersRouter;

describe("users authz hardening", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "11111111-1111-1111-1111-111111111111";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v1/users", router);

  beforeEach(() => {
    jest.clearAllMocks();
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
  });

  it("fails closed on export when canonical authz denies", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).get(
      "/api/v1/users/11111111-1111-1111-1111-111111111111/data-export"
    );

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
  });

  it("returns explicit 403 reason for cross-user export", async () => {
    const response = await request(app).get(
      "/api/v1/users/22222222-2222-2222-2222-222222222222/data-export"
    );

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("cross_user_export_forbidden");
    expect(queryMock).not.toHaveBeenCalled();
  });
});
