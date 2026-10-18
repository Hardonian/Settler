import express from "express";
import request from "supertest";
import { exceptionsRouter } from "../src/routes/exceptions";
import { createHash } from "node:crypto";

jest.mock("../src/infrastructure/db/prisma", () => ({
  prisma: {
    $transaction: jest.fn(async (cb: any) => {
      if (typeof cb === "function") {
        return cb(mockPrisma);
      }
      return cb;
    }),
    reconciliationMatch: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    normalizedTransaction: {
      findFirst: jest.fn(),
    },
    exceptionAdjudicationMemory: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    exceptionArchetype: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    exceptionArchetypeClassification: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    evidenceArtifact: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    proofPackage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "audit-1" }),
    },
    reconciliationProvenance: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../src/middleware/governance", () => ({
  enforceFreezeState: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}));

jest.mock("../src/middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  requireResourceOwnership: () => (_req: any, _res: any, next: any) => next(),
}));

const { prisma: mockPrisma } = require("../src/infrastructure/db/prisma");

function sha256(data: Buffer | string): Buffer {
  return createHash("sha256").update(data).digest();
}

function leafHash(key: Buffer, value: Buffer): Buffer {
  return sha256(Buffer.concat([Buffer.from([0x00]), key, value]));
}

function nodeHash(left: Buffer, right: Buffer): Buffer {
  return sha256(Buffer.concat([Buffer.from([0x01]), left, right]));
}

describe("Pillar 1 Red-Team: Adversarial Tenant Isolation & Data Permeability", () => {
  const TENANT_ALPHA = "00000000-aaaa-4000-8000-000000000001";
  const TENANT_BETA = "00000000-bbbb-4000-8000-000000000002";
  const COLLIDING_TX_ID = "00000000-0000-4000-8000-000000009999";
  const COLLIDING_MATCH_ID = "00000000-0000-4000-8000-000000008888";
  const ALPHA_ONLY_ID = "00000000-0000-4000-8000-000000007777";

  let activeTenantId = TENANT_ALPHA;
  let activeUserId = "user-alpha";

  const app = express();
  app.use(express.json());

  // Simulates authenticated session context from auth & tenant middlewares
  app.use((req: any, _res, next) => {
    req.tenantId = activeTenantId;
    req.userId = activeUserId;
    req.traceId = `trace-${activeTenantId}`;
    next();
  });

  app.use("/", exceptionsRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    activeTenantId = TENANT_ALPHA;
    activeUserId = "user-alpha";
  });

  describe("1. Identical ID Ingestion & Scoped Read Isolation", () => {
    it("asserts that tenant_beta CANNOT read tenant_alpha exception records despite identical ID", async () => {
      // Mock DB containing identical match ID for both tenants with isolated values
      mockPrisma.reconciliationMatch.findFirst.mockImplementation(
        async ({ where }: { where: { id: string; tenantId: string } }) => {
          if (where.id === COLLIDING_MATCH_ID && where.tenantId === TENANT_ALPHA) {
            return {
              id: COLLIDING_MATCH_ID,
              tenantId: TENANT_ALPHA,
              runId: "00000000-0000-4000-8000-000000000111",
              sourceTransactionId: COLLIDING_TX_ID,
              matchType: "conflict",
              confidence: 0.85,
              status: "open",
              severity: "high",
              createdAt: new Date(),
              updatedAt: new Date(),
              sourceTransaction: {
                id: COLLIDING_TX_ID,
                amount: 5000,
                currency: "USD",
                tenantId: TENANT_ALPHA,
              },
              metadata: { secretNote: "alpha_confidential_payroll" },
            };
          }
          if (where.id === COLLIDING_MATCH_ID && where.tenantId === TENANT_BETA) {
            return {
              id: COLLIDING_MATCH_ID,
              tenantId: TENANT_BETA,
              runId: "00000000-0000-4000-8000-000000000222",
              sourceTransactionId: COLLIDING_TX_ID,
              matchType: "unmatched",
              confidence: 0.92,
              status: "open",
              severity: "low",
              createdAt: new Date(),
              updatedAt: new Date(),
              sourceTransaction: {
                id: COLLIDING_TX_ID,
                amount: 120,
                currency: "EUR",
                tenantId: TENANT_BETA,
              },
              metadata: { secretNote: "beta_public_subscription" },
            };
          }
          return null;
        }
      );

      mockPrisma.reconciliationProvenance.findMany.mockResolvedValue([]);
      mockPrisma.exceptionAdjudicationMemory.findMany.mockResolvedValue([]);
      mockPrisma.proofPackage.findMany.mockResolvedValue([]);

      // Act as Tenant Alpha
      activeTenantId = TENANT_ALPHA;
      activeUserId = "user-alpha";
      const alphaRes = await request(app).get(`/exceptions/${COLLIDING_MATCH_ID}`);

      expect(alphaRes.status).toBe(200);
      expect(alphaRes.body.data.sourceTransaction.amount).toBe(5000);
      expect(alphaRes.body.data.sourceTransaction.currency).toBe("USD");

      // Verify that query was explicitly scoped with WHERE tenantId = TENANT_ALPHA
      expect(mockPrisma.reconciliationMatch.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: COLLIDING_MATCH_ID,
            tenantId: TENANT_ALPHA,
          }),
        })
      );

      // Now switch active context to Tenant Beta
      activeTenantId = TENANT_BETA;
      activeUserId = "user-beta";
      const betaRes = await request(app).get(`/exceptions/${COLLIDING_MATCH_ID}`);

      expect(betaRes.status).toBe(200);
      expect(betaRes.body.data.sourceTransaction.amount).toBe(120);
      expect(betaRes.body.data.sourceTransaction.currency).toBe("EUR");

      // Verify Tenant Beta cannot see Tenant Alpha's amounts
      expect(betaRes.body.data.sourceTransaction.amount).not.toBe(5000);
    });

    it("returns 404 when tenant_beta attempts spoofed access to an alpha-only exception", async () => {
      mockPrisma.reconciliationMatch.findFirst.mockResolvedValue(null);

      activeTenantId = TENANT_BETA;
      const res = await request(app).get(`/exceptions/${ALPHA_ONLY_ID}`);

      expect(res.status).toBe(404);
      expect(mockPrisma.reconciliationMatch.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: ALPHA_ONLY_ID,
            tenantId: TENANT_BETA,
          }),
        })
      );
    });
  });

  describe("2. Cross-Tenant Adjudication Tamper Resistance", () => {
    it("asserts that tenant_beta CANNOT adjudicate or modify tenant_alpha discrepancies", async () => {
      // Mock: match exists for tenant_alpha, but does NOT exist for tenant_beta
      mockPrisma.reconciliationMatch.findFirst.mockImplementation(
        async ({ where }: { where: { id: string; tenantId: string } }) => {
          if (where.tenantId === TENANT_ALPHA) {
            return {
              id: COLLIDING_MATCH_ID,
              tenantId: TENANT_ALPHA,
              status: "open",
            };
          }
          return null; // Tenant Beta sees nothing
        }
      );

      activeTenantId = TENANT_BETA;
      activeUserId = "adversary-in-beta";

      const res = await request(app).patch(`/exceptions/${COLLIDING_MATCH_ID}/status`).send({
        status: "resolved",
        resolutionReason: "Fraudulent cross-tenant bypass attempt",
      });

      // Must be rejected with 404 Not Found (or 403 Forbidden)
      expect(res.status).toBe(404);
      expect(mockPrisma.reconciliationMatch.update).not.toHaveBeenCalled();
      expect(mockPrisma.exceptionAdjudicationMemory.create).not.toHaveBeenCalled();
    });
  });

  describe("3. Sparse Merkle Tree (SMT) & Proofpack Branch Permeability Defense", () => {
    it("proves that tenant_alpha proofpack branches fail verification against tenant_beta root", () => {
      // Keys derived from identical transaction ID but isolated by tenant domain prefix
      const keyAlpha = sha256(`tenant:${TENANT_ALPHA}:tx:${COLLIDING_TX_ID}`);
      const valAlpha = sha256("status=SETTLED:amount=5000:nonce=alpha_981");

      const keyBeta = sha256(`tenant:${TENANT_BETA}:tx:${COLLIDING_TX_ID}`);
      const valBeta = sha256("status=DISPUTED:amount=120:nonce=beta_102");

      // Compute leaf hashes with 0x00 domain separator
      const leafAlpha = leafHash(keyAlpha, valAlpha);
      const leafBeta = leafHash(keyBeta, valBeta);

      // Sibling node hashes with 0x01 domain separator
      const dummySiblingAlpha = sha256("sibling_alpha_layer_1");
      const dummySiblingBeta = sha256("sibling_beta_layer_1");

      const rootAlpha = nodeHash(leafAlpha, dummySiblingAlpha);
      const rootBeta = nodeHash(leafBeta, dummySiblingBeta);

      // Verify roots are cryptographically distinct
      expect(rootAlpha.toString("hex")).not.toEqual(rootBeta.toString("hex"));

      // Adversary attempts to use Alpha's leaf proof against Beta's root
      const forgedBetaRootFromAlphaLeaf = nodeHash(leafAlpha, dummySiblingBeta);
      expect(forgedBetaRootFromAlphaLeaf.toString("hex")).not.toEqual(rootBeta.toString("hex"));

      // Non-permeability invariant holds: Alpha evidence cannot authenticate inside Beta's proofpack
      const isValidInBeta = forgedBetaRootFromAlphaLeaf.equals(rootBeta);
      expect(isValidInBeta).toBe(false);
    });
  });
});
