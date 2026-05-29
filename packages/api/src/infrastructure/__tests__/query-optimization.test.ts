import { prisma } from "../db/prisma";
import {
  getReconciliationSummary,
  getJobPerformance,
  getTenantUsage,
  getMatchAccuracy,
} from "../query-optimization";

// Mock the entire prisma client module
jest.mock("../db/prisma", () => ({
  prisma: {
    reconResult: {
      groupBy: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    reconJob: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Query Optimization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getReconciliationSummary", () => {
    it("should return summary with grouping and total", async () => {
      (prisma.reconResult.groupBy as jest.Mock).mockResolvedValue([
        { status: "completed", _count: { status: 10 } },
        { status: "failed", _count: { status: 2 } },
      ]);
      (prisma.reconResult.count as jest.Mock).mockResolvedValue(12);

      const result = await getReconciliationSummary("job-123");

      expect(prisma.reconResult.groupBy).toHaveBeenCalledWith({
        by: ["status"],
        where: { reconJobId: "job-123" },
        _count: { status: true },
      });
      expect(prisma.reconResult.count).toHaveBeenCalledWith({
        where: { reconJobId: "job-123" },
      });
      expect(result).toEqual({
        completed: 10,
        failed: 2,
        total: 12,
      });
    });

    it("should apply date ranges", async () => {
      (prisma.reconResult.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.reconResult.count as jest.Mock).mockResolvedValue(0);

      const start = new Date("2023-01-01");
      const end = new Date("2023-01-31");
      await getReconciliationSummary("job-123", { start, end });

      expect(prisma.reconResult.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reconJobId: "job-123",
            createdAt: { gte: start, lte: end },
          },
        })
      );
    });
  });

  describe("getJobPerformance", () => {
    it("should return null if job not found", async () => {
      (prisma.reconJob.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await getJobPerformance("nonexistent");
      expect(result).toBeNull();
    });

    it("should return job performance metrics", async () => {
      const mockDate = new Date();
      (prisma.reconJob.findUnique as jest.Mock).mockResolvedValue({
        id: "job-123",
        results: [{ createdAt: mockDate, status: "completed" }],
      });
      (prisma.reconResult.count as jest.Mock)
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(18) // successful
        .mockResolvedValueOnce(2); // failed
      (prisma.reconResult.aggregate as jest.Mock).mockResolvedValue({
        _avg: { durationMs: 150 },
      });

      const result = await getJobPerformance("job-123");

      expect(result).toEqual({
        job_id: "job-123",
        total_executions: 20,
        successful_executions: 18,
        failed_executions: 2,
        avg_execution_time_ms: 150,
        last_execution_at: mockDate,
        last_execution_status: "completed",
      });
    });
  });

  describe("getTenantUsage", () => {
    it("should return an empty array", async () => {
      const result = await getTenantUsage("tenant-123");
      expect(result).toEqual([]);
    });
  });

  describe("getMatchAccuracy", () => {
    it("should calculate correct match accuracy metrics", async () => {
      (prisma.reconResult.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(90) // accurate
        .mockResolvedValueOnce(10); // inaccurate
      (prisma.reconResult.aggregate as jest.Mock).mockResolvedValue({
        _avg: { confidenceAvg: 0.98 },
      });

      const result = await getMatchAccuracy("job-123");

      expect(result).toEqual({
        job_id: "job-123",
        total_matches: 100,
        accurate_matches: 90,
        inaccurate_matches: 10,
        accuracy_percentage: 90,
        avg_confidence_score: 0.98,
      });
    });

    it("should handle zero total matches", async () => {
      (prisma.reconResult.count as jest.Mock)
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // accurate
        .mockResolvedValueOnce(0); // inaccurate
      (prisma.reconResult.aggregate as jest.Mock).mockResolvedValue({
        _avg: { confidenceAvg: 0 },
      });

      const result = await getMatchAccuracy("job-123");

      expect(result.accuracy_percentage).toBe(0);
    });
  });
});
