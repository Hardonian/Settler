import express from "express";
import request from "supertest";
import { exportEnhancedRouter } from "../export-enhanced";
import { query } from "../../db";

jest.mock("../../db", () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  requireResourceOwnership: (_req: any, _res: any, next: any) => next(),
}));

const mockQuery = query as jest.Mock;

describe("Cross-tenant Data Access Regression Tests", () => {
  const app = express();
  app.use(express.json());

  // Setup request context for Tenant A
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
      // 1. Mock job ownership check (passes for job-1 in tenant-A)
      mockQuery.mockResolvedValueOnce([{ id: "job-1", name: "Job 1" }]);

      // 2. Mock execution lookup (fails, no execution found in tenant-A for this job/date)
      mockQuery.mockResolvedValueOnce([]);

      const response = await request(app)
        .get("/api/v1/jobs/00000000-0000-0000-0000-000000000001/export?format=csv")
        .set("Accept", "text/csv");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("No execution found");

      // Verify query calls included tenant_id
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("tenant_id = $3"),
        expect.arrayContaining(["tenant-A"])
      );
    });

    it("should enforce tenant_id in accounting format queries", async () => {
      // 1. Mock job ownership check
      mockQuery.mockResolvedValueOnce([{ id: "job-1", name: "Job 1" }]);

      // 2. Mock execution lookup
      mockQuery.mockResolvedValueOnce([{ id: "exec-1" }]);

      // 3. Mock matches query (the one we fixed)
      mockQuery.mockResolvedValueOnce([]);

      await request(app).get(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000001/export?format=quickbooks"
      );

      // Verify the 3rd query (matches) includes tenant_id
      const matchesQuery = mockQuery.mock.calls[2];
      expect(matchesQuery[0]).toContain("AND tenant_id = $2");
      expect(matchesQuery[1]).toContain("tenant-A");
    });
  });
});
