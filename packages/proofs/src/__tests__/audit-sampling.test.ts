import { describe, it, expect } from "vitest";
import { generateAuditSamplingPackage, type AuditableTransaction } from "../audit-sampling.js";

describe("Automated Audit Sampling Package Generator (MUS/PPS)", () => {
  const mockTransactions: AuditableTransaction[] = [
    {
      id: "tx_01",
      tenantId: "tenant_sox_corp",
      amountCents: 500000n, // $5,000.00 (High value top stratum)
      currency: "USD",
      timestamp: "2026-09-01T10:00:00Z",
      rail: "STRIPE",
      merkleLeafHash: "aaa111",
      referenceId: "ref_1",
    },
    {
      id: "tx_02",
      tenantId: "tenant_sox_corp",
      amountCents: 10000n, // $100.00
      currency: "USD",
      timestamp: "2026-09-01T10:05:00Z",
      rail: "STRIPE",
      merkleLeafHash: "aaa222",
      referenceId: "ref_2",
    },
    {
      id: "tx_03",
      tenantId: "tenant_sox_corp",
      amountCents: 20000n, // $200.00
      currency: "USD",
      timestamp: "2026-09-01T10:10:00Z",
      rail: "STRIPE",
      merkleLeafHash: "aaa333",
      referenceId: "ref_3",
    },
    {
      id: "tx_04",
      tenantId: "tenant_sox_corp",
      amountCents: 15000n, // $150.00
      currency: "USD",
      timestamp: "2026-09-01T10:15:00Z",
      rail: "STRIPE",
      merkleLeafHash: "aaa444",
      referenceId: "ref_4",
    },
    {
      id: "tx_05",
      tenantId: "tenant_sox_corp",
      amountCents: 300000n, // $3,000.00 (High value)
      currency: "USD",
      timestamp: "2026-09-01T10:20:00Z",
      rail: "STRIPE",
      merkleLeafHash: "aaa555",
      referenceId: "ref_5",
    },
  ];

  it("samples population, identifies top stratum, and computes Merkle sample manifest", () => {
    const samplingPkg = generateAuditSamplingPackage("tenant_sox_corp", mockTransactions, {
      tenantId: "tenant_sox_corp",
      targetSampleSize: 3,
      confidenceLevelPct: 95,
      tolerableMisstatementCents: 25000n,
      randomSeed: 42,
    });

    expect(samplingPkg.tenantId).toBe("tenant_sox_corp");
    expect(samplingPkg.methodology).toBe("MONETARY_UNIT_SAMPLING_PPS");
    expect(samplingPkg.populationSummary.totalTransactionsCount).toBe(5);
    expect(samplingPkg.populationSummary.totalBookValueCents).toBe(845000n); // $8,450.00

    expect(samplingPkg.sampleResults.sampleSize).toBeGreaterThanOrEqual(2);
    expect(samplingPkg.sampleResults.topStratum100PctCount).toBeGreaterThanOrEqual(1);
    expect(samplingPkg.sampleResults.coverageRatioBps).toBeGreaterThan(5000); // More than 50% of dollar value sampled
    expect(samplingPkg.sampleManifestMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });

  it("strictly enforces tenant boundary checking", () => {
    const mismatched = [
      ...mockTransactions,
      {
        id: "tx_leak",
        tenantId: "tenant_other",
        amountCents: 1000n,
        currency: "USD",
        timestamp: "2026-09-01T10:30:00Z",
        rail: "STRIPE",
        merkleLeafHash: "leak",
        referenceId: "ref_leak",
      },
    ];

    expect(() =>
      generateAuditSamplingPackage("tenant_sox_corp", mismatched, {
        tenantId: "tenant_sox_corp",
        targetSampleSize: 3,
        confidenceLevelPct: 95,
        tolerableMisstatementCents: 10000n,
      })
    ).toThrow(/Tenant mismatch/);
  });
});
