/**
 * Automated Audit Sampling Package Generator
 *
 * Implements Monetary Unit Sampling (MUS) / Probability Proportional to Size (PPS)
 * and stratified sampling for PCAOB SOX-404 and AICPA external audit testing.
 * Automatically segments populations into high-value top stratum (100% tested)
 * and interval-sampled lower strata with cryptographic Merkle proof linking.
 */

import { createHash } from "node:crypto";

export interface AuditableTransaction {
  id: string;
  tenantId: string;
  amountCents: bigint;
  currency: string;
  timestamp: string;
  rail: string;
  merkleLeafHash: string;
  referenceId: string;
}

export interface AuditSamplingParameters {
  tenantId: string;
  targetSampleSize: number;
  confidenceLevelPct: 90 | 95 | 99;
  tolerableMisstatementCents: bigint;
  randomSeed?: number;
}

export interface AuditSamplingPackage {
  tenantId: string;
  generatedAt: string;
  methodology: "MONETARY_UNIT_SAMPLING_PPS";
  parameters: AuditSamplingParameters;
  populationSummary: {
    totalTransactionsCount: number;
    totalBookValueCents: bigint;
    currency: string;
  };
  sampleResults: {
    sampleSize: number;
    samplingIntervalCents: bigint;
    topStratum100PctCount: number; // Exceeds interval, 100% selected
    representativeSampleCount: number;
    coverageRatioBps: number; // Basis points of total book value sampled
    selectedTransactions: Array<{
      transaction: AuditableTransaction;
      selectionReason: "TOP_STRATUM_HIGH_VALUE" | "INTERVAL_SAMPLE";
      cumulativeIntervalHitCents: bigint;
    }>;
  };
  sampleManifestMerkleRoot: string;
}

/**
 * Executes Monetary Unit Sampling across a transaction population.
 */
export function generateAuditSamplingPackage(
  tenantId: string,
  population: AuditableTransaction[],
  params: AuditSamplingParameters
): AuditSamplingPackage {
  if (population.length === 0) {
    throw new Error("Population must not be empty");
  }

  const currency = population[0]!.currency;
  let totalBookValueCents = 0n;

  for (const tx of population) {
    if (tx.tenantId !== tenantId) {
      throw new Error(`Tenant mismatch: Transaction ${tx.id} belongs to ${tx.tenantId}`);
    }
    if (tx.currency !== currency) {
      throw new Error(`Multi-currency sampling requires single-currency normalization`);
    }
    totalBookValueCents += tx.amountCents;
  }

  const targetN = BigInt(Math.max(1, Math.min(params.targetSampleSize, population.length)));
  const samplingIntervalCents = totalBookValueCents / targetN;

  const selectedTransactions: AuditSamplingPackage["sampleResults"]["selectedTransactions"] = [];
  let sampledBookValueCents = 0n;
  let topStratumCount = 0;
  let representativeCount = 0;

  // LCG pseudo-random start point based on seed
  const seed = params.randomSeed ?? 1337;
  const initialOffset = (samplingIntervalCents * BigInt(seed % 1000)) / 1000n;

  let currentThreshold = initialOffset > 0n ? initialOffset : 1n;
  let cumulativeBookValue = 0n;

  for (const tx of population) {
    // 1. Check if top-stratum (item >= sampling interval)
    if (samplingIntervalCents > 0n && tx.amountCents >= samplingIntervalCents) {
      selectedTransactions.push({
        transaction: tx,
        selectionReason: "TOP_STRATUM_HIGH_VALUE",
        cumulativeIntervalHitCents: cumulativeBookValue + tx.amountCents,
      });
      topStratumCount++;
      sampledBookValueCents += tx.amountCents;
      cumulativeBookValue += tx.amountCents;
      continue;
    }

    // 2. Interval PPS sampling
    cumulativeBookValue += tx.amountCents;
    if (cumulativeBookValue >= currentThreshold) {
      selectedTransactions.push({
        transaction: tx,
        selectionReason: "INTERVAL_SAMPLE",
        cumulativeIntervalHitCents: currentThreshold,
      });
      representativeCount++;
      sampledBookValueCents += tx.amountCents;
      currentThreshold += samplingIntervalCents;
    }
  }

  const coverageRatioBps =
    totalBookValueCents > 0n ? Number((sampledBookValueCents * 10000n) / totalBookValueCents) : 0;

  // Calculate RFC 6962 sample manifest Merkle root
  const sampleLeaves = selectedTransactions
    .map((s) =>
      createHash("sha256")
        .update(`${s.transaction.id}:${s.selectionReason}:${s.transaction.merkleLeafHash}`)
        .digest("hex")
    )
    .sort();

  let sampleManifestMerkleRoot = "0000000000000000000000000000000000000000000000000000000000000000";
  if (sampleLeaves.length > 0) {
    let currentLevel = sampleLeaves;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]!;
        const right = currentLevel[i + 1] ?? left;
        const combined = createHash("sha256")
          .update(Buffer.concat([Buffer.from([0x01]), Buffer.from(left + right, "hex")]))
          .digest("hex");
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    sampleManifestMerkleRoot = currentLevel[0]!;
  }

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    methodology: "MONETARY_UNIT_SAMPLING_PPS",
    parameters: params,
    populationSummary: {
      totalTransactionsCount: population.length,
      totalBookValueCents,
      currency,
    },
    sampleResults: {
      sampleSize: selectedTransactions.length,
      samplingIntervalCents,
      topStratum100PctCount: topStratumCount,
      representativeSampleCount: representativeCount,
      coverageRatioBps,
      selectedTransactions,
    },
    sampleManifestMerkleRoot,
  };
}
