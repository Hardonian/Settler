import { seal, verify } from "../trust-envelope";
import type { ReconciliationProofCapsule } from "@settler/protocol";

/**
 * Trust Envelope v1 – Unit Tests
 *
 * Validates sealing, verification, and tamper-detection for
 * reconciliation proof capsules.
 */
describe("TrustEnvelope", () => {
  const baseInput = {
    jobId: "job_test_001",
    tenantId: "tenant_ci_test",
    sourceTransactions: [
      { id: "src_1", amount: 100.0, date: "2026-02-18T10:00:00.000Z", currency: "USD" },
      { id: "src_2", amount: 50.5, date: "2026-02-18T11:00:00.000Z", currency: "USD" },
    ],
    targetTransactions: [
      { id: "tgt_1", amount: 100.0, date: "2026-02-18T10:05:00.000Z", currency: "USD" },
      { id: "tgt_2", amount: 50.5, date: "2026-02-18T11:10:00.000Z", currency: "USD" },
    ],
    rules: {
      amountTolerance: 0.01,
      dateWindowDays: 3,
      requireExactMerchant: false,
    },
    matches: [
      { sourceTransactionId: "src_1", targetTransactionId: "tgt_1", matchType: "exact", confidence: 0.8 },
      { sourceTransactionId: "src_2", targetTransactionId: "tgt_2", matchType: "fuzzy", confidence: 0.7 },
    ],
    engine: { name: "Settler", version: "1.0.0", build: "test-sha" },
  };

  const hmacSecret = "test-hmac-secret-key-for-ci";

  // -----------------------------------------------------------------------
  // seal()
  // -----------------------------------------------------------------------

  describe("seal()", () => {
    it("should produce a capsule with all required fields", () => {
      const capsule = seal(baseInput);

      expect(capsule.capsuleVersion).toBe("1.0.0");
      expect(capsule.jobId).toBe("job_test_001");
      expect(capsule.inputHash).toMatch(/^[a-f0-9]{64}$/);
      expect(capsule.ruleHash).toMatch(/^[a-f0-9]{64}$/);
      expect(capsule.outputHash).toMatch(/^[a-f0-9]{64}$/);
      expect(capsule.versionHash).toMatch(/^[a-f0-9]{64}$/);
      expect(capsule.createdAt).toBeDefined();
      expect(capsule.signature).toBeUndefined();
      expect(capsule.signer).toBeUndefined();
    });

    it("should produce deterministic hashes for the same input", () => {
      const capsule1 = seal(baseInput);
      const capsule2 = seal(baseInput);

      expect(capsule1.inputHash).toBe(capsule2.inputHash);
      expect(capsule1.ruleHash).toBe(capsule2.ruleHash);
      expect(capsule1.outputHash).toBe(capsule2.outputHash);
      expect(capsule1.versionHash).toBe(capsule2.versionHash);
    });

    it("should produce different hashes when input changes", () => {
      const altered = {
        ...baseInput,
        sourceTransactions: [
          ...baseInput.sourceTransactions,
          { id: "src_3", amount: 25.0, date: "2026-02-18T12:00:00.000Z", currency: "USD" },
        ],
      };

      const capsuleA = seal(baseInput);
      const capsuleB = seal(altered);

      expect(capsuleA.inputHash).not.toBe(capsuleB.inputHash);
      // Rules and engine didn't change
      expect(capsuleA.ruleHash).toBe(capsuleB.ruleHash);
      expect(capsuleA.versionHash).toBe(capsuleB.versionHash);
    });

    it("should produce different hashes when rules change", () => {
      const altered = {
        ...baseInput,
        rules: { ...baseInput.rules, amountTolerance: 0.05 },
      };

      const capsuleA = seal(baseInput);
      const capsuleB = seal(altered);

      expect(capsuleA.ruleHash).not.toBe(capsuleB.ruleHash);
      expect(capsuleA.inputHash).toBe(capsuleB.inputHash);
    });

    it("should include HMAC signature when hmacSecret is provided", () => {
      const capsule = seal(baseInput, { hmacSecret });

      expect(capsule.signature).toMatch(/^[a-f0-9]{64}$/);
      expect(capsule.signer).toBe("Settler-Core");
    });

    it("should use custom signer identity when provided", () => {
      const capsule = seal(baseInput, {
        hmacSecret,
        signer: "Audit-Service",
      });

      expect(capsule.signer).toBe("Audit-Service");
    });
  });

  // -----------------------------------------------------------------------
  // verify()
  // -----------------------------------------------------------------------

  describe("verify()", () => {
    it("should verify an unsigned capsule against identical inputs", () => {
      const capsule = seal(baseInput);
      const result = verify(capsule, baseInput);

      expect(result.valid).toBe(true);
      expect(result.checks.inputHash).toBe(true);
      expect(result.checks.ruleHash).toBe(true);
      expect(result.checks.outputHash).toBe(true);
      expect(result.checks.versionHash).toBe(true);
      expect(result.checks.signature).toBeNull();
    });

    it("should verify a signed capsule with the correct secret", () => {
      const capsule = seal(baseInput, { hmacSecret });
      const result = verify(capsule, baseInput, hmacSecret);

      expect(result.valid).toBe(true);
      expect(result.checks.signature).toBe(true);
    });

    it("should reject a signed capsule when no secret is provided", () => {
      const capsule = seal(baseInput, { hmacSecret });
      const result = verify(capsule, baseInput);

      expect(result.valid).toBe(false);
      expect(result.checks.signature).toBe(false);
    });

    it("should reject a signed capsule with the wrong secret", () => {
      const capsule = seal(baseInput, { hmacSecret });
      const result = verify(capsule, baseInput, "wrong-secret");

      expect(result.valid).toBe(false);
      expect(result.checks.signature).toBe(false);
    });

    it("should detect tampered input data", () => {
      const capsule = seal(baseInput);
      const tampered = {
        ...baseInput,
        sourceTransactions: [
          { id: "src_1", amount: 999.99, date: "2026-02-18T10:00:00.000Z", currency: "USD" },
        ],
      };

      const result = verify(capsule, tampered);

      expect(result.valid).toBe(false);
      expect(result.checks.inputHash).toBe(false);
      // Other hashes may still match
      expect(result.checks.ruleHash).toBe(true);
    });

    it("should detect tampered rules", () => {
      const capsule = seal(baseInput);
      const tampered = {
        ...baseInput,
        rules: { amountTolerance: 999 },
      };

      const result = verify(capsule, tampered);

      expect(result.valid).toBe(false);
      expect(result.checks.ruleHash).toBe(false);
      expect(result.checks.inputHash).toBe(true);
    });

    it("should detect tampered output", () => {
      const capsule = seal(baseInput);
      const tampered = {
        ...baseInput,
        matches: [
          { sourceTransactionId: "src_1", targetTransactionId: "tgt_1", matchType: "exact", confidence: 0.99 },
        ],
      };

      const result = verify(capsule, tampered);

      expect(result.valid).toBe(false);
      expect(result.checks.outputHash).toBe(false);
    });

    it("should detect tampered engine version", () => {
      const capsule = seal(baseInput);
      const tampered = {
        ...baseInput,
        engine: { name: "Settler", version: "2.0.0", build: "test-sha" },
      };

      const result = verify(capsule, tampered);

      expect(result.valid).toBe(false);
      expect(result.checks.versionHash).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Round-trip integrity
  // -----------------------------------------------------------------------

  describe("round-trip", () => {
    it("should seal and verify without loss of integrity", () => {
      const capsule = seal(baseInput, { hmacSecret, signer: "CI" });
      const result = verify(capsule, baseInput, hmacSecret);

      expect(result.valid).toBe(true);
      expect(Object.values(result.checks).every((c) => c === true)).toBe(true);
    });
  });
});
