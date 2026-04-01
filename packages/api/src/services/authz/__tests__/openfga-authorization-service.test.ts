import { OpenFgaAuthorizationService } from "../openfga-authorization-service";
import { UserRole } from "../../../domain/entities/User";

jest.mock("../../../db", () => ({
  query: jest.fn(),
}));

const { query } = require("../../../db");

describe("OpenFgaAuthorizationService", () => {
  const service = new OpenFgaAuthorizationService();
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.OPENFGA_ENABLED = "false";
    process.env.OPENFGA_REQUIRED = "false";
    delete process.env.OPENFGA_API_URL;
    delete process.env.OPENFGA_STORE_ID;
    delete process.env.OPENFGA_AUTHORIZATION_MODEL_ID;
    query.mockResolvedValue([{ role: UserRole.OWNER }]);
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("allows owner export via local RBAC when OpenFGA is disabled", async () => {
    const result = await service.authorizeTenantAction("user-1", "tenant-1", "tenant.data.export");

    expect(result.allowed).toBe(true);
    expect(result.mode).toBe("local_rbac");
    expect(result.openfga.state).toBe("disabled");
  });

  it("fails closed when OpenFGA is required but unavailable", async () => {
    process.env.OPENFGA_ENABLED = "true";
    process.env.OPENFGA_REQUIRED = "true";
    process.env.OPENFGA_API_URL = "http://openfga.local";
    process.env.OPENFGA_STORE_ID = "store-1";
    process.env.OPENFGA_AUTHORIZATION_MODEL_ID = "model-1";
    (global.fetch as jest.Mock).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const result = await service.authorizeTenantAction("user-1", "tenant-1", "tenant.data.delete");

    expect(result.allowed).toBe(false);
    expect(result.mode).toBe("fail_closed");
    expect(result.degraded).toBe(true);
    expect(result.reason).toBe("openfga_required_unavailable");
  });

  it("denies when local role is insufficient before OpenFGA check", async () => {
    query.mockResolvedValue([{ role: UserRole.DEVELOPER }]);

    const result = await service.authorizeTenantAction("user-1", "tenant-1", "tenant.data.delete");

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("insufficient_local_role");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("denies policy proposal review for developer role", async () => {
    query.mockResolvedValue([{ role: UserRole.DEVELOPER }]);

    const result = await service.authorizeTenantAction(
      "user-1",
      "tenant-1",
      "tenant.policy.proposal.review"
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("insufficient_local_role");
  });

  it("allows integration read for developer role when OpenFGA is disabled", async () => {
    query.mockResolvedValue([{ role: UserRole.DEVELOPER }]);

    const result = await service.authorizeTenantAction(
      "user-1",
      "tenant-1",
      "tenant.integration.read"
    );

    expect(result.allowed).toBe(true);
    expect(result.mode).toBe("local_rbac");
    expect(result.openfga.state).toBe("disabled");
  });

  it("uses OpenFGA decision when enabled and reachable", async () => {
    process.env.OPENFGA_ENABLED = "true";
    process.env.OPENFGA_API_URL = "http://openfga.local";
    process.env.OPENFGA_STORE_ID = "store-1";
    process.env.OPENFGA_AUTHORIZATION_MODEL_ID = "model-1";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ allowed: false }),
    });

    const result = await service.authorizeTenantAction("user-1", "tenant-1", "tenant.data.export");

    expect(result.mode).toBe("openfga");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("openfga_denied");
  });
});
