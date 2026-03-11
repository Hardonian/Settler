import express from "express";
import request from "supertest";
import ingestionRouter from "../ingestion";

const mockQuery = jest.fn();

jest.mock("../../../db", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock("../../../middleware/usage-enforcement", () => ({
  checkIngestionLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../../services/operator-mode/kill-switches", () => ({
  isConnectorDisabled: jest.fn().mockResolvedValue(false),
  isBackgroundJobPaused: jest.fn().mockResolvedValue(false),
}));

jest.mock("../../../services/operator-mode/cost-controls", () => ({
  canRunBackgroundJob: jest.fn().mockResolvedValue({ allowed: true }),
}));

describe("ingestion preview route", () => {
  function buildApp(tenantId?: string) {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).tenantId = tenantId;
      (req as any).userId = "user-1";
      (req as any).traceId = "trace-1";
      next();
    });
    app.use("/api/v1/ingestion", ingestionRouter);
    return app;
  }

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns 400 when tenant context is missing", async () => {
    const app = buildApp(undefined);

    const response = await request(app)
      .post("/api/v1/ingestion/preview")
      .attach("file", Buffer.from("Date,Amount\n2026-01-01,12.00"), "sample.csv");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("TENANT_CONTEXT_REQUIRED");
  });

  it("returns 400 when columnMapping is malformed JSON", async () => {
    const app = buildApp("tenant-1");

    const response = await request(app)
      .post("/api/v1/ingestion/preview")
      .field("columnMapping", "{invalid")
      .attach("file", Buffer.from("Date,Amount\n2026-01-01,12.00"), "sample.csv");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INGESTION_INVALID_COLUMN_MAPPING");
  });

  it("uses tenant-scoped baseline query when sourceId is provided", async () => {
    const app = buildApp("tenant-abc");
    mockQuery.mockResolvedValue([
      {
        id: "ing-prev",
        completed_at: new Date("2026-01-01T00:00:00.000Z"),
        metadata: JSON.stringify({
          importWorkbench: {
            sourceSummary: {
              headers: ["Date", "Amount"],
            },
          },
        }),
      },
    ]);

    const response = await request(app)
      .post("/api/v1/ingestion/preview")
      .field("sourceId", "source-1")
      .attach("file", Buffer.from("Date,Amount\n2026-01-01,12.00"), "sample.csv");

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const args = mockQuery.mock.calls[0];
    expect(args[1]).toEqual(["tenant-abc", "source-1"]);
    expect(response.body.preview.schemaDrift).toBeDefined();
  });

  it("returns 400 for recent workbench without tenant", async () => {
    const app = buildApp(undefined);
    const response = await request(app).get("/api/v1/ingestion/workbench/recent");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("TENANT_CONTEXT_REQUIRED");
  });

  it("queries recent workbench with tenant filter", async () => {
    const app = buildApp("tenant-recent");
    mockQuery.mockResolvedValue([
      {
        id: "ing-1",
        source_id: "source-1",
        status: "completed",
        completed_at: new Date("2026-01-03T00:00:00.000Z"),
        metadata: JSON.stringify({ importWorkbench: { canProceed: true } }),
      },
    ]);

    const response = await request(app).get("/api/v1/ingestion/workbench/recent?limit=5");

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0]?.[1]).toEqual(["tenant-recent", "5"]);
    expect(response.body.items).toHaveLength(1);
  });

  it("returns 400 for retry without tenant", async () => {
    const app = buildApp(undefined);
    const response = await request(app).post("/api/v1/ingestion/ing-1/retry").send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("TENANT_CONTEXT_REQUIRED");
  });

  it("uses tenant-scoped raw-record query for retry", async () => {
    const app = buildApp("tenant-retry");
    mockQuery.mockResolvedValueOnce([
      {
        source_id: "source-1",
        row_number: 1,
        raw_data: JSON.stringify({ Date: "2026-01-01", Amount: "12.00" }),
      },
    ]);
    mockQuery.mockResolvedValueOnce([]); // drift baseline lookup

    const response = await request(app)
      .post("/api/v1/ingestion/ing-retry/retry")
      .send({ dryRun: true, columnMapping: { date: "Date", amount: "Amount" } });

    expect(response.status).toBe(200);
    expect(mockQuery.mock.calls[0]?.[1]).toEqual(["ing-retry", "tenant-retry"]);
    expect(response.body.mode).toBe("dry_run");
  });

});
