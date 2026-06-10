import express from "express";
import request from "supertest";

jest.mock("../../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  bypassFreeze: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const authorizeTenantActionMock = jest.fn();
jest.mock("../../../services/authz/openfga-authorization-service", () => ({
  getOpenFgaAuthorizationService: () => ({
    authorizeTenantAction: authorizeTenantActionMock,
  }),
}));

const createExportMock = jest.fn();
const getExportMock = jest.fn((_id: string) => undefined as any);
jest.mock("../../../services/compliance/export-system", () => ({
  complianceExportSystem: {
    createExport: (tenantId: string, jurisdiction: unknown, format: unknown) =>
      createExportMock(tenantId, jurisdiction, format),
    listExports: jest.fn(() => []),
    listExportsFromDb: jest.fn(() => []),
    getExport: (id: string) => getExportMock(id),
    getExportFromDb: (id: string, tenantId: string) => getExportMock(id),
    getTemplates: jest.fn(() => []),
  },
}));

const router = require("../compliance").default;

describe("compliance route authz", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-1";
    (req as any).userId = "user-1";
    (req as any).traceId = "trace-1";
    next();
  });
  app.use("/api/v2/compliance", router);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW;
    authorizeTenantActionMock.mockResolvedValue({
      allowed: true,
      degraded: false,
      mode: "local_rbac",
      openfga: { state: "disabled", allowed: false, reason: "openfga_disabled" },
    });
  });

  it("fails closed when export authz denies", async () => {
    authorizeTenantActionMock.mockResolvedValue({
      allowed: false,
      reason: "openfga_required_unavailable",
      degraded: true,
      mode: "fail_closed",
      openfga: { state: "unavailable", allowed: false, reason: "openfga_unavailable" },
    });

    const response = await request(app).post("/api/v2/compliance/exports").send({
      jurisdiction: "GDPR",
      format: "json",
    });

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe("openfga_required_unavailable");
    expect(createExportMock).not.toHaveBeenCalled();
  });

  it("returns explicit unavailable state when preview is disabled", async () => {
    const response = await request(app).get("/api/v2/compliance/templates");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("STRATEGIC_SURFACE_UNAVAILABLE");
    expect(response.body.capability.state).toBe("unavailable");
  });

  it("closes cross-tenant export lookups with a not-found response", async () => {
    process.env.SETTLER_ENABLE_V2_STRATEGIC_PREVIEW = "true";
    getExportMock.mockReturnValue({
      id: "export-1",
      customerId: "tenant-2",
      jurisdiction: "GDPR",
      format: "json",
      status: "ready",
    });

    const response = await request(app).get("/api/v2/compliance/exports/export-1");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Export not found");
  });
});
