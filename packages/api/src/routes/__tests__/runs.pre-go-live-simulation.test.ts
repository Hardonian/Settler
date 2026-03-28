/**
 * Pre-go-live simulation coverage for operator runs APIs.
 *
 * These scenarios intentionally exercise concurrent reads, degraded detail fetches,
 * and retry-duplication pressure with tenant-safe assertions.
 */

import request from "supertest";
import express from "express";
import { runsRouter } from "../runs";
import { AuthRequest } from "../../middleware/auth";

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    reconResult: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockResolveOperatorRunDetail = jest.fn();
jest.mock(
  "@settler/reconciliation-core",
  () => ({
    resolveOperatorRunDetailForTenants: (...args: unknown[]) =>
      mockResolveOperatorRunDetail(...args),
  }),
  { virtual: true }
);

const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconResult = mockedPrisma.reconResult;

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  bypassFreeze: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

function buildApp(tenantId: string, userId = "operator-sim"): express.Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as AuthRequest).tenantId = tenantId;
    (req as AuthRequest).userId = userId;
    next();
  });
  app.use("/api/runs", runsRouter);
  return app;
}

describe("Runs pre-go-live simulation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveOperatorRunDetail.mockReset();
  });

  it("sustains bursty multi-tenant list/detail polling without tenant scope drift", async () => {
    const appA = buildApp("tenant-A");
    const appB = buildApp("tenant-B");

    mockReconResult.findMany.mockImplementation(({ where }: { where: { tenantId: string } }) =>
      Promise.resolve([
        {
          id: `${where.tenantId}-run-1`,
          reconJobId: `${where.tenantId}-job-1`,
          reconJob: { name: `Daily ${where.tenantId}` },
          status: "running",
          startedAt: new Date("2026-03-28T10:00:00Z"),
          completedAt: null,
          summary: { total: 10, matched: 8, unmatched: 2, conflicts: 0 },
        },
      ])
    );
    mockReconResult.count.mockResolvedValue(1);

    mockResolveOperatorRunDetail.mockImplementation(
      async (_prisma: unknown, tenantScope: string[], runId: string) => ({
        kind: "ok",
        detail: {
          runKind: "recon_job" as const,
          id: runId,
          name: `Run ${runId}`,
          status: "running",
          progress: 50,
          stages: [],
          tenantScope,
        },
      })
    );

    const requests = Array.from({ length: 20 }).flatMap((_, idx) => [
      request(appA).get(`/api/runs?page=${(idx % 3) + 1}&limit=10`),
      request(appA).get(`/api/runs/tenant-A-run-${idx}`),
      request(appB).get(`/api/runs?page=${(idx % 3) + 1}&limit=10`),
      request(appB).get(`/api/runs/tenant-B-run-${idx}`),
    ]);

    const responses = await Promise.all(requests);
    expect(responses.every((res) => res.status === 200)).toBe(true);

    const listTenantIds = mockReconResult.findMany.mock.calls.map(
      (call: [{ where: { tenantId: string } }]) => call[0].where.tenantId
    );
    expect(listTenantIds).toContain("tenant-A");
    expect(listTenantIds).toContain("tenant-B");

    const detailTenantScopes = mockResolveOperatorRunDetail.mock.calls.map(
      (call: [unknown, string[], string]) => call[1][0]
    );
    expect(detailTenantScopes).toContain("tenant-A");
    expect(detailTenantScopes).toContain("tenant-B");
  });

  it("keeps operator-visible truth explicit across mixed success/not-found/degraded detail responses", async () => {
    const app = buildApp("tenant-sim");

    mockResolveOperatorRunDetail
      .mockResolvedValueOnce({
        kind: "ok",
        detail: { id: "run-ok", name: "ok", status: "running" },
      })
      .mockResolvedValueOnce({ kind: "not_found" })
      .mockResolvedValueOnce({ kind: "recon_enrichment_failed", message: "snapshot timeout" });

    const [ok, missing, degraded] = await Promise.all([
      request(app).get("/api/runs/run-ok"),
      request(app).get("/api/runs/run-missing"),
      request(app).get("/api/runs/run-degraded"),
    ]);

    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe("running");

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("NOT_FOUND");

    expect(degraded.status).toBe(500);
    expect(degraded.body.error).toBe("INTERNAL_SERVER_ERROR");
  });

  it("prevents duplicate retries during concurrent retry pressure on the same failed run", async () => {
    const app = buildApp("tenant-retry", "operator-1");
    let retryRunId: string | null = null;

    mockReconResult.findFirst.mockImplementation(
      async ({
        where,
      }: {
        where: { id?: string; metadata?: { path: string[]; equals: string } };
      }) => {
        if (where.id) {
          return {
            id: where.id,
            reconJobId: "job-1",
            reconJob: { id: "job-1", name: "Daily Reconciliation" },
            status: "failed",
            tenantId: "tenant-retry",
            startedAt: new Date(),
            completedAt: new Date(),
            summary: null,
            errorMessage: "synthetic failure",
          };
        }

        if (where.metadata?.equals && retryRunId) {
          return { id: retryRunId };
        }

        return null;
      }
    );

    mockReconResult.create.mockImplementation(async () => {
      retryRunId = "retry-1";
      return {
        id: "retry-1",
        reconJobId: "job-1",
        status: "running",
        startedAt: new Date(),
      };
    });

    const [first, second] = await Promise.all([
      request(app).post("/api/runs/run-failed/retry"),
      request(app).post("/api/runs/run-failed/retry"),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    expect(mockReconResult.create).toHaveBeenCalledTimes(1);
  });
});
