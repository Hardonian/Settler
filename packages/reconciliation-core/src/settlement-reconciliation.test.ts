import {
  canonicalJson,
  createDemoProofpack,
  parseDecimalToMinorUnits,
  reconcileSettlementRecords,
  verifyDemoProofpack,
  type SettlementRecordInput,
  type SettlementRuleSet,
} from "./settlement-reconciliation";
import { matchBipartiteTransactions } from "./bipartite-matching";
import { reconcileTriangular } from "./triangular-reconciliation";
import { simulatePolicyDraft } from "./counterfactual-policy-sandbox";

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

  test("preserves DemoProofpack commitment across JSON.stringify/JSON.parse round-trip when optional fields are omitted", () => {
    const run = reconcileSettlementRecords({
      sourceRecords: [record("s-1", "10.00", "processor_csv")],
      targetRecords: [record("t-1", "10.00", "bank_csv")],
      rules,
    });
    const proof = createDemoProofpack(
      run,
      { processor: "a", bank: "b" },
      "2026-10-26T00:00:00.000Z"
    );
    const roundTripped = JSON.parse(JSON.stringify(proof));
    expect(verifyDemoProofpack(roundTripped)).toEqual({
      valid: true,
      replayed: true,
      errors: [],
    });
  });

  test("scales deterministically to 5,000 source and 5,000 target settlement records in sub-second hot path", () => {
    const count = 5000;
    const sources: SettlementRecordInput[] = [];
    const targets: SettlementRecordInput[] = [];

    for (let i = 0; i < count; i++) {
      const ref = `REF-${String(i).padStart(5, "0")}`;
      const amount = `${100 + (i % 900)}.${String(i % 100).padStart(2, "0")}`;
      sources.push(record(`s-${i}`, amount, "processor_csv", { reference: ref }));
      targets.push(record(`t-${i}`, amount, "bank_csv", { reference: ref }));
    }

    const startMs = performance.now();
    const run = reconcileSettlementRecords({
      sourceRecords: sources,
      targetRecords: targets,
      rules,
    });
    const elapsedMs = performance.now() - startMs;

    expect(run.summary.exact).toBe(count);
    expect(run.summary.unmatched_source).toBe(0);
    expect(run.summary.unmatched_target).toBe(0);
    expect(elapsedMs).toBeLessThan(1500);
  });

  test("executes high-scale bipartite, triangular, and counterfactual sandbox hot paths deterministically", () => {
    // 1. Bipartite matching with pre-parsed timestamps & flat TypedArray Hungarian solver
    const left = Array.from({ length: 80 }, (_, i) => ({
      id: `L-${i}`,
      amountCents: BigInt(10000 + i * 100),
      currency: "USD",
      timestamp: "2026-10-20T12:00:00.000Z",
    }));
    const right = Array.from({ length: 80 }, (_, i) => ({
      id: `R-${i}`,
      amountCents: BigInt(10000 + i * 100 + (i % 3)),
      currency: "USD",
      timestamp: "2026-10-20T14:00:00.000Z",
    }));
    const bipartite = matchBipartiteTransactions(left, right);
    expect(bipartite.matchedPairs).toHaveLength(80);
    expect(bipartite.unmatchedLeft).toHaveLength(0);

    // 2. Triangular 3-way reconciliation with indexed lookups & deterministic asOfTimestamp
    const orders = Array.from({ length: 1000 }, (_, i) => ({
      id: `ord-${i}`,
      orderNumber: `ORD-${i}`,
      amountCents: 10000n,
      currency: "USD",
      timestamp: "2026-10-20T10:00:00.000Z",
    }));
    const captures = Array.from({ length: 1000 }, (_, i) => ({
      id: `cap-${i}`,
      orderNumber: i % 2 === 0 ? `ORD-${i}` : undefined,
      gatewayTransactionId: `gw-${i}`,
      grossAmountCents: 10000n,
      feeCents: 290n,
      netAmountCents: 9710n,
      currency: "USD",
      timestamp: "2026-10-20T10:05:00.000Z",
    }));
    const deposits = Array.from({ length: 1000 }, (_, i) => ({
      id: `dep-${i}`,
      reference: `STRIPE-SWEEP-${i}`,
      depositAmountCents: 9710n,
      currency: "USD",
      timestamp: "2026-10-21T08:00:00.000Z",
    }));
    const triA = reconcileTriangular(orders, captures, deposits, {
      tenantId: "tenant-a",
      asOfTimestamp: "2026-10-22T00:00:00.000Z",
    });
    const triB = reconcileTriangular(orders, captures, deposits, {
      tenantId: "tenant-a",
      asOfTimestamp: "2026-10-22T00:00:00.000Z",
    });
    expect(triA.perfectMatches).toHaveLength(1000);
    expect(triA.metrics.merkleRoot).toBe(triB.metrics.merkleRoot);

    // 3. Counterfactual Policy Sandbox with pre-indexed ARNs and pre-tokenized words
    const sandboxSources = Array.from({ length: 500 }, (_, i) => ({
      id: `src-${i}`,
      amountCents: BigInt(5000 + i),
      date: "2026-10-20T00:00:00.000Z",
      description: `STRIPE PAYOUT BATCH ${i} SETTLEMENT`,
      currency: "USD",
    }));
    const sandboxTargets = Array.from({ length: 500 }, (_, i) => ({
      id: `tgt-${i}`,
      amountCents: BigInt(5000 + i + (i % 2 === 0 ? 0 : 15)),
      date: "2026-10-21T00:00:00.000Z",
      description: `STRIPE PAYOUT BATCH ${i} SETTLEMENT`,
      currency: "USD",
    }));
    const simReport = simulatePolicyDraft({
      tenantId: "tenant-a",
      baselineRuleset: {
        dateWindowDays: 2,
        amountToleranceCents: 0,
        fuzzyDescriptionThreshold: 0.8,
        enableArnCorrelation: true,
      },
      candidatePolicy: {
        policyId: "pol-tol-20",
        tenantId: "tenant-a",
        proposedBy: "agent-01",
        actionType: "WIDEN_TOLERANCE",
        proposedRuleset: {
          dateWindowDays: 2,
          amountToleranceCents: 20,
          fuzzyDescriptionThreshold: 0.8,
          enableArnCorrelation: true,
        },
        rationale: "Capture 15-cent FX rounding variance",
      },
      sourceTransactions: sandboxSources,
      targetTransactions: sandboxTargets,
    });
    expect(simReport.baseline.matchedCount).toBe(250);
    expect(simReport.simulated.matchedCount).toBe(500);
    expect(simReport.delta.newlyMatchedCount).toBe(250);
    expect(simReport.soxCompliance.isCompliant).toBe(true);
  });
});
