import { synthesizeRulesFromAdjudications, AdjudicationMemoryRecord } from "../rule-synthesizer";

describe("Adjudication Memory -> Rule Synthesis Feedback Loop", () => {
  const tenantId = "tenant_corp_alpha";

  it("synthesizes a backtested fee schedule rule from recurring operator fee approvals", () => {
    const memory: AdjudicationMemoryRecord[] = [
      {
        id: "adj_1",
        tenantId,
        exceptionId: "exc_1",
        sourceAmount: 100.0,
        feeAmount: 2.9, // 2.9% = 290 bps
        currency: "USD",
        timestamp: "2026-10-15T12:00:00Z",
        operatorAction: "APPROVED_FEE",
      },
      {
        id: "adj_2",
        tenantId,
        exceptionId: "exc_2",
        sourceAmount: 200.0,
        feeAmount: 5.8, // 2.9% = 290 bps
        currency: "USD",
        timestamp: "2026-10-16T12:00:00Z",
        operatorAction: "APPROVED_FEE",
      },
      {
        id: "adj_3",
        tenantId,
        exceptionId: "exc_3",
        sourceAmount: 300.0,
        feeAmount: 8.7, // 2.9% = 290 bps
        currency: "USD",
        timestamp: "2026-10-17T12:00:00Z",
        operatorAction: "APPROVED_FEE",
      },
    ];

    const proposals = synthesizeRulesFromAdjudications(memory, tenantId);

    expect(proposals.length).toBeGreaterThanOrEqual(1);
    const feeProposal = proposals.find((p) => p.ruleType === "FEE_SCHEDULE_RULE");
    expect(feeProposal).toBeDefined();
    expect(feeProposal!.ruleDefinition.parameters.basisPoints).toBe(290);
    expect(feeProposal!.confidenceScore).toBeGreaterThanOrEqual(0.95);
    expect(feeProposal!.backtestMetrics.precision).toBe(100);
    expect(feeProposal!.backtestMetrics.matchesCovered).toBe(3);
    expect(feeProposal!.requiresPolicyToken).toBe(true);
  });

  it("synthesizes an FX tolerance rule when operators consistently approve currency spreads", () => {
    const memory: AdjudicationMemoryRecord[] = [
      {
        id: "adj_fx_1",
        tenantId,
        exceptionId: "exc_fx_1",
        sourceAmount: 1000.0,
        targetAmount: 988.0,
        currency: "EUR",
        timestamp: "2026-10-15T10:00:00Z",
        operatorAction: "APPROVED_FX_SPREAD",
      },
      {
        id: "adj_fx_2",
        tenantId,
        exceptionId: "exc_fx_2",
        sourceAmount: 1500.0,
        targetAmount: 1482.0,
        currency: "EUR",
        timestamp: "2026-10-16T10:00:00Z",
        operatorAction: "APPROVED_FX_SPREAD",
      },
      {
        id: "adj_fx_3",
        tenantId,
        exceptionId: "exc_fx_3",
        sourceAmount: 2000.0,
        targetAmount: 1976.0,
        currency: "EUR",
        timestamp: "2026-10-17T10:00:00Z",
        operatorAction: "APPROVED_FX_SPREAD",
      },
    ];

    const proposals = synthesizeRulesFromAdjudications(memory, tenantId);
    const fxProposal = proposals.find((p) => p.ruleType === "FX_SPREAD_RULE");

    expect(fxProposal).toBeDefined();
    expect(fxProposal!.ruleDefinition.parameters.fxTolerancePercentage).toBe(0.015);
    expect(fxProposal!.backtestMetrics.precision).toBe(100);
  });

  it("synthesizes a reference transformation rule when prefix stripping is repeatedly approved", () => {
    const memory: AdjudicationMemoryRecord[] = [
      {
        id: "adj_ref_1",
        tenantId,
        exceptionId: "exc_ref_1",
        sourceAmount: 50.0,
        currency: "USD",
        timestamp: "2026-10-15T10:00:00Z",
        operatorAction: "NORMALIZED_REFERENCE",
        sourceReferenceId: "INV-9901",
        targetReferenceId: "9901",
      },
      {
        id: "adj_ref_2",
        tenantId,
        exceptionId: "exc_ref_2",
        sourceAmount: 75.0,
        currency: "USD",
        timestamp: "2026-10-16T10:00:00Z",
        operatorAction: "NORMALIZED_REFERENCE",
        sourceReferenceId: "INV-9902",
        targetReferenceId: "9902",
      },
      {
        id: "adj_ref_3",
        tenantId,
        exceptionId: "exc_ref_3",
        sourceAmount: 120.0,
        currency: "USD",
        timestamp: "2026-10-17T10:00:00Z",
        operatorAction: "NORMALIZED_REFERENCE",
        sourceReferenceId: "INV-9903",
        targetReferenceId: "9903",
      },
    ];

    const proposals = synthesizeRulesFromAdjudications(memory, tenantId);
    const refProposal = proposals.find((p) => p.ruleType === "REFERENCE_TRANSFORMATION_RULE");

    expect(refProposal).toBeDefined();
    expect(refProposal!.ruleDefinition.parameters.stripPrefix).toBe("INV-");
  });

  it("returns empty proposals when sample threshold is not met or records belong to another tenant", () => {
    const memory: AdjudicationMemoryRecord[] = [
      {
        id: "adj_sparse",
        tenantId: "tenant_other",
        exceptionId: "exc_other",
        sourceAmount: 100.0,
        currency: "USD",
        timestamp: "2026-10-18T10:00:00Z",
        operatorAction: "APPROVED_FEE",
      },
    ];

    const proposals = synthesizeRulesFromAdjudications(memory, tenantId);
    expect(proposals).toHaveLength(0);
  });
});
