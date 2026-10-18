/**
 * Backpressure-Aware SSE Stream Router Specification
 *
 * Verifies Server-Sent Events headers, cursor-based batch streaming,
 * and tenant-isolated endpoint protection.
 */

import express from "express";
import request from "supertest";
import { streamRouter } from "../src/routes/v2/stream";

describe("Backpressure-Aware SSE Stream API", () => {
  let app: express.Express;
  const tenantId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Middleware to set tenantId
    app.use((req, _res, next) => {
      (req as any).tenantId = tenantId;
      next();
    });
    app.use("/api/v2/stream", streamRouter);
  });

  it("establishes SSE connection with correct streaming headers", async () => {
    const res = await request(app)
      .get("/api/v2/stream/runs/run_test_stream_01/records?batchSize=10&totalRecords=20")
      .expect(200);

    expect(res.headers["content-type"]).toBe("text/event-stream");
    expect(res.headers["cache-control"]).toBe("no-cache, no-transform");
    expect(res.headers["connection"]).toBe("keep-alive");

    const text = res.text;
    expect(text).toContain("event: connected");
    expect(text).toContain("event: record_batch");
    expect(text).toContain("event: stream_complete");
    expect(text).toContain('"status":"streaming"');
  });

  it("streams correct progressive batches and progress metrics", async () => {
    const res = await request(app)
      .get("/api/v2/stream/runs/run_test_stream_02/records?batchSize=25&totalRecords=50")
      .expect(200);

    const text = res.text;
    const batchMatches = text.match(/event: record_batch/g);
    expect(batchMatches).toBeDefined();
    expect(batchMatches!.length).toBe(2); // 50 total records / 25 batch size = 2 batches

    expect(text).toContain('"percentage":50');
    expect(text).toContain('"percentage":100');
    expect(text).toContain('"totalStreamed":50');
  });

  it("rejects unauthorized cross-tenant requests with invalid tenant context", async () => {
    const strictApp = express();
    strictApp.use(express.json());
    strictApp.use("/api/v2/stream", streamRouter);

    // Call without authenticated tenant session and invalid query tenant
    const res = await request(strictApp)
      .get("/api/v2/stream/runs/run_invalid/records?tenantId=")
      .expect(403);

    expect(res.body.error).toBeDefined();
  });
});
