import {
  matchBipartiteTransactions,
  solveHungarian,
  type MatchableTransaction,
} from "./bipartite-matching.js";

describe("Bipartite Graph Maximum-Weight Matching (Kuhn-Munkres)", () => {
  it("solves standard 3x3 Hungarian assignment optimally", () => {
    const costMatrix = [
      [10, 19, 8],
      [10, 18, 7],
      [13, 16, 9],
    ];

    const assignment = solveHungarian(costMatrix);
    expect(assignment.length).toBe(3);
    // Row 0 -> Col 2 (cost 8), Row 1 -> Col 0 (cost 10), Row 2 -> Col 1 (cost 16) -> total 34
    expect(assignment[0]).toBe(2);
    expect(assignment[1]).toBe(0);
    expect(assignment[2]).toBe(1);
  });

  it("optimally matches transactions between gateway authorizations and bank statement clearing lines", () => {
    const authorizations: MatchableTransaction[] = [
      {
        id: "auth_01",
        amountCents: 10000n, // $100.00
        currency: "USD",
        timestamp: "2026-09-10T12:00:00Z",
      },
      {
        id: "auth_02",
        amountCents: 25000n, // $250.00
        currency: "USD",
        timestamp: "2026-09-10T12:05:00Z",
      },
      {
        id: "auth_03",
        amountCents: 5000n, // $50.00
        currency: "USD",
        timestamp: "2026-09-10T12:10:00Z",
      },
    ];

    // Bank statement lines with slight processor fee variance
    const statementLines: MatchableTransaction[] = [
      {
        id: "bank_stmt_b",
        amountCents: 24700n, // $247.00 ($3.00 processor fee subtracted)
        currency: "USD",
        timestamp: "2026-09-10T14:00:00Z",
      },
      {
        id: "bank_stmt_a",
        amountCents: 9710n, // $97.10 ($2.90 fee subtracted)
        currency: "USD",
        timestamp: "2026-09-10T14:00:00Z",
      },
      {
        id: "bank_stmt_c",
        amountCents: 4850n, // $48.50 ($1.50 fee subtracted)
        currency: "USD",
        timestamp: "2026-09-10T14:00:00Z",
      },
    ];

    const result = matchBipartiteTransactions(authorizations, statementLines, {
      maxAllowedVarianceCents: 500n, // $5.00 max fee variance
    });

    expect(result.matchedPairs.length).toBe(3);
    expect(result.unmatchedLeft.length).toBe(0);
    expect(result.unmatchedRight.length).toBe(0);

    // Verify correct 1-to-1 pairings
    const pair1 = result.matchedPairs.find((p) => p.left.id === "auth_01");
    expect(pair1?.right.id).toBe("bank_stmt_a");

    const pair2 = result.matchedPairs.find((p) => p.left.id === "auth_02");
    expect(pair2?.right.id).toBe("bank_stmt_b");

    const pair3 = result.matchedPairs.find((p) => p.left.id === "auth_03");
    expect(pair3?.right.id).toBe("bank_stmt_c");
  });

  it("leaves transactions unmatched when currency or variance thresholds are violated", () => {
    const left: MatchableTransaction[] = [
      { id: "l1", amountCents: 1000n, currency: "USD", timestamp: new Date() },
    ];
    const right: MatchableTransaction[] = [
      { id: "r1", amountCents: 1000n, currency: "EUR", timestamp: new Date() }, // Currency mismatch
    ];

    const result = matchBipartiteTransactions(left, right);
    expect(result.matchedPairs.length).toBe(0);
    expect(result.unmatchedLeft.length).toBe(1);
    expect(result.unmatchedRight.length).toBe(1);
  });
});
