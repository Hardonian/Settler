import {
  GeminiCognitiveEngine,
  geminiCognitiveEngine,
  type MultimodalExtractionRequest,
  type AdjudicationRequest,
  type AuditQueryRequest,
} from "../gemini-cognitive-engine.js";
import type { SelfHealingPlan } from "../pattern-learning-engine.js";

describe("GeminiCognitiveEngine", () => {
  const TENANT = "tenant_enterprise_sovereign_01";

  describe("Tenant Boundary Enforcement", () => {
    it("rejects extraction requests with empty tenantId", () => {
      expect(() => {
        geminiCognitiveEngine.extractMultimodalStatement({
          tenantId: "",
          rawTextOrStream: "2026-09-15 TXN_101 $500.00 Stripe",
        });
      }).toThrow("Tenant context invariant violation: tenantId is required");
    });

    it("rejects adjudication requests with empty tenantId", () => {
      expect(() => {
        geminiCognitiveEngine.adjudicateExceptions({
          tenantId: "   ",
          exceptions: [],
          railContext: { rail: "stripe", currency: "USD" },
        });
      }).toThrow("Tenant context invariant violation: tenantId is required");
    });

    it("rejects audit inquiries with empty tenantId", () => {
      expect(() => {
        geminiCognitiveEngine.synthesizeAuditProofDossier({
          tenantId: "",
          query: "Audit Q3 2026",
          reportingPeriod: { from: "2026-07-01", to: "2026-09-30" },
          reconciliationRuns: [],
        });
      }).toThrow("Tenant context invariant violation: tenantId is required");
    });
  });

  describe("Multimodal Document & Statement Ingestion", () => {
    it("extracts transactions with provenance and verifies exact balance match", () => {
      const statementData = `
        STATEMENT SUMMARY FOR OPERATING ACCOUNT #99812-44
        PERIOD: 2026-09-01 TO 2026-09-15
        
        2026-09-02 TXN_STRIPE_01 $1,250.50 Stripe Net Payout USD
        2026-09-05 TXN_SHOPIFY_02 $840.25 Shopify Merchant Settlement USD
        2026-09-10 TXN_WIRE_03 $10,000.00 Treasury Capital Transfer USD
      `;

      // 1250.50 + 840.25 + 10000.00 = 12090.75 -> 1209075 cents
      const result = geminiCognitiveEngine.extractMultimodalStatement({
        tenantId: TENANT,
        rawTextOrStream: statementData,
        documentType: "bank_statement",
        defaultRail: "jpmorgan_ach",
        defaultCurrency: "USD",
        declaredNetTotalCents: 1209075n,
      });

      expect(result.recordsExtracted).toBe(3);
      expect(result.records[0]!.externalId).toBe("TXN_STRIPE_01");
      expect(result.records[0]!.amountCents).toBe(125050n);
      expect(result.records[0]!.provenance.confidenceScore).toBeGreaterThanOrEqual(0.95);
      expect(result.computedNetTotalCents).toBe(1209075n);
      expect(result.balanceVerification.isBalanced).toBe(true);
      expect(result.balanceVerification.verdict).toBe("EXACT_MATCH");
      expect(result.balanceVerification.deltaCents).toBe(0n);
      expect(result.manifestHash).toBeDefined();
    });

    it("flags balance break when declared total differs from extracted sum", () => {
      const statementData = `
        2026-09-02 TXN_01 $100.00 Settlement A
        2026-09-03 TXN_02 $200.00 Settlement B
      `;

      const result = geminiCognitiveEngine.extractMultimodalStatement({
        tenantId: TENANT,
        rawTextOrStream: statementData,
        declaredNetTotalCents: 35000n, // $350.00 vs extracted $300.00
      });

      expect(result.recordsExtracted).toBe(2);
      expect(result.computedNetTotalCents).toBe(30000n);
      expect(result.balanceVerification.isBalanced).toBe(false);
      expect(result.balanceVerification.verdict).toBe("BALANCE_BREAK");
      expect(result.balanceVerification.deltaCents).toBe(-5000n); // 50 dollar break
    });
  });

  describe("Causal Exception Adjudication", () => {
    it("synthesizes self-healing plans with zero float drift and replay safety", () => {
      const adjudicationReq: AdjudicationRequest = {
        tenantId: TENANT,
        exceptions: [
          // Timing lag break (>24h delta)
          {
            breakId: "break_01",
            sourceAmountCents: 500000n,
            targetAmountCents: 500000n,
            currency: "USD",
            sourceTimestamp: "2026-09-01T00:00:00Z",
            targetTimestamp: "2026-09-04T12:00:00Z",
            rail: "stripe_payouts",
          },
          // Micro-rounding break (3 cents variance)
          {
            breakId: "break_02",
            sourceAmountCents: 100000n,
            targetAmountCents: 100003n,
            currency: "EUR",
            sourceTimestamp: "2026-09-02T10:00:00Z",
            targetTimestamp: "2026-09-02T10:05:00Z",
            rail: "stripe_payouts",
          },
        ],
        railContext: {
          rail: "stripe_payouts",
          currency: "USD",
        },
      };

      const result = geminiCognitiveEngine.adjudicateExceptions(adjudicationReq);

      expect(result.exceptionsAnalyzed).toBe(2);
      expect(result.rootCauseAttributions.length).toBe(2);
      expect(result.healingPlans.length).toBe(2);

      // Verify timing lag plan
      const timingPlan = result.healingPlans.find(
        (p: SelfHealingPlan) => p.actionType === "HEAL_FLOAT_TIMING"
      );
      expect(timingPlan).toBeDefined();
      expect(timingPlan!.parameters.newWindowSeconds).toBe(259200);

      // Verify micro-rounding plan
      const roundingPlan = result.healingPlans.find(
        (p: SelfHealingPlan) => p.actionType === "HEAL_ROUNDING_PRECISION"
      );
      expect(roundingPlan).toBeDefined();
      expect(roundingPlan!.parameters.newToleranceBps).toBe(5);

      // Verify invariants
      expect(result.simulation.floatDriftCents).toBe(0n);
      expect(result.simulation.replaySafe).toBe(true);
      expect(result.simulation.noiseReductionPct).toBeGreaterThan(80);
      expect(result.evaluationSignature).toBeDefined();
    });
  });

  describe("Conversational Auditor OS & Merkle Proofpacks", () => {
    it("generates 100% census audit dossier with SHA-256 Merkle root and WASM script", () => {
      const queryReq: AuditQueryRequest = {
        tenantId: TENANT,
        query: "Audit Q3 2026 Stripe revenue against bank clearing records",
        reportingPeriod: {
          from: "2026-07-01",
          to: "2026-09-30",
        },
        reconciliationRuns: [
          {
            runId: "run_july_2026",
            stateRoot: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
            matchedCount: 50000,
            totalVolumeCents: 500000000n, // $5,000,000.00
            currency: "USD",
          },
          {
            runId: "run_aug_2026",
            stateRoot: "b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01",
            matchedCount: 65000,
            totalVolumeCents: 650000000n, // $6,500,000.00
            currency: "USD",
          },
          {
            runId: "run_sept_2026",
            stateRoot: "c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012",
            matchedCount: 72000,
            totalVolumeCents: 720000000n, // $7,200,000.00
            currency: "USD",
          },
        ],
      };

      const dossier = geminiCognitiveEngine.synthesizeAuditProofDossier(queryReq);

      expect(dossier.tenantId).toBe(TENANT);
      expect(dossier.censusAudit.totalRunsAudited).toBe(3);
      expect(dossier.censusAudit.totalTransactionsVerified).toBe(187000);
      expect(dossier.censusAudit.totalVolumeCents).toBe(1870000000n);
      expect(dossier.censusAudit.samplingCoveragePct).toBe(100);
      expect(dossier.censusAudit.unallocatedCreditsCents).toBe(0n);
      expect(dossier.aggregatedMerkleRoot).toHaveLength(64);
      expect(dossier.executiveMemorandum).toContain(
        "CENSUS COMPLETENESS: Performed complete 100% census reconciliation"
      );
      expect(dossier.wasmVerificationScript).toContain("verify_manifest");
      expect(dossier.dossierSignature).toBeDefined();
    });
  });

  describe("Adversarial Metamorphic Attack Generator", () => {
    it("generates deterministic adversarial test vectors with expected verdicts", () => {
      const vectors = geminiCognitiveEngine.generateAdversarialVectors({
        tenantId: TENANT,
        targetRail: "fednow_instant",
        count: 3,
      });

      expect(vectors.length).toBe(3);
      expect(vectors[0]!.archetype).toBe("SUB_CENT_ROUNDING_SLIPPAGE");
      expect(vectors[0]!.expectedDefenseVerdict).toBe("HEALED_WITH_LOG");
      expect(vectors[1]!.archetype).toBe("TEMPORAL_LAG_ARBITRAGE");
      expect(vectors[1]!.expectedDefenseVerdict).toBe("QUARANTINED");
      expect(vectors[2]!.archetype).toBe("REPLAY_NONCE_COLLISION");
      expect(vectors[2]!.expectedDefenseVerdict).toBe("REJECTED");
    });
  });
});
