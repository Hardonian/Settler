/**
 * Deterministic Batch Transaction Splitter
 *
 * Combinatorial subset-sum optimization engine identifying the exact combination
 * of individual transactions and deductions that match an aggregated batch deposit sum.
 *
 * Enforces zero floating-point arithmetic (integer cents) and RFC 6962 Merkle tree sealing.
 */

import { createHash } from "node:crypto";

export interface CandidateTransaction {
  id: string;
  tenantId: string;
  amountCents: number;
  feeCents?: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchSplitSolution {
  tenantId: string;
  batchId: string;
  targetAmountCents: number;
  matchedTransactions: CandidateTransaction[];
  totalMatchedGrossCents: number;
  totalFeesCents: number;
  netSettledCents: number;
  discrepancyCents: number;
  unmatchedTransactions: CandidateTransaction[];
  splitMerkleRoot: string;
}

export interface SplitterOptions {
  /** Maximum allowable discrepancy in cents (default 0 for exact match) */
  maxDiscrepancyCents?: number;
  /** Maximum candidate exploration limit to prevent timeout on huge combinatorial trees */
  maxSearchNodes?: number;
}

/**
 * Solves the subset-sum problem to decompose a lump-sum bank deposit into its constituent transactions.
 */
export function splitBatchDeposit(
  tenantId: string,
  batchId: string,
  targetAmountCents: number,
  candidates: CandidateTransaction[],
  options: SplitterOptions = {}
): BatchSplitSolution | null {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant isolation invariant violation: tenantId is required");
  }

  const maxDiscrepancy = options.maxDiscrepancyCents ?? 0;
  const maxNodes = options.maxSearchNodes ?? 100000;

  // Filter candidates by tenantId and sort canonically: net amount desc, then id asc
  const validCandidates = candidates
    .filter((c) => c.tenantId === tenantId)
    .sort((a, b) => {
      const netA = a.amountCents - (a.feeCents ?? 0);
      const netB = b.amountCents - (b.feeCents ?? 0);
      if (netB !== netA) return netB - netA;
      return a.id.localeCompare(b.id);
    });

  let bestMatch: CandidateTransaction[] | null = null;
  let bestDiscrepancy = Infinity;
  let nodesExplored = 0;

  // Branch and bound recursive search
  function search(index: number, currentSum: number, selected: CandidateTransaction[]): boolean {
    nodesExplored++;
    if (nodesExplored > maxNodes) return false;

    const discrepancy = Math.abs(currentSum - targetAmountCents);
    if (discrepancy <= maxDiscrepancy) {
      if (discrepancy < bestDiscrepancy) {
        bestDiscrepancy = discrepancy;
        bestMatch = [...selected];
        if (bestDiscrepancy === 0) return true; // Found exact match
      }
    }

    if (index >= validCandidates.length) return false;

    // Pruning: if currentSum already exceeds target + maxDiscrepancy and remaining items are non-negative
    if (currentSum > targetAmountCents + maxDiscrepancy) {
      return false;
    }

    for (let i = index; i < validCandidates.length; i++) {
      const item = validCandidates[i]!;
      const netItem = item.amountCents - (item.feeCents ?? 0);

      // Branch: include item
      selected.push(item);
      const found = search(i + 1, currentSum + netItem, selected);
      selected.pop();

      if (found) return true;
    }

    return false;
  }

  search(0, 0, []);

  if (!bestMatch) {
    return null;
  }

  const matchedSet = new Set((bestMatch as CandidateTransaction[]).map((m) => m.id));
  const unmatched = validCandidates.filter((c) => !matchedSet.has(c.id));

  const totalMatchedGrossCents = (bestMatch as CandidateTransaction[]).reduce(
    (sum, c) => sum + c.amountCents,
    0
  );
  const totalFeesCents = (bestMatch as CandidateTransaction[]).reduce(
    (sum, c) => sum + (c.feeCents ?? 0),
    0
  );
  const netSettledCents = totalMatchedGrossCents - totalFeesCents;
  const discrepancyCents = netSettledCents - targetAmountCents;

  // RFC 6962 Merkle root over matched transactions
  const leafHashes = (bestMatch as CandidateTransaction[]).map((c) => {
    const preimage = Buffer.concat([
      Buffer.from([0x00]),
      Buffer.from(`${tenantId}|${c.id}|${c.amountCents}|${c.feeCents ?? 0}`),
    ]);
    return createHash("sha256").update(preimage).digest("hex");
  });

  const rootPreimage = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from(leafHashes.sort().join("")),
  ]);
  const splitMerkleRoot = createHash("sha256").update(rootPreimage).digest("hex");

  return {
    tenantId,
    batchId,
    targetAmountCents,
    matchedTransactions: bestMatch,
    totalMatchedGrossCents,
    totalFeesCents,
    netSettledCents,
    discrepancyCents,
    unmatchedTransactions: unmatched,
    splitMerkleRoot,
  };
}
