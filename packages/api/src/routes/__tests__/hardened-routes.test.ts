import express from "express";
import request from "supertest";
import { periodCloseRouter } from "../period-close";
import { liquidityMetricsRouter } from "../liquidity-metrics";
import { zkpSyncRouter } from "../zkp-sync";
import { erpSyncRouter } from "../erp-sync";
import { vendorDisputesRouter } from "../vendor-disputes";
import { auditorRouter } from "../auditor";

process.env.PROOF_COMMITMENT_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/auth", () => ({
  authMiddleware: (req: any, _res: any, next: () => void) => {
    req.tenantId = req.tenantId || "tenant-test-hardened";
    req.userId = req.userId || "user-test-hardened";
    next();
  },
}));

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationRun: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "run-01",
          status: "completed",
          sourceCount: 100,
          targetCount: 100,
          matchedCount: 98,
        },
      ]),
      findFirst: jest.fn().mockResolvedValue({
        id: "run-01",
        status: "completed",
        sourceCount: 100,
        targetCount: 100,
        matchedCount: 98,
        unmatchedSourceCount: 2,
      }),
    },
    reconciliationMatch: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "match-01",
          matchType: "unmatched",
          amountDiff: 150.0,
          createdAt: new Date(),
          matchReason: "Amount mismatch",
        },
      ]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "audit-01" }),
    },
  },
}));

jest.mock("../../services/intelligence/proof-package-orchestrator", () => ({
  createRunProofPackageWithArtifacts: jest.fn().mockResolvedValue({
    proofPackageId: "pp-01",
    evidenceIds: ["ev-01"],
    packageHash: "hash-01",
  }),
}));

describe("Hardened API Routes Integration", () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = "tenant-test-hardened";
    (req as any).userId = "user-test-hardened";
    next();
  });

  app.use("/api/close", periodCloseRouter);
  app.use("/api/v1/dashboards/liquidity", liquidityMetricsRouter);
  app.use("/api/intelligence", zkpSyncRouter);
  app.use("/api/erp/sync", erpSyncRouter);
  app.use("/api/v1/vendor-disputes", vendorDisputesRouter);
  app.use("/api/auditor", auditorRouter);

  describe("POST /api/close/sign-off", () => {
    it("cryptographically locks the accounting period with deterministic state commitment", async () => {
      const res = await request(app).post("/api/close/sign-off").send({ period: "2026-08" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("closed");
      expect(res.body.data.tenantId).toBe("tenant-test-hardened");
      expect(res.body.data.stateCommitmentHash).toHaveLength(64);
      expect(res.body.data.signature).toMatch(/^sig_sha256_/);
      expect(res.body.data.certificate.algorithm).toBe("SHA256-HMAC");
    });

    it("rejects invalid period formatting", async () => {
      const res = await request(app).post("/api/close/sign-off").send({ period: "invalid-date" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid period format");
    });
  });

  describe("GET /api/v1/dashboards/liquidity", () => {
    it("computes tenant-scoped locked capital across aging buckets", async () => {
      const res = await request(app).get("/api/v1/dashboards/liquidity");

      expect(res.status).toBe(200);
      expect(res.body.data.tenantId).toBe("tenant-test-hardened");
      expect(res.body.data.currency).toBe("USD");
      expect(res.body.data.agingBuckets).toHaveLength(4);
      expect(res.body.data.totalLockedCapital).toBeGreaterThanOrEqual(0);
    });
  });

  describe("POST /api/intelligence/zkp/generate and /verify", () => {
    it("generates Merkle commitment proof and verifies it", async () => {
      const genRes = await request(app)
        .post("/api/intelligence/zkp/generate")
        .send({ targetTenantId: "tenant-counterparty-99", runId: "run-01" });

      expect(genRes.status).toBe(200);
      expect(genRes.body.data.proofHash).toHaveLength(64);
      expect(genRes.body.data.merkleRoot).toHaveLength(64);

      const verifyRes = await request(app).post("/api/intelligence/zkp/verify").send({
        proofHash: genRes.body.data.proofHash,
        merkleRoot: genRes.body.data.merkleRoot,
        tenantId: "tenant-test-hardened",
        targetTenantId: "tenant-counterparty-99",
        runId: "run-01",
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.isValid).toBe(true);

      // Fail-closed check: omitting commitment parameters must return 400
      const incompleteVerifyRes = await request(app).post("/api/intelligence/zkp/verify").send({
        proofHash: genRes.body.data.proofHash,
      });
      expect(incompleteVerifyRes.status).toBe(400);
    });
  });

  describe("GET /api/auditor/samples", () => {
    it("returns deterministic tenant-scoped MUS/PPS samples with a Merkle manifest root", async () => {
      const res1 = await request(app).get("/api/auditor/samples?limit=4&seed=42");
      const res2 = await request(app).get("/api/auditor/samples?limit=4&seed=42");

      expect(res1.status).toBe(200);
      expect(res1.body.data.tenantId).toBe("tenant-test-hardened");
      expect(res1.body.data.samples).toHaveLength(4);
      expect(res1.body.data.sampleManifestMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
      expect(res1.body.data.sampleManifestMerkleRoot).toBe(res2.body.data.sampleManifestMerkleRoot);
    });
  });

  describe("POST /api/erp/sync/netsuite/journal-entry", () => {
    it("generates balanced double-entry GL batches with SHA-256 batch hash", async () => {
      const res = await request(app).post("/api/erp/sync/netsuite/journal-entry").send({
        period: "2026-08",
        netPayout: 95000,
        gatewayFees: 2500,
        grossSettlement: 97500,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.totalDebits).toBe(res.body.data.totalCredits);
      expect(res.body.data.batchHash).toHaveLength(64);
      expect(res.body.data.netsuiteInternalId).toMatch(/^JE_/);
      expect(res.body.data.compliance.doubleEntryBalanced).toBe(true);
    });

    it("rejects out-of-balance entries", async () => {
      const res = await request(app)
        .post("/api/erp/sync/netsuite/journal-entry")
        .send({
          entries: [
            { accountNumber: "1000", debit: 500, credit: 0 },
            { accountNumber: "2000", debit: 0, credit: 400 }, // Out of balance by 100
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Unbalanced Journal Entry");
    });
  });

  describe("GET /api/v1/vendor-disputes", () => {
    it("retrieves tenant-scoped disputes with summary statistics", async () => {
      const res = await request(app).get("/api/v1/vendor-disputes");

      expect(res.status).toBe(200);
      expect(res.body.data.tenantId).toBe("tenant-test-hardened");
      expect(res.body.data.summary).toBeDefined();
      expect(Array.isArray(res.body.data.disputes)).toBe(true);
    });
  });
});
