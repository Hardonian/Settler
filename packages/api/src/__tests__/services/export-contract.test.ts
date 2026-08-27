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
  buildRunInstitutionalMemorySummary: ({ runKind, summaryResolution }: any) => ({
    state: runKind === "unknown" ? "unavailable" : "ready",
    summary: "Institutional memory summary",
    reasonCodes: summaryResolution.compactProofSummary.delta.reasonCodes,
    provenance: {
      runKind,
      source: summaryResolution.source,
      fallbackReasonCode: summaryResolution.fallbackReasonCode,
      memorySource: "exception_adjudication_memory",
      proofSource: "proof_packages",
      deltaSource: runKind === "recon_job" ? "recon_results" : "unavailable",
    },
    memory: {
      source: "exception_adjudication_memory",
      state: summaryResolution.compactProofSummary.recurrence.state,
      exceptionsWithMemories:
        summaryResolution.compactProofSummary.recurrence.exceptionsWithMemories,
      repeatedResolutionReasons:
        summaryResolution.compactProofSummary.recurrence.repeatedResolutionReasons,
      recurringFamilies: summaryResolution.compactProofSummary.operatorSummary.recurringFamilies,
    },
    proof: {
      source: "proof_packages",
      ...summaryResolution.compactProofSummary.proofPackages,
    },
    deltaBasis: {
      source: runKind === "recon_job" ? "recon_results" : "unavailable",
      ...summaryResolution.compactProofSummary.delta,
    },
  }),
  canonicalMissingProofpackReasonForRunKind: (runKind: string) =>
    runKind === "ingestion_run" ? "ingestion_run_history_not_comparable" : "run_proofpack_missing",
  resolveOperatorRunDetailForTenants: (...args: unknown[]) =>
    resolveOperatorRunDetailForTenantsMock(...args),
  toRunCompactProofSummary: (index: any) => ({
    proofPackages: {
      total: 1,
      finalized: 1,
      bestCompletenessScore: 0.95,
      missingEvidenceCount: 0,
      latestCreatedAt: "2026-01-01T00:05:00.000Z",
      state: "ready",
      degradedEvidenceReasons: [],
    },
    recurrence: {
      exceptionsWithMemories: 2,
      repeatedResolutionReasons: ["bank_window"],
      state: "ready",
      topRecurringFamilies: [
        {
          family: "bank_window",
          trend: "strengthening",
          certainty: "high",
          reasonCodes: ["recurring_family_signal_present"],
        },
      ],
    },
    delta: {
      state: index.comparison.state,
      reasonCodes: index.comparison.reasonCodes,
      baseline: {
        priorResultId: index.comparison.priorResultId ?? "result-1",
        priorResultStartedAt: index.comparison.priorResultStartedAt ?? "2025-12-31T00:00:00.000Z",
      },
      history: {
        lookbackWindow: 2,
        comparableWindowCount: 2,
        certainty: "high",
        trend: "improving",
        pattern: "recovering_pattern",
        reasonCodes: ["history_window_evaluated"],
        summary: "Recovering",
      },
      deltas: {
        matched: 2,
        unmatched: -1,
        conflicts: 0,
        proofCompleteness: "improved",
        recurringFamilyConcentration: "stronger",
      },
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
          proofPackages: {
            total: 1,
            finalized: 1,
            bestCompletenessScore: 0.95,
            missingEvidenceCount: 0,
            latestCreatedAt: "2026-01-01T00:05:00.000Z",
            state: "ready",
            degradedEvidenceReasons: [],
          },
          recurrence: {
            exceptionsWithMemories: 2,
            repeatedResolutionReasons: ["bank_window"],
            state: "ready",
            topRecurringFamilies: [
              {
                family: "bank_window",
                trend: "strengthening",
                certainty: "high",
                reasonCodes: ["recurring_family_signal_present"],
              },
            ],
          },
          delta: {
            state: input.proofpackIndex.comparison.state,
            reasonCodes: input.proofpackIndex.comparison.reasonCodes,
            baseline: {
              priorResultId: "result-1",
              priorResultStartedAt: "2025-12-31T00:00:00.000Z",
            },
            history: {
              lookbackWindow: 2,
              comparableWindowCount: 2,
              certainty: "high",
              trend: "improving",
              pattern: "recovering_pattern",
              reasonCodes: ["history_window_evaluated"],
              summary: "Recovering",
            },
            deltas: {
              matched: 2,
              unmatched: -1,
              conflicts: 0,
              proofCompleteness: "improved",
              recurringFamilyConcentration: "stronger",
            },
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
        proofPackages: {
          total: 0,
          finalized: 0,
          bestCompletenessScore: null,
          missingEvidenceCount: 0,
          latestCreatedAt: null,
          state: "unavailable",
          degradedEvidenceReasons: [reasonCode],
        },
        recurrence: {
          exceptionsWithMemories: 0,
          repeatedResolutionReasons: [],
          state: "unavailable",
          topRecurringFamilies: [],
        },
        delta: {
          state: "unavailable",
          reasonCodes: [reasonCode],
          baseline: {
            priorResultId: null,
            priorResultStartedAt: null,
          },
          history: {
            lookbackWindow: 0,
            comparableWindowCount: 0,
            certainty: "low",
            trend: "unavailable",
            pattern: "unavailable",
            reasonCodes: [reasonCode],
            summary: "Unavailable",
          },
          deltas: {
            matched: null,
            unmatched: null,
            conflicts: null,
            proofCompleteness: "unavailable",
            recurringFamilyConcentration: "unavailable",
          },
        },
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
          proofPackages: {
            total: 1,
            finalized: 1,
            bestCompletenessScore: 1,
            missingEvidenceCount: 0,
            latestCreatedAt: "2026-01-01T00:05:00.000Z",
            state: "ready",
            degradedEvidenceReasons: [],
          },
          recurrence: {
            exceptionsWithMemories: 2,
            repeatedResolutionReasons: ["bank_window"],
            state: "ready",
            topRecurringFamilies: [
              {
                family: "bank_window",
                trend: "strengthening",
                certainty: "high",
                reasonCodes: ["recurring_family_signal_present"],
              },
            ],
          },
          delta: {
            state: "available",
            reasonCodes: ["history_window_evaluated"],
            baseline: {
              priorResultId: "result-1",
              priorResultStartedAt: "2025-12-31T00:00:00.000Z",
            },
            history: {
              lookbackWindow: 2,
              comparableWindowCount: 2,
              certainty: "high",
              trend: "improving",
              pattern: "recovering_pattern",
              reasonCodes: ["history_window_evaluated"],
              summary: "Recovering",
            },
            deltas: {
              matched: 2,
              unmatched: -1,
              conflicts: 0,
              proofCompleteness: "improved",
              recurringFamilyConcentration: "stronger",
            },
          },
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
    expect(document?.schemaVersion).toBe("1.1.0");
    expect(document?.historicalIntelligenceContext).toEqual({
      runId: "run-1",
      runKind: "recon_job",
      source: "operator_run_detail",
      reason: null,
    });
    expect(document?.historicalIntelligence).toMatchObject({
      proofPackages: {
        state: "ready",
      },
      recurrence: {
        exceptionsWithMemories: 2,
        repeatedResolutionReasons: ["bank_window"],
      },
      delta: {
        state: "available",
        reasonCodes: ["history_window_evaluated"],
      },
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
    expect(document?.historicalIntelligence).toMatchObject({
      proofPackages: {
        state: "unavailable",
      },
      delta: {
        state: "unavailable",
        reasonCodes: ["export_run_detail_not_found"],
      },
    });
    expect(document?.historicalIntelligence.delta.reasonCodes).toContain(
      "export_run_detail_not_found"
    );
    expect(document?.exceptionFamilyHighlights).toEqual([]);
  });
});
