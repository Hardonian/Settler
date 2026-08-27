import {
  tenantMiddleware,
  type TenantRequest,
  resetTenantAccessTablesCache,
} from "../../middleware/tenant";
import { Container } from "../../infrastructure/di/Container";
import { query } from "../../db";

jest.mock("../../infrastructure/di/Container");
jest.mock("../../db");

const mockedContainer = Container as jest.Mocked<typeof Container>;
const mockedQuery = query as jest.MockedFunction<typeof query>;

function createResponse() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
}

describe("tenant middleware security", () => {
  const activeTenant = {
    id: "tenant-b",
    name: "Tenant B",
    slug: "tenant-b",
    status: "active",
    tier: "growth",
  };

  const tenantRepo = {
    findByCustomDomain: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetTenantAccessTablesCache();
    tenantRepo.findByCustomDomain.mockResolvedValue(null);
    tenantRepo.findBySlug.mockResolvedValue(null);
    tenantRepo.findById.mockResolvedValue(activeTenant);
    mockedContainer.getInstance.mockReturnValue({
      get: jest.fn().mockReturnValue(tenantRepo),
    } as any);
  });

  it("rejects header tenant selection without authenticated identity", async () => {
    const req = {
      get: (name: string) => (name === "X-Tenant-ID" ? "tenant-b" : undefined),
      headers: {},
    } as TenantRequest;
    const res = createResponse();
    const next = jest.fn();

    await tenantMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant header selection without explicit membership", async () => {
    mockedQuery
      .mockResolvedValueOnce([{ tenant_id: "tenant-a" }] as never)
      .mockResolvedValueOnce([{ allowed: false }] as never)
      .mockResolvedValueOnce([] as never);

    const req = {
      userId: "user-1",
      get: (name: string) => {
        if (name === "X-Tenant-ID") return "tenant-b";
        return undefined;
      },
      headers: {},
    } as TenantRequest;
    const res = createResponse();
    const next = jest.fn();

    await tenantMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "TENANT_CONTEXT_FORBIDDEN",
        requested_tenant_id: "tenant-b",
        access_source: "no_membership",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("allows cross-tenant access when an explicit membership exists", async () => {
    mockedQuery
      .mockResolvedValueOnce([{ tenant_id: "tenant-a" }] as never)
      .mockResolvedValueOnce([{ allowed: false }] as never)
      .mockResolvedValueOnce([{ table_name: "memberships" }] as never)
      .mockResolvedValueOnce([{ allowed: true }] as never);

    const req = {
      userId: "user-1",
      get: (name: string) => {
        if (name === "X-Tenant-ID") return "tenant-b";
        return undefined;
      },
      headers: {},
    } as TenantRequest;
    const res = createResponse();
    const next = jest.fn();

    await tenantMiddleware(req, res, next);

    expect(req.tenantId).toBe("tenant-b");
    expect(req.tenant).toEqual(activeTenant);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects custom-domain tenant resolution when the user lacks access", async () => {
    tenantRepo.findByCustomDomain.mockResolvedValue(activeTenant);
    mockedQuery
      .mockResolvedValueOnce([{ tenant_id: "tenant-a" }] as never)
      .mockResolvedValueOnce([{ allowed: false }] as never)
      .mockResolvedValueOnce([] as never);

    const req = {
      userId: "user-1",
      get: (name: string) => {
        if (name === "host") return "tenant-b.app.settler.test";
        return undefined;
      },
      headers: {},
    } as TenantRequest;
    const res = createResponse();
    const next = jest.fn();

    await tenantMiddleware(req, res, next);

    expect(tenantRepo.findByCustomDomain).toHaveBeenCalledWith("tenant-b.app.settler.test");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "TENANT_CONTEXT_FORBIDDEN",
        requested_tenant_id: "tenant-b",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
