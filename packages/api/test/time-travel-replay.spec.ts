import express from "express";
import request from "supertest";
import { timeTravelRouter } from "../src/routes/v2/time-travel";

describe("Time-Travel Forensic Financial Debugger Routes & Service", () => {
  let app: express.Application;
  const TENANT_ID = "00000000-0000-4000-8000-000000000001";
  const OTHER_TENANT_ID = "00000000-0000-4000-8000-000000000002";

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const tenantId = req.headers["x-tenant-id"];
      if (typeof tenantId === "string")
        (req as express.Request & { tenantId?: string }).tenantId = tenantId;
      next();
    });
    app.use("/api/v2/ledger/time-travel", timeTravelRouter);
  });

  describe("Microsecond Historical State Reconstruction", () => {
    it("reconstructs exact historical ledger balance and SMT state root", async () => {
      const res = await request(app)
        .get("/api/v2/ledger/time-travel/state")
        .set("x-tenant-id", TENANT_ID);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const state = res.body.data;
      expect(state.tenantId).toBe(TENANT_ID);
      expect(state.isDoubleEntryBalanced).toBe(true);
      expect(state.totalPostedDebitsCents).toBe(state.totalPostedCreditsCents);
      expect(state.smtStateRoot).toMatch(/^0x[a-f0-9]{64}$/);
      expect(state.accountCount).toBeGreaterThanOrEqual(5);

      const operatingCash = state.accounts.find((a: any) => a.accountId === "1010");
      expect(operatingCash).toBeDefined();
      expect(operatingCash.smtLeafHash).toMatch(/^[a-f0-9]{64}$/);
      expect(operatingCash.type).toBe("asset");
    });

    it("rejects unauthenticated request without tenant context with 400", async () => {
      const res = await request(app).get("/api/v2/ledger/time-travel/state");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid tenant context is required");
    });
  });

  describe("Deterministic Replay Window Execution", () => {
    it("replays transfer timeline with ordered transitions and state roots", async () => {
      const res = await request(app)
        .post("/api/v2/ledger/time-travel/replay")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: TENANT_ID,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const window = res.body.data;
      expect(window.tenantId).toBe(TENANT_ID);
      expect(window.totalSteps).toBeGreaterThanOrEqual(1);
      expect(window.startStateRoot).toMatch(/^0x[a-f0-9]{64}$/);
      expect(window.endStateRoot).toMatch(/^0x[a-f0-9]{64}$/);
      expect(Array.isArray(window.steps)).toBe(true);

      const firstStep = window.steps[0];
      expect(firstStep.stepIndex).toBe(0);
      expect(firstStep.epoch).toBe(0);
      expect(firstStep.stateRoot).toBe(window.startStateRoot);
    });

    it("rejects cross-tenant replay request with 403 Tenant mismatch", async () => {
      const res = await request(app)
        .post("/api/v2/ledger/time-travel/replay")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: OTHER_TENANT_ID,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Tenant mismatch");
    });
  });
});
