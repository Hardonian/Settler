import { splitBatchDeposit, CandidateTransaction } from "./batch-splitter";

describe("Deterministic Batch Transaction Splitter", () => {
  const tenantId = "tenant_splitter_test";

  it("fails fast if tenantId invariant is violated", () => {
    expect(() => splitBatchDeposit("", "batch_01", 10000, [])).toThrow(
      /Tenant isolation invariant violation/
    );
  });

  it("identifies the exact combination of transactions matching a lump-sum bank deposit", () => {
    const candidates: CandidateTransaction[] = [
      { id: "tx_01", tenantId, amountCents: 5000, feeCents: 150 }, // net 4850
      { id: "tx_02", tenantId, amountCents: 10000, feeCents: 300 }, // net 9700
      { id: "tx_03", tenantId, amountCents: 3500, feeCents: 100 }, // net 3400
      { id: "tx_04", tenantId, amountCents: 7500, feeCents: 220 }, // net 7280
      { id: "tx_05", tenantId, amountCents: 12000, feeCents: 350 }, // net 11650
    ];

    // Target net deposit: tx_01 (4850) + tx_03 (3400) + tx_04 (7280) = 15530 cents
    const targetNetCents = 4850 + 3400 + 7280;

    const solution = splitBatchDeposit(tenantId, "batch_deposit_9901", targetNetCents, candidates);

    expect(solution).not.toBeNull();
    expect(solution!.matchedTransactions).toHaveLength(3);
    const matchedIds = solution!.matchedTransactions.map((t) => t.id).sort();
    expect(matchedIds).toEqual(["tx_01", "tx_03", "tx_04"]);

    expect(solution!.netSettledCents).toBe(targetNetCents);
    expect(solution!.discrepancyCents).toBe(0);
    expect(solution!.unmatchedTransactions).toHaveLength(2);
    expect(solution!.splitMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });

  it("enforces tenant boundary isolation and ignores foreign tenant transactions", () => {
    const candidates: CandidateTransaction[] = [
      { id: "tx_own", tenantId: "tenant_A", amountCents: 5000, feeCents: 0 },
      { id: "tx_foreign", tenantId: "tenant_B", amountCents: 5000, feeCents: 0 },
    ];

    // Looking for 10000 in tenant_A should fail because tenant_B is quarantined
    const solution = splitBatchDeposit("tenant_A", "batch_02", 10000, candidates);
    expect(solution).toBeNull();
  });
});
