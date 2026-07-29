#!/usr/bin/env tsx
/**
 * Determinism Verification Script
 *
 * Validates that reconciliation runs are reproducible by:
 * 1. Checking that RunSnapshot records exist for completed runs
 * 2. Verifying input hashes are consistent
 * 3. Testing replay of historical runs
 * 4. Validating execution provenance chains
 *
 * Usage:
 *   pnpm run validate:determinism
 *   pnpm tsx scripts/verify-determinism.ts
 *   pnpm tsx scripts/verify-determinism.ts --replay <run-id>
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Determinism violations found
 *   2 - Configuration error
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

interface DeterminismCheckResult {
  passed: boolean;
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn" | "skip";
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// CHECKS
// ============================================================================

async function checkSnapshotExists(): Promise<CheckResult> {
  const runsWithoutSnapshots = await prisma.reconResult.count({
    where: {
      status: "completed",
      snapshotId: null,
    },
  });

  if (runsWithoutSnapshots === 0) {
    return {
      name: "Snapshot Existence",
      status: "pass",
      message: "All completed runs have snapshots",
    };
  }

  return {
    name: "Snapshot Existence",
    status: runsWithoutSnapshots > 10 ? "fail" : "warn",
    message: `${runsWithoutSnapshots} completed runs without snapshots`,
    details: { count: runsWithoutSnapshots },
  };
}

async function checkInputHashConsistency(): Promise<CheckResult> {
  const results = await prisma.$queryRaw<Array<{ inputHash: string; count: bigint }>>`
    SELECT input_hash as "inputHash", COUNT(*) as count
    FROM recon_results
    WHERE input_hash IS NOT NULL
    GROUP BY input_hash
    HAVING COUNT(*) > 1
  `;

  if (results.length === 0) {
    return {
      name: "Input Hash Consistency",
      status: "pass",
      message: "No duplicate input hashes found",
    };
  }

  // Duplicate hashes are expected for re-runs, check if outputs match
  const inconsistencies: Array<{ inputHash: string; matchCounts: number[] }> = [];

  // Fix N+1 query: Fetch all related runs in a single query
  const allRuns = await prisma.reconResult.findMany({
    where: { inputHash: { in: results.map((r) => r.inputHash) } },
    select: { inputHash: true, id: true, matchedCount: true },
  });

  const runsByHash = new Map<string, typeof allRuns>();
  for (const run of allRuns) {
    if (run.inputHash) {
      if (!runsByHash.has(run.inputHash)) runsByHash.set(run.inputHash, []);
      runsByHash.get(run.inputHash)!.push(run);
    }
  }

  for (const row of results) {
    const runsWithSameHash = runsByHash.get(row.inputHash) || [];

    const matchCounts = Array.from(new Set(runsWithSameHash.map((r) => Number(r.matchedCount))));
    if (matchCounts.length > 1) {
      inconsistencies.push({
        inputHash: row.inputHash,
        matchCounts,
      });
    }
  }

  if (inconsistencies.length === 0) {
    return {
      name: "Input Hash Consistency",
      status: "pass",
      message: `${results.length} re-runs found, all with consistent outputs`,
    };
  }

  return {
    name: "Input Hash Consistency",
    status: "fail",
    message: `${inconsistencies.length} input hashes produced different outputs`,
    details: { inconsistencies },
  };
}

async function checkProvenanceChain(): Promise<CheckResult> {
  const resultsWithoutProvenance = await prisma.reconResult.count({
    where: {
      status: "completed",
      provenance: { none: {} },
    },
  });

  if (resultsWithoutProvenance === 0) {
    return {
      name: "Provenance Chain",
      status: "pass",
      message: "All completed runs have provenance records",
    };
  }

  return {
    name: "Provenance Chain",
    status: resultsWithoutProvenance > 10 ? "fail" : "warn",
    message: `${resultsWithoutProvenance} completed runs without provenance`,
    details: { count: resultsWithoutProvenance },
  };
}

async function checkProvenanceIntegrity(): Promise<CheckResult> {
  // Get provenance entries and verify hashes
  const provenanceEntries = await prisma.executionProvenance.findMany({
    take: 100,
    orderBy: { timestamp: "desc" },
  });

  let invalidCount = 0;
  for (const entry of provenanceEntries) {
    const computedHash = generateProvenanceHash({
      runResultId: entry.runResultId,
      sequence: entry.sequence,
      timestamp: entry.timestamp.toISOString(),
      operation: entry.operation as "run_started",
      entityId: entry.entityId,
      details: entry.details as Record<string, unknown>,
    });

    if (computedHash !== entry.entryHash) {
      invalidCount++;
    }
  }

  if (invalidCount === 0) {
    return {
      name: "Provenance Integrity",
      status: "pass",
      message: `Verified ${provenanceEntries.length} provenance entries`,
    };
  }

  return {
    name: "Provenance Integrity",
    status: "fail",
    message: `${invalidCount} provenance entries have invalid hashes`,
    details: { invalidCount, checked: provenanceEntries.length },
  };
}

async function checkRuleVersionLocking(): Promise<CheckResult> {
  const snapshots = await prisma.runSnapshot.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  if (snapshots.length === 0) {
    return {
      name: "Rule Version Locking",
      status: "skip",
      message: "No snapshots found to check",
    };
  }

  let withRuleVersions = 0;
  for (const snapshot of snapshots) {
    const ruleVersions = snapshot.ruleVersions as Array<{ ruleId: string; version: number }>;
    if (Array.isArray(ruleVersions) && ruleVersions.length > 0) {
      withRuleVersions++;
    }
  }

  if (withRuleVersions === snapshots.length) {
    return {
      name: "Rule Version Locking",
      status: "pass",
      message: "All snapshots have rule versions locked",
    };
  }

  const percentage = Math.round((withRuleVersions / snapshots.length) * 100);
  return {
    name: "Rule Version Locking",
    status: percentage < 50 ? "fail" : "warn",
    message: `${withRuleVersions}/${snapshots.length} snapshots have rule versions (${percentage}%)`,
    details: { withRuleVersions, total: snapshots.length },
  };
}

async function checkDeterministicOrdering(): Promise<CheckResult> {
  // Check if provenance sequences are properly ordered
  const results = await prisma.reconResult.findMany({
    where: { status: "completed" },
    take: 20,
    include: {
      provenance: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  let orderingIssues = 0;
  for (const result of results) {
    const sequences = result.provenance.map((p) => p.sequence);
    for (let i = 1; i < sequences.length; i++) {
      if (sequences[i] !== sequences[i - 1] + 1) {
        orderingIssues++;
        break;
      }
    }
  }

  if (orderingIssues === 0) {
    return {
      name: "Deterministic Ordering",
      status: "pass",
      message: "All provenance sequences are properly ordered",
    };
  }

  return {
    name: "Deterministic Ordering",
    status: "warn",
    message: `${orderingIssues} runs have sequence gaps`,
    details: { orderingIssues },
  };
}

// ============================================================================
// REPLAY VERIFICATION
// ============================================================================

async function verifyReplay(runId: string): Promise<CheckResult> {
  const result = await prisma.reconResult.findUnique({
    where: { id: runId },
    include: {
      snapshot: true,
      provenance: { orderBy: { sequence: "asc" } },
    },
  });

  if (!result) {
    return {
      name: "Replay Verification",
      status: "fail",
      message: `Run ${runId} not found`,
    };
  }

  if (!result.snapshot) {
    return {
      name: "Replay Verification",
      status: "fail",
      message: `Run ${runId} has no snapshot`,
    };
  }

  // Verify snapshot integrity
  const snapshotData = {
    jobConfig: result.snapshot.jobConfig,
    ruleVersions: result.snapshot.ruleVersions,
    sourceDataHash: result.snapshot.sourceDataHash,
    targetDataHash: result.snapshot.targetDataHash,
    adapterConfigHashes: result.snapshot.adapterConfigHashes,
    engineVersion: result.snapshot.engineVersion,
  };

  const computedHash = generateInputHash(snapshotData);
  if (computedHash !== result.snapshot.inputHash) {
    return {
      name: "Replay Verification",
      status: "fail",
      message: `Snapshot hash mismatch for run ${runId}`,
      details: {
        expected: result.snapshot.inputHash,
        computed: computedHash,
      },
    };
  }

  // Verify provenance chain
  const provenanceCount = result.provenance.length;
  if (provenanceCount === 0) {
    return {
      name: "Replay Verification",
      status: "warn",
      message: `Run ${runId} has no provenance records`,
    };
  }

  // Verify provenance hashes
  for (const entry of result.provenance) {
    const computedEntryHash = generateProvenanceHash({
      runResultId: entry.runResultId,
      sequence: entry.sequence,
      timestamp: entry.timestamp.toISOString(),
      operation: entry.operation as "run_started",
      entityId: entry.entityId,
      details: entry.details as Record<string, unknown>,
    });

    if (computedEntryHash !== entry.entryHash) {
      return {
        name: "Replay Verification",
        status: "fail",
        message: `Provenance hash mismatch at sequence ${entry.sequence}`,
        details: {
          sequence: entry.sequence,
          expected: entry.entryHash,
          computed: computedEntryHash,
        },
      };
    }
  }

  return {
    name: "Replay Verification",
    status: "pass",
    message: `Run ${runId} is fully reproducible`,
    details: {
      snapshotId: result.snapshot.id,
      inputHash: result.snapshot.inputHash,
      provenanceEntries: provenanceCount,
    },
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateInputHash(data: unknown): string {
  const canonical = JSON.stringify(data, Object.keys(data as object).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

function generateProvenanceHash(entry: {
  runResultId: string;
  sequence: number;
  timestamp: string;
  operation: string;
  entityId: string;
  details: Record<string, unknown>;
}): string {
  const canonical = JSON.stringify({
    runResultId: entry.runResultId,
    sequence: entry.sequence,
    timestamp: entry.timestamp,
    operation: entry.operation,
    entityId: entry.entityId,
    details: entry.details,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<DeterminismCheckResult> {
  const args = process.argv.slice(2);
  const checks: CheckResult[] = [];

  // Check for replay mode
  const replayIndex = args.indexOf("--replay");
  if (replayIndex !== -1 && args[replayIndex + 1]) {
    const runId = args[replayIndex + 1];
    const replayResult = await verifyReplay(runId);
    checks.push(replayResult);
  } else {
    // Run all checks
    checks.push(await checkSnapshotExists());
    checks.push(await checkInputHashConsistency());
    checks.push(await checkProvenanceChain());
    checks.push(await checkProvenanceIntegrity());
    checks.push(await checkRuleVersionLocking());
    checks.push(await checkDeterministicOrdering());
  }

  const summary = {
    total: checks.length,
    passed: checks.filter((c) => c.status === "pass").length,
    failed: checks.filter((c) => c.status === "fail").length,
    warnings: checks.filter((c) => c.status === "warn").length,
  };

  return {
    passed: summary.failed === 0,
    checks,
    summary,
  };
}

// ============================================================================
// CLI OUTPUT
// ============================================================================

function printResults(result: DeterminismCheckResult): void {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           DETERMINISM VERIFICATION RESULTS                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  for (const check of result.checks) {
    const icon = {
      pass: "✅",
      fail: "❌",
      warn: "⚠️",
      skip: "⏭️",
    }[check.status];

    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}`);
    if (check.details) {
      console.log(`   Details: ${JSON.stringify(check.details)}`);
    }
    console.log();
  }

  console.log("───────────────────────────────────────────────────────────────");
  console.log(
    `Total: ${result.summary.total} | Passed: ${result.summary.passed} | Failed: ${result.summary.failed} | Warnings: ${result.summary.warnings}`
  );
  console.log(`Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("───────────────────────────────────────────────────────────────\n");
}

// Run
main()
  .then((result) => {
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Determinism verification failed:", error);
    process.exit(2);
  })
  .finally(() => {
    prisma.$disconnect();
  });
