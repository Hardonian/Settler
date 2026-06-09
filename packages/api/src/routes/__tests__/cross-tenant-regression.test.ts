import express from "express";
import request from "supertest";
import { exportEnhancedRouter } from "../export-enhanced";
import { queryWithTenant } from "../../db";

jest.mock("../../db", () => ({
  queryWithTenant: jest.fn(),
  query: jest.fn(),
  transaction: jest.fn(),
  transactionWithTenant: jest.fn(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  requireResourceOwnership: (_req: any, _res: any, next: any) => next(),
}));

const mockQueryWithTenant = queryWithTenant as jest.Mock;

describe("Cross-tenant Data Access Regression Tests", () => {
  const app = express();
  app.use(express.json());

  app.use((req: any, _res, next) => {
    req.tenantId = "tenant-A";
    req.userId = "user-A";
    req.traceId = "trace-A";
    next();
  });

  app.use("/api/v1", exportEnhancedRouter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Enhanced Exports Tenant Scoping", () => {
    it("should NOT return matches if the execution DOES NOT belong to the active tenant", async () => {
      mockQueryWithTenant.mockResolvedValueOnce([{ id: "job-1", name: "Job 1" }]);
      mockQueryWithTenant.mockResolvedValueOnce([]);

      const response = await request(app)
        .get("/api/v1/jobs/00000000-0000-0000-0000-000000000001/export?format=csv")
        .set("Accept", "text/csv");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("No execution found");
      expect(mockQueryWithTenant).toHaveBeenCalledWith(
        "tenant-A",
        expect.stringContaining("tenant_id = $3"),
        expect.arrayContaining(["tenant-A"])
      );
    });

    it("should enforce tenant_id in accounting format queries", async () => {
      mockQueryWithTenant.mockResolvedValueOnce([{ id: "job-1", name: "Job 1" }]);
      mockQueryWithTenant.mockResolvedValueOnce([{ id: "exec-1" }]);
      mockQueryWithTenant.mockResolvedValueOnce([]);

      await request(app).get(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000001/export?format=quickbooks"
      );

      const matchesQuery = mockQueryWithTenant.mock.calls[2];
      expect(matchesQuery[0]).toBe("tenant-A");
      expect(matchesQuery[1]).toContain("AND tenant_id = $2");
      expect(matchesQuery[2]).toContain("tenant-A");
    });
  });
});
