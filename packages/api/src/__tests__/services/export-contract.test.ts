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
      recurringFamilies: [],
      summary: "stable",
    },
  }),
  unavailableRunProofpackIndex: (reasonCode: string) => ({
    comparison: { state: "unavailable", reasonCodes: [reasonCode] },
  }),
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
            recurringFamilies: [],
            summary: "recovering",
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
  });
});
