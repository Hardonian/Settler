import {
  computeChainHash,
  computeReconciliationHash,
  stableStringify,
  verifyIntegrityChain,
} from "../../../services/reconciliation/integrity";

describe("reconciliation integrity", () => {
  it("produces deterministic hashes for equivalent payloads", () => {
    const run = {
      id: "run-1",
      tenantId: "tenant-1",
      ingestionId: null,
      status: "completed",
      sourceCount: 1,
      targetCount: 1,
      matchedCount: 1,
      unmatchedSourceCount: 0,
      unmatchedTargetCount: 0,
      confidenceAvg: 1,
      startedAt: "2025-01-01T00:00:00.000Z",
      completedAt: "2025-01-01T00:01:00.000Z",
    };

    const matchesA = [
      {
        id: "b",
        sourceTransactionId: "source-b",
        targetTransactionId: "target-b",
        matchType: "exact",
        confidence: 1,
        amountDiff: 0,
        dateDiff: 0,
      },
      {
        id: "a",
        sourceTransactionId: "source-a",
        targetTransactionId: "target-a",
        matchType: "exact",
        confidence: 1,
        amountDiff: 0,
        dateDiff: 0,
      },
    ];

    const matchesB = [...matchesA].reverse();

    expect(computeReconciliationHash(run, matchesA)).toBe(computeReconciliationHash(run, matchesB));
    expect(stableStringify({ z: 1, a: 2 })).toBe('{"a":2,"z":1}');
  });

  it("detects hash chain tampering", () => {
    const firstReconciliationHash = "r1";
    const firstChainHash = computeChainHash(null, firstReconciliationHash);
    const secondReconciliationHash = "r2";
    const secondChainHash = computeChainHash(firstChainHash, secondReconciliationHash);

    const valid = verifyIntegrityChain([
      {
        previousHash: null,
        reconciliationHash: firstReconciliationHash,
        chainHash: firstChainHash,
      },
      {
        previousHash: firstChainHash,
        reconciliationHash: secondReconciliationHash,
        chainHash: secondChainHash,
      },
    ]);

    expect(valid.valid).toBe(true);

    const tampered = verifyIntegrityChain([
      {
        previousHash: null,
        reconciliationHash: firstReconciliationHash,
        chainHash: firstChainHash,
      },
      {
        previousHash: "invalid-link",
        reconciliationHash: secondReconciliationHash,
        chainHash: secondChainHash,
      },
    ]);

    expect(tampered.valid).toBe(false);
    expect(tampered.brokenAt).toBe(1);
  });
});
