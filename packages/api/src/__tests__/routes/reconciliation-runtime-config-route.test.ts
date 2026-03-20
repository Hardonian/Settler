import express, { Express } from "express";
import request from "supertest";
import reconciliationRouter from "../../routes/v1/reconciliation";

const runReconciliationMock = jest.fn();

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../services/ingestion/reconciliation-matcher", () => ({
  runReconciliation: (...args: unknown[]) => runReconciliationMock(...args),
}));

jest.mock("../../utils/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
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

    expect(response.body.error).toBe("Bad Request");
    expect(response.body.message).toContain("config.amountTolerance");
    expect(response.body.message).toContain("config.dateWindowDays");
    expect(runReconciliationMock).not.toHaveBeenCalled();
  });
});

