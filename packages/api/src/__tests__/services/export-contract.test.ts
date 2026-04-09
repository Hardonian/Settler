import { buildReconciliationExport } from "../../services/reconciliation/export-contract";
import { query } from "../../db";

const resolveOperatorRunDetailForTenantsMock = jest.fn();

jest.mock("../../db", () => {
  const actual = jest.requireActual("../../db");
  return {
    ...actual,
    query: jest.fn(),
  };
});

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {},
}));

jest.mock("@settler/reconciliation-core", () => ({
  canonicalMissingProofpackReasonForRunKind: (runKind: string) =>
    runKind === "ingestion_run" ? "ingestion_run_history_not_comparable" : "run_proofpack_missing",
  resolveOperatorRunDetailForTenants: (...args: unknown[]) =>
    resolveOperatorRunDetailForTenantsMock(...args),
  toRunCompactProofSummary: (index: any) => ({
    delta: {
      state: index.comparison.state,
      reasonCodes: index.comparison.reasonCodes,
    },
    operatorSummary: {
      signal: "strong",
      pattern: "stable_pattern",
      changedSincePreviousRun: "unchanged",
      proofPosture: "unchanged",
      primaryReasonCodes: index.comparison.reasonCodes,
      recurringFamilies: [
        {
          family: "bank_window",
          trend: "strengthening",
          certainty: "high",
          reasonCodes: ["recurring_family_signal_present"],
        },
      ],
      summary: "stable",
      explainerCodes: ["signal_strong", "pattern_stable"],
    },
  }),
  unavailableRunProofpackIndex: (reasonCode: string) => ({
    comparison: { state: "unavailable", reasonCodes: [reasonCode] },
  }),
  resolveRunCompactProofSummary: (input: any) => {
    const reasonCode = input.fallbackReasonCode ?? "run_proofpack_missing";
    if (input.compactProofSummary) {
      return {
        compactProofSummary: input.compactProofSummary,
        source: "compact_summary",
        fallbackReasonCode: null,
      };
    }
    if (input.proofpackIndex) {
      return {
        compactProofSummary: {
          delta: {
            state: input.proofpackIndex.comparison.state,
            reasonCodes: input.proofpackIndex.comparison.reasonCodes,
          },
          operatorSummary: {
            signal: "strong",
            pattern: "stable_pattern",
            changedSincePreviousRun: "unchanged",
            proofPosture: "unchanged",
            primaryReasonCodes: input.proofpackIndex.comparison.reasonCodes,
            recurringFamilies: [
              {
                family: "bank_window",
                trend: "strengthening",
                certainty: "high",
                reasonCodes: ["recurring_family_signal_present"],
              },
            ],
            summary: "stable",
            explainerCodes: ["signal_strong", "pattern_stable"],
          },
        },
        source: "proofpack_index",
        fallbackReasonCode: null,
      };
    }
    return {
      compactProofSummary: {
        delta: { state: "unavailable", reasonCodes: [reasonCode] },
        operatorSummary: {
          signal: "unavailable",
          pattern: "unavailable",
          changedSincePreviousRun: "unavailable",
          proofPosture: "unavailable",
          primaryReasonCodes: [reasonCode],
          recurringFamilies: [],
          summary: "unavailable",
          explainerCodes: ["signal_unavailable", "pattern_unavailable"],
        },
      },
      source: "fallback_unavailable",
      fallbackReasonCode: reasonCode,
    };
  },
}));

const queryMock = query as jest.MockedFunction<typeof query>;

describe("buildReconciliationExport historical intelligence", () => {
  beforeEach(() => {
    queryMock.mockReset();
    resolveOperatorRunDetailForTenantsMock.mockReset();

    queryMock
      .mockResolvedValueOnce([
        {
          id: "run-1",
          tenant_id: "11111111-1111-4111-8111-111111111111",
          ingestion_id: null,
          status: "completed",
          source_count: 2,
          target_count: 2,
          matched_count: 2,
          unmatched_source_count: 0,
          unmatched_target_count: 0,
          confidence_avg: 1,
          started_at: "2026-01-01T00:00:00.000Z",
          completed_at: "2026-01-01T00:01:00.000Z",
        },
      ])
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
  });

  it("uses canonical operator run detail intelligence when available", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({
      kind: "ok",
      detail: {
        id: "run-1",
        runKind: "recon_job",
        compactProofSummary: {
          delta: { state: "available", reasonCodes: ["history_window_evaluated"] },
          operatorSummary: {
            signal: "strong",
            pattern: "recovering_pattern",
            changedSincePreviousRun: "changed",
            proofPosture: "stronger",
            primaryReasonCodes: ["history_window_evaluated"],
            recurringFamilies: [
              {
                family: "bank_window",
                trend: "strengthening",
                certainty: "high",
                reasonCodes: ["recurring_family_signal_present"],
              },
            ],
            summary: "recovering",
            explainerCodes: ["signal_strong", "pattern_recovering"],
          },
        },
        proofpackIndex: { comparison: { state: "available", reasonCodes: [] } },
      },
    });

    const document = await buildReconciliationExport(
      "11111111-1111-4111-8111-111111111111",
      "run-1"
    );

    expect(document).not.toBeNull();
    expect(document?.historicalIntelligenceContext).toEqual({
      runId: "run-1",
      runKind: "recon_job",
      source: "operator_run_detail",
      reason: null,
    });
    expect(document?.historicalIntelligence.operatorSummary.pattern).toBe("recovering_pattern");
    expect(document?.historicalIntelligence.operatorSummary.explainerCodes).toEqual([
      "signal_strong",
      "pattern_recovering",
    ]);
    expect(document?.exceptionFamilyHighlights).toEqual([
      expect.objectContaining({
        family: "bank_window",
        trend: "strengthening",
      }),
    ]);
  });

  it("preserves explicit fallback reason when canonical detail lookup is unavailable", async () => {
    resolveOperatorRunDetailForTenantsMock.mockResolvedValue({ kind: "not_found" });

    const document = await buildReconciliationExport(
      "11111111-1111-4111-8111-111111111111",
      "run-1"
    );

    expect(document?.historicalIntelligenceContext).toEqual({
      runId: "run-1",
      runKind: "unknown",
      source: "fallback",
      reason: "not_found",
    });
    expect(document?.historicalIntelligence.delta.reasonCodes).toContain(
      "export_run_detail_not_found"
    );
    expect(document?.exceptionFamilyHighlights).toEqual([]);
  });
});
