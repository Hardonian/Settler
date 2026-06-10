import express, { Express } from "express";
import request from "supertest";
import reconciliationRouter from "../../routes/v1/reconciliation";
import {
  fetchMergedReconciliationRunsPage,
  resolveReconciliationRunForTenant,
} from "@settler/reconciliation-core";

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockRunReconciliation = jest.fn().mockResolvedValue("33333333-3333-4333-8333-333333333333");

jest.mock("../../services/ingestion/reconciliation-matcher", () => ({
  runReconciliation: (...args: unknown[]) => mockRunReconciliation(...args),
}));

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {},
}));

jest.mock("@settler/reconciliation-core", () => {
  const actual = jest.requireActual<typeof import("@settler/reconciliation-core")>(
    "@settler/reconciliation-core"
  );
  return {
    ...actual,
    fetchMergedReconciliationRunsPage: jest.fn(),
    resolveReconciliationRunForTenant: jest.fn(),
  };
});

jest.mock("../../db", () => {
  const queryMock = jest.fn();
  return {
    query: queryMock,
    queryWithTenant: jest.fn((tenantId: string, text: string, params?: any[]) =>
      queryMock(text, params)
    ),
  };
});

jest.mock("../../utils/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
}));

import { query } from "../../db";
const tenantId = "11111111-1111-4111-8111-111111111111";

describe("reconciliation v1 contract", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as { tenantId?: string; userId?: string; traceId?: string }).tenantId = tenantId;
      (req as { tenantId?: string; userId?: string; traceId?: string }).userId =
        "22222222-2222-4222-8222-222222222222";
      (req as { tenantId?: string; userId?: string; traceId?: string }).traceId = "trace-contract";
      next();
    });
    app.use("/api/v1/reconciliation", reconciliationRouter);

    (fetchMergedReconciliationRunsPage as jest.Mock).mockReset();
    (fetchMergedReconciliationRunsPage as jest.Mock).mockResolvedValue({
      runs: [],
      next_cursor: null,
      pagination: {
        limit: 50,
        returned: 0,
        has_more: false,
        job_stream_has_more: false,
        ingestion_stream_has_more: false,
        job_stream_exhausted: true,
        ingestion_stream_exhausted: true,
      },
      response_meta: {
        contract_version: 1,
        included_run_kinds: ["recon_job", "ingestion_run"],
        ordering: "test",
        consistency: "read_committed",
      },
    });
    (resolveReconciliationRunForTenant as jest.Mock).mockReset();
    (query as jest.Mock).mockReset();
    mockRunReconciliation.mockClear();
    mockRunReconciliation.mockResolvedValue("33333333-3333-4333-8333-333333333333");
  });

  test("GET /runs rejects malformed cursor with RECONCILIATION_CURSOR_INVALID", async () => {
    const res = await request(app)
      .get("/api/v1/reconciliation/runs?cursor=not-valid-base64url!!!")
      .expect(400);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe("RECONCILIATION_CURSOR_INVALID");
  });

  test("GET /runs/:id/matches returns 409 RECONCILIATION_WRONG_RUN_KIND for recon_job id", async () => {
    (resolveReconciliationRunForTenant as jest.Mock).mockResolvedValue({
      kind: "recon_job",
      detail: { runKind: "recon_job" },
    });

    const res = await request(app)
      .get("/api/v1/reconciliation/runs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/matches")
      .expect(409);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe("RECONCILIATION_WRONG_RUN_KIND");
    expect(res.body.resolved_run_kind).toBe("recon_job");
    expect(query as jest.Mock).not.toHaveBeenCalled();
  });

  test("GET /runs/:id returns 409 RECONCILIATION_UUID_COLLISION when both tables share an id", async () => {
    (resolveReconciliationRunForTenant as jest.Mock).mockResolvedValue({
      kind: "ambiguous_uuid_collision",
      jobId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ingestionRunId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });

    const res = await request(app)
      .get("/api/v1/reconciliation/runs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .expect(409);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe("RECONCILIATION_UUID_COLLISION");
    expect(res.body.recon_job_id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(res.body.reconciliation_run_id).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  });

  test("GET /runs serves identical pages for concurrent pollers (same tenant, same params)", async () => {
    const pagePayload = {
      runs: [{ id: "run-1", runKind: "ingestion_run" } as never],
      next_cursor: null,
      pagination: {
        limit: 10,
        returned: 1,
        has_more: false,
        job_stream_has_more: false,
        ingestion_stream_has_more: false,
        job_stream_exhausted: true,
        ingestion_stream_exhausted: true,
      },
      response_meta: {
        contract_version: 1 as const,
        included_run_kinds: ["recon_job", "ingestion_run"] as const,
        ordering: "test",
        consistency: "read_committed" as const,
      },
    };
    (fetchMergedReconciliationRunsPage as jest.Mock).mockResolvedValue(pagePayload);

    const concurrent = 24;
    const responses = await Promise.all(
      Array.from({ length: concurrent }, () =>
        request(app).get("/api/v1/reconciliation/runs?limit=10&run_kind=all")
      )
    );

    const expectedBody = {
      contract_version: 1,
      ...pagePayload,
      traceId: "trace-contract",
    };

    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expectedBody);
    }

    expect(fetchMergedReconciliationRunsPage).toHaveBeenCalledTimes(concurrent);
    for (const [arg] of (fetchMergedReconciliationRunsPage as jest.Mock).mock.calls) {
      expect(arg.tenantId).toBe(tenantId);
      expect(arg.limit).toBe(10);
      expect(arg.runKind).toBe("all");
      expect(arg.cursorState).toBeNull();
    }
  });

  test("POST /run rejects object ingestionId with validation error", async () => {
    const res = await request(app)
      .post("/api/v1/reconciliation/run")
      .send({ ingestionId: { not: "valid" } })
      .expect(400);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(mockRunReconciliation).not.toHaveBeenCalled();
  });

  test("POST /run forwards trimmed jobId and templateId when strings", async () => {
    await request(app)
      .post("/api/v1/reconciliation/run")
      .send({
        ingestionId: "ing-1",
        jobId: "  job-abc  ",
        templateId: "tpl-1",
      })
      .expect(201);

    expect(mockRunReconciliation).toHaveBeenCalledWith(
      "ing-1",
      tenantId,
      "22222222-2222-4222-8222-222222222222",
      "job-abc",
      "tpl-1",
      {}
    );
  });

  test("GET /runs/:id/matches caps limit at 500", async () => {
    (resolveReconciliationRunForTenant as jest.Mock).mockResolvedValue({ kind: "ingestion_run" });
    (query as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "0" }]);

    const res = await request(app)
      .get("/api/v1/reconciliation/runs/cccccccc-cccc-4ccc-8ccc-cccccccccccc/matches?limit=99999")
      .expect(200);

    expect(res.body.pagination.limit).toBe(500);
    const q = query as jest.Mock;
    expect(q).toHaveBeenCalled();
    const matchArgs = q.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === "string" && (c[0] as string).includes("FROM reconciliation_matches rm")
    );
    expect(matchArgs).toBeDefined();
    expect(matchArgs![1]).toContain("500");
  });
});
