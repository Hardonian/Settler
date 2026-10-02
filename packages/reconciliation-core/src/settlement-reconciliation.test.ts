import {
  canonicalJson,
  createDemoProofpack,
  parseDecimalToMinorUnits,
  reconcileSettlementRecords,
  verifyDemoProofpack,
  type SettlementRecordInput,
  type SettlementRuleSet,
} from "./settlement-reconciliation";

const rules: SettlementRuleSet = {
  version: "stripe-bank/1.0.0",
  amountToleranceMinor: "1",
  dateWindowDays: 3,
  requireReference: true,
};

function record(
  id: string,
  amount: string,
  side: "processor_csv" | "bank_csv",
  overrides: Partial<SettlementRecordInput> = {}
): SettlementRecordInput {
  return {
    id,
    tenantId: "tenant-a",
    accountId: "operating-usd",
    amount,
    currency: "USD",
    date: side === "processor_csv" ? "2026-05-31" : "2026-06-01",
    reference: "PO-100",
    kind: "payout",
    provenance: { source: side, sourceRecordId: id },
    ...overrides,
  };
}

describe("settlement reconciliation", () => {
  test("parses supported currency exponents without binary floating point", () => {
    expect(parseDecimalToMinorUnits("12.34", "USD")).toBe(1234n);
    expect(parseDecimalToMinorUnits("12", "JPY")).toBe(12n);
    expect(parseDecimalToMinorUnits("12.345", "BHD")).toBe(12345n);
    expect(() => parseDecimalToMinorUnits("12.345", "USD")).toThrow("exceeds USD precision");
    expect(() => parseDecimalToMinorUnits("12.00", "XYZ")).toThrow("Unsupported currency");
  });

  test("classifies exact, tolerance, ambiguity, and unmatched records factually", () => {
    const run = reconcileSettlementRecords({
      sourceRecords: [
        record("s-exact", "10.00", "processor_csv", { reference: "EXACT" }),
        record("s-tolerance", "20.00", "processor_csv", { reference: "TOL" }),
        record("s-ambiguous", "30.00", "processor_csv", { reference: "AMB" }),
        record("s-unmatched", "40.00", "processor_csv", { reference: "MISSING" }),
      ],
      targetRecords: [
        record("t-exact", "10.00", "bank_csv", { reference: "exact" }),
        record("t-tolerance", "19.99", "bank_csv", { reference: "TOL" }),
        record("t-ambiguous-a", "30.00", "bank_csv", { reference: "AMB" }),
        record("t-ambiguous-b", "30.00", "bank_csv", { reference: "AMB" }),
        record("t-unmatched", "50.00", "bank_csv", { reference: "BANK-ONLY" }),
      ],
      rules,
    });
    expect(run.summary).toEqual({
      exact: 1,
      tolerance: 1,
      ambiguous: 1,
      unmatched_source: 1,
      unmatched_target: 1,
    });
    expect(run.results.find((result) => result.decision === "tolerance")?.reason).toContain(
      "1 minor unit(s)"
    );
  });

  test("does not consume a target twice and surfaces a contested target", () => {
    const run = reconcileSettlementRecords({
      sourceRecords: [
        record("s-1", "10.00", "processor_csv"),
        record("s-2", "10.00", "processor_csv"),
      ],
      targetRecords: [record("t-1", "10.00", "bank_csv")],
      rules,
    });
    expect(run.summary.ambiguous).toBe(2);
    expect(run.results.filter((result) => result.targetRecordId === "t-1")).toHaveLength(0);
  });

  test("rejects cross-tenant and cross-account runs", () => {
    expect(() =>
      reconcileSettlementRecords({
        sourceRecords: [record("s-1", "10.00", "processor_csv")],
        targetRecords: [record("t-1", "10.00", "bank_csv", { tenantId: "tenant-b" })],
        rules,
      })
    ).toThrow("Tenant mismatch");
    expect(() =>
      reconcileSettlementRecords({
        sourceRecords: [record("s-1", "10.00", "processor_csv")],
        targetRecords: [record("t-1", "10.00", "bank_csv", { accountId: "reserve-usd" })],
        rules,
      })
    ).toThrow("Account mismatch");
  });

  test("is permutation invariant and produces a stable semantic commitment", () => {
    const source = [
      record("s-2", "20.00", "processor_csv", { reference: "B" }),
      record("s-1", "10.00", "processor_csv", { reference: "A" }),
    ];
    const target = [
      record("t-2", "20.00", "bank_csv", { reference: "B" }),
      record("t-1", "10.00", "bank_csv", { reference: "A" }),
    ];
    const first = reconcileSettlementRecords({
      sourceRecords: source,
      targetRecords: target,
      rules,
    });
    const second = reconcileSettlementRecords({
      sourceRecords: [...source].reverse(),
      targetRecords: [...target].reverse(),
      rules,
    });
    expect(canonicalJson(first)).toBe(canonicalJson(second));
    const proofA = createDemoProofpack(
      first,
      { processor: "a", bank: "b" },
      "2026-01-01T00:00:00Z"
    );
    const proofB = createDemoProofpack(
      second,
      { bank: "b", processor: "a" },
      "2026-09-01T00:00:00Z"
    );
    expect(proofA.integrity.commitment).toBe(proofB.integrity.commitment);
    expect(proofA.operationalMetadata.generatedAt).not.toBe(proofB.operationalMetadata.generatedAt);
    expect(verifyDemoProofpack(proofA)).toEqual({ valid: true, replayed: true, errors: [] });
  });

  test("detects committed-field tampering", () => {
    const run = reconcileSettlementRecords({
      sourceRecords: [record("s-1", "10.00", "processor_csv")],
      targetRecords: [record("t-1", "10.00", "bank_csv")],
      rules,
    });
    const proof = createDemoProofpack(run, { processor: "a", bank: "b" });
    proof.payload.run.sourceRecords[0]!.amountMinor = "999";
    expect(verifyDemoProofpack(proof)).toMatchObject({ valid: false, replayed: false });
  });
});
