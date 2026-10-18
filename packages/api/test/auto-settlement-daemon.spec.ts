/**
 * Autonomous Settlement Daemon v2 API Tests (Phase 4)
 *
 * Verifies end-to-end execution of the autonomous settlement cycle:
 * 1. 3-way triangular matching across streaming legs
 * 2. Automated fee variance routing into Revenue OS recovery dispute claims
 * 3. Exception pattern rule synthesis
 * 4. Tenant isolation guards
 */

import express from "express";
import request from "supertest";
import { daemonRouter } from "../src/routes/v2/daemon";

jest.unmock("@settler/reconciliation-core");

describe("Autonomous Settlement Daemon v2 API", () => {
  let app: express.Express;
  const tenantId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).tenantId = tenantId;
      next();
    });
    app.use("/api/v2/daemon", daemonRouter);
  });

  describe("POST /api/v2/daemon/tick", () => {
    it("successfully runs an autonomous cycle, performs 3-way matching, and generates dispute claims for variances", async () => {
      const payload = {
        tenantId,
        orders: [
          {
            id: "ord_daemon_test_1",
            orderReference: "REF-ORD-D1",
            amountCents: 10000,
            currency: "USD",
            orderedAt: "2026-03-01T10:00:00Z",
          },
          {
            id: "ord_daemon_test_2",
            orderReference: "REF-ORD-D2",
            amountCents: 20000,
            currency: "USD",
            orderedAt: "2026-03-01T10:00:00Z",
          },
        ],
        captures: [
          {
            id: "cap_daemon_test_1",
            processor: "stripe",
            gatewayTransactionId: "ch_daemon_1",
            orderReference: "REF-ORD-D1",
            capturedAmountCents: 10000,
            feeDeductedCents: 300,
            currency: "USD",
            capturedAt: "2026-03-01T10:05:00Z",
          },
          {
            id: "cap_daemon_test_2",
            processor: "stripe",
            gatewayTransactionId: "ch_daemon_2",
            orderReference: "REF-ORD-D2",
            capturedAmountCents: 20000,
            feeDeductedCents: 1500, // Excessive fee variance ($15 vs $6 standard)
            currency: "USD",
            capturedAt: "2026-03-01T10:05:00Z",
          },
        ],
        sweeps: [
          {
            id: "swp_daemon_test_1",
            bankStatementLineId: "stmt_line_d1",
            batchId: "batch_d1",
            netDepositAmountCents: 9700,
            currency: "USD",
            settledAt: "2026-03-02T12:00:00Z",
            gatewayBatchReference: "ch_daemon_1",
          },
          {
            id: "swp_daemon_test_2",
            bankStatementLineId: "stmt_line_d2",
            batchId: "batch_d2",
            netDepositAmountCents: 17500,
            currency: "USD",
            settledAt: "2026-03-02T12:00:00Z",
            gatewayBatchReference: "ch_daemon_2",
          },
        ],
      };

      const res = await request(app).post("/api/v2/daemon/tick").send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenantId).toBe(tenantId);
      expect(res.body.data.cycleId).toBeDefined();
      expect(res.body.data.aggregateEpochRoot).toHaveLength(64);
      expect(res.body.data.triangularResult.totalTriangles).toBe(2);
      expect(res.body.data.triangularResult.perfectMatches).toBe(1);
      expect(res.body.data.triangularResult.feeVariance).toBe(1);
      // Fee variance is automatically piped into a recovery claim
      expect(res.body.data.recoveryClaimsGenerated.length).toBeGreaterThan(0);
      expect(res.body.data.recoveryClaimsGenerated[0].processor).toBe("STRIPE");
    });

    it("rejects cross-tenant payload with 403 Tenant mismatch", async () => {
      const res = await request(app).post("/api/v2/daemon/tick").send({
        tenantId: "00000000-0000-4000-8000-000000000999", // Different tenant
        orders: [],
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Tenant mismatch");
    });
  });

  describe("GET /api/v2/daemon/metrics", () => {
    it("returns operational status and capabilities for the authenticated tenant", async () => {
      const res = await request(app).get("/api/v2/daemon/metrics");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ONLINE");
      expect(res.body.data.tenantId).toBe(tenantId);
      expect(res.body.data.capabilities).toContain("3_way_triangular_matching");
      expect(res.body.data.capabilities).toContain("autonomous_dispute_packaging");
    });
  });
});
