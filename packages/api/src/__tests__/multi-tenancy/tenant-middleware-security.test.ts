import { tenantMiddleware, type TenantRequest } from "../../middleware/tenant";
import { Container } from "../../infrastructure/di/Container";
import { query } from "../../db";
import { UserRole } from "../../domain/entities/User";

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
  const tenantRepo = {
    findByCustomDomain: jest.fn().mockResolvedValue(null),
    findBySlug: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("rejects cross-tenant header selection for non-admin roles", async () => {
    mockedQuery.mockResolvedValue([{ tenant_id: "tenant-a", role: UserRole.DEVELOPER }] as never);

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
    expect(next).not.toHaveBeenCalled();
  });
});
