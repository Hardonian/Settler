import express, { Express } from "express";
import request from "supertest";
import reconciliationRouter from "../../routes/v1/reconciliation";

const runReconciliationMock = jest.fn();

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../services/ingestion/reconciliation-matcher", () => ({
  runReconciliation: (...args: unknown[]) => runReconciliationMock(...args),
}));

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {},
}));

jest.mock("@settler/reconciliation-core", () => ({
  decodeMergedRunsCursor: jest.fn(() => null),
  encodeMergedRunsCursor: jest.fn((s: unknown) =>
    Buffer.from(JSON.stringify(s), "utf8").toString("base64url")
  ),
  fetchMergedReconciliationRunsPage: jest.fn(async () => ({
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
  })),
  MergedRunsCursorError: class MergedRunsCursorError extends Error {},
  resolveReconciliationRunForTenant: jest.fn(async () => ({ kind: "not_found" })),
  serializeV1ReconciliationRunDetail: jest.fn(() => ({ contract_version: 1 })),
}));

jest.mock("../../utils/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
}));

jest.mock("../../db", () => ({
  query: jest.fn(),
  queryWithTenant: jest.fn(),
}));

describe("reconciliation runtime config route", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).tenantId = "11111111-1111-4111-8111-111111111111";
      (req as any).userId = "22222222-2222-4222-8222-222222222222";
      (req as any).traceId = "trace-test";
      next();
    });
    app.use("/api/v1/reconciliation", reconciliationRouter);

    runReconciliationMock.mockReset();
    runReconciliationMock.mockResolvedValue("33333333-3333-4333-8333-333333333333");
  });

  test("does not force default tolerances when config is omitted", async () => {
    const response = await request(app)
      .post("/api/v1/reconciliation/run")
      .send({
        ingestionId: "44444444-4444-4444-8444-444444444444",
      })
      .expect(201);

    expect(response.body.runId).toBe("33333333-3333-4333-8333-333333333333");
    expect(runReconciliationMock).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      undefined,
      undefined,
      {}
    );
  });

  test("passes caller-provided tolerance config through to runtime", async () => {
    await request(app)
      .post("/api/v1/reconciliation/run")
      .send({
        ingestionId: "44444444-4444-4444-8444-444444444444",
        config: {
          amountTolerance: 0.25,
          dateWindowDays: 10,
          fuzzyDescriptionThreshold: 0.91,
          requireExactAmount: true,
        },
      })
      .expect(201);

    expect(runReconciliationMock).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      undefined,
      undefined,
      {
        amountTolerance: 0.25,
        dateWindowDays: 10,
        fuzzyDescriptionThreshold: 0.91,
        requireExactAmount: true,
      }
    );
  });

  test("rejects invalid config values before execution", async () => {
    const response = await request(app)
      .post("/api/v1/reconciliation/run")
      .send({
        ingestionId: "44444444-4444-4444-8444-444444444444",
        config: {
          amountTolerance: -1,
          dateWindowDays: "invalid",
        },
      })
      .expect(400);

    expect(response.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.detail).toContain("config.amountTolerance");
    expect(response.body.detail).toContain("config.dateWindowDays");
    expect(runReconciliationMock).not.toHaveBeenCalled();
  });
});
