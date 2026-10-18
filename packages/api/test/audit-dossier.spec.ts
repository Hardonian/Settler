/**
 * Cryptographic Audit Dossier API Tests (Phase 4)
 *
 * Verifies end-to-end generation and retrieval of independent auditor attestation dossiers:
 * 1. 100% census reconciliation population memorandum
 * 2. SHA-256 SMT Merkle state root aggregation
 * 3. Client-side WASM verification script generation
 * 4. Tenant isolation guards
 */

import express from "express";
import request from "supertest";
import { dossierRouter } from "../src/routes/v2/dossier";

jest.unmock("@settler/reconciliation-core");

describe("Cryptographic Audit Dossier v2 API", () => {
  let app: express.Express;
  const tenantId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).tenantId = tenantId;
      next();
    });
    app.use("/api/v2/audit/dossier", dossierRouter);
  });

  describe("POST /api/v2/audit/dossier/generate", () => {
    it("successfully generates a signed cryptographic audit dossier", async () => {
      const payload = {
        tenantId,
        query: "Q3 100% Census Population Attestation",
        reportingPeriod: {
          from: "2026-07-01T00:00:00Z",
          to: "2026-09-30T23:59:59Z",
        },
        reconciliationRuns: [
          {
            runId: "run_q3_1",
            totalTransactions: 10000,
            matchedCount: 10000,
            unmatchedCount: 0,
            totalVolumeCents: 100000000,
            stateRoot: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          },
        ],
      };

      const res = await request(app).post("/api/v2/audit/dossier/generate").send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dossierId).toBeDefined();
      expect(res.body.data.tenantId).toBe(tenantId);
      expect(res.body.data.executiveMemorandum).toContain(
        "INDEPENDENT AUDITOR ATTESTATION DOSSIER"
      );
      expect(res.body.data.executiveMemorandum).toContain("CENSUS COMPLETENESS");
      expect(res.body.data.wasmVerificationScript).toContain("verify_manifest");
      expect(res.body.data.dossierSignature).toHaveLength(64);
    });

    it("rejects cross-tenant payload with 403 Tenant mismatch", async () => {
      const res = await request(app).post("/api/v2/audit/dossier/generate").send({
        tenantId: "00000000-0000-4000-8000-000000000888",
        query: "Unauthorized audit",
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Tenant mismatch");
    });
  });

  describe("GET /api/v2/audit/dossier/:dossierId", () => {
    it("retrieves a generated dossier and returns 404 for non-existent dossier", async () => {
      // 1. Generate first
      const genRes = await request(app)
        .post("/api/v2/audit/dossier/generate")
        .send({
          tenantId,
          query: "Retrievable Dossier",
          reportingPeriod: {
            from: "2026-01-01T00:00:00Z",
            to: "2026-01-31T23:59:59Z",
          },
          reconciliationRuns: [],
        });

      const dossierId = genRes.body.data.dossierId;

      // 2. Retrieve
      const getRes = await request(app).get(`/api/v2/audit/dossier/${dossierId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.dossierId).toBe(dossierId);

      // 3. Non-existent returns 404
      const notFoundRes = await request(app).get("/api/v2/audit/dossier/non_existent_id");
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.error).toBe("Audit dossier not found");
    });
  });
});
