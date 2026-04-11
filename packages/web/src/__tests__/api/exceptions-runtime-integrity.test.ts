/** @jest-environment node */

const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const getTraceIdMock = jest.fn();
const listReconciliationWorkbenchExceptionsMock = jest.fn();
const getReconciliationWorkbenchExceptionDetailMock = jest.fn();
const resolveExceptionProvenanceRunMock = jest.fn();
const applyReconciliationWorkbenchActionMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/supabase/tenant-membership", () => {
  class TenantMembershipError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    resolveTenantMembershipScope: (...args: unknown[]) => resolveTenantMembershipScopeMock(...args),
    resolveTenantForMutation: (...args: unknown[]) => resolveTenantForMutationMock(...args),
    TenantMembershipError,
  };
});

jest.mock("@/lib/observability/trace", () => ({
  getTraceId: (...args: unknown[]) => getTraceIdMock(...args),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconJob: { findMany: jest.fn().mockResolvedValue([]) },
    reconciliationRun: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

jest.mock("@settler/reconciliation-core", () => {
  const actual = jest.requireActual<typeof import("@settler/reconciliation-core")>(
    "@settler/reconciliation-core"
  );
  return {
    ...actual,
    buildExceptionRunComparisonSnapshotForRunIds: jest.fn(),
  };
});

jest.mock("@/lib/server/exceptions/reconciliation-workbench", () => ({
  listReconciliationWorkbenchExceptions: (...args: unknown[]) =>
    listReconciliationWorkbenchExceptionsMock(...args),
  getReconciliationWorkbenchExceptionDetail: (...args: unknown[]) =>
    getReconciliationWorkbenchExceptionDetailMock(...args),
}));

jest.mock("@/lib/exceptions/resolve-exception-run-context", () => ({
  resolveExceptionProvenanceRun: (...args: unknown[]) => resolveExceptionProvenanceRunMock(...args),
}));

jest.mock("@/lib/server/exceptions/reconciliation-workbench-actions", () => ({
  applyReconciliationWorkbenchAction: (...args: unknown[]) =>
    applyReconciliationWorkbenchActionMock(...args),
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: { error: jest.fn(), info: jest.fn() },
}));

import { GET as getExceptions } from "@/app/api/exceptions/route";
import { GET as getExceptionDetail } from "@/app/api/exceptions/[exceptionId]/route";
import { GET as getExceptionProofpack } from "@/app/api/exceptions/[exceptionId]/proofpack/route";
import { buildExceptionRunComparisonSnapshotForRunIds } from "@settler/reconciliation-core";

function req(url: string) {
  return {
    url,
    nextUrl: new URL(url),
  } as any;
}

const EXCEPTION_ID = "22222222-2222-4222-8222-222222222222";
const RUN_ID = "11111111-1111-4111-8111-111111111111";

describe("exceptions runtime integrity", () => {
  beforeEach(() => {
    resolveTenantMembershipScopeMock.mockReset();
    resolveTenantForMutationMock.mockReset();
    getTraceIdMock.mockReset();
    listReconciliationWorkbenchExceptionsMock.mockReset();
    getReconciliationWorkbenchExceptionDetailMock.mockReset();
    resolveExceptionProvenanceRunMock.mockReset();
    applyReconciliationWorkbenchActionMock.mockReset();
    (buildExceptionRunComparisonSnapshotForRunIds as jest.Mock).mockReset();
    (buildExceptionRunComparisonSnapshotForRunIds as jest.Mock).mockImplementation(
      async (_prisma: unknown, _tenantId: string, runIds: string[]) => {
        const m = new Map<
          string,
          {
            available: boolean;
            state: string;
            certainty: string;
            reasonCodes: string[];
            summary: string;
            baseline: { priorResultId: string | null; priorResultStartedAt: string | null };
            deltas: {
              matched: number | null;
              unmatched: number | null;
              conflicts: number | null;
              proofCompleteness: string;
              recurringFamilyConcentration: string;
            };
            changedSincePreviousRun: string;
          }
        >();
        for (const id of runIds) {
          m.set(id, {
            available: false,
            state: "unavailable",
            certainty: "low",
            reasonCodes: ["baseline_missing"],
            summary: "Run has no persisted result, so prior-run comparison is unavailable.",
            baseline: { priorResultId: null, priorResultStartedAt: null },
            deltas: {
              matched: null,
              unmatched: null,
              conflicts: null,
              proofCompleteness: "unavailable",
              recurringFamilyConcentration: "unavailable",
            },
            changedSincePreviousRun: "unavailable",
          });
        }
        return m;
      }
    );

    resolveTenantMembershipScopeMock.mockResolvedValue({
      tenantIds: ["tenant-a"],
      userId: "user-a",
      supabase: {},
    });
    resolveTenantForMutationMock.mockReturnValue("tenant-a");
    getTraceIdMock.mockResolvedValue("trace-test");
    resolveExceptionProvenanceRunMock.mockResolvedValue({
      id: RUN_ID,
      runKind: "recon_job",
      sourceModel: "recon_jobs",
      name: "Run A",
      normalizedStatus: "completed",
      statusLabel: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:02:00.000Z",
      ingestionId: null,
      reconJobId: RUN_ID,
      href: `/console/runs/${RUN_ID}`,
      recordFound: true,
      latestResultId: "result-a",
      uuidCollision: false,
    });
  });

  test("lists canonical reconciliation exceptions with tenant-scoped run filters", async () => {
    listReconciliationWorkbenchExceptionsMock.mockResolvedValue({
      kind: "ok",
      data: {
        items: [
          {
            id: EXCEPTION_ID,
            type: "amount_mismatch",
            matchType: "unmatched",
            status: "ignored",
            canonicalStatus: "dismissed",
            severity: "high",
            detectedAt: "2026-01-01T00:00:00.000Z",
            description: "Settlement amount mismatch",
            statusDetail: "Ignored after canonical operator review.",
            reasonTags: ["amount_mismatch", "ignored_in_workbench"],
            amount: 11,
            currency: "USD",
            confidenceScore: 0.83,
            sourceTransactionId: "src-1",
            targetTransactionId: "tgt-1",
            runId: RUN_ID,
            assignedTo: "user-a",
            resolutionReason: "ignored_in_workbench",
            compactSummary: {
              recurrence: {
                memoryCount: 1,
                recurringResolutionReason: "ignored_in_workbench",
                state: "ready",
              },
              evidence: {
                total: 1,
                degraded: 0,
                attested: 1,
                state: "ready",
              },
              proof: {
                total: 1,
                finalized: 1,
                bestCompletenessScore: 1,
                missingEvidenceCount: 0,
                state: "ready",
                changedSincePreviousRun: "unavailable",
                changeSummary: "Delta unavailable",
              },
              supportability: {
                degradedReasons: [],
                nextStep: "Proceed with export.",
              },
            },
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      },
    });

    const response = await getExceptions(
      req(
        `http://localhost/api/exceptions?runId=${RUN_ID}&runKind=recon_job&status=ignored&tenant_id=tenant-a`
      )
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.items).toHaveLength(1);
    expect(payload.data).toEqual(payload.items);
    expect(payload.items[0]).toMatchObject({
      id: EXCEPTION_ID,
      status: "ignored",
      runId: RUN_ID,
      compactSummary: expect.objectContaining({
        recurrence: expect.objectContaining({ memoryCount: expect.any(Number) }),
        evidence: expect.objectContaining({ total: expect.any(Number) }),
        proof: expect.objectContaining({ state: expect.any(String) }),
      }),
    });
    expect(listReconciliationWorkbenchExceptionsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: "tenant-a",
        runId: RUN_ID,
        runKind: "recon_job",
        status: "ignored",
      })
    );
  });

  test("returns productized proofpack artifact with explicit completeness and unavailable delta semantics", async () => {
    getReconciliationWorkbenchExceptionDetailMock.mockResolvedValue({
      id: EXCEPTION_ID,
      type: "amount_mismatch",
      matchType: "unmatched",
      status: "resolved",
      canonicalStatus: "resolved",
      severity: "high",
      detectedAt: "2026-01-01T00:00:00.000Z",
      description: "Settlement amount mismatch",
      runId: RUN_ID,
      statusDetail: "Resolved",
      reasonTags: [],
      confidenceScore: 0.92,
      sourceTransactionId: "src-1",
      targetTransactionId: "tgt-1",
      suggestedActions: ["Export proof package."],
      adjudicationMemories: [],
      evidenceSummary: {
        total: 1,
        degraded: 1,
        attested: 0,
        latestCapturedAt: "2026-01-01T00:05:00.000Z",
        items: [
          {
            id: "ev-1",
            artifactType: "operator_annotation",
            artifactKey: "k",
            capturedAt: "2026-01-01T00:05:00.000Z",
            capturedBy: "operator",
            degraded: true,
            degradedReasons: ["source_unavailable"],
            attested: false,
            reliabilityScore: 0.6,
          },
        ],
      },
      proofSummary: {
        total: 1,
        finalized: 0,
        latestCreatedAt: "2026-01-01T00:06:00.000Z",
        items: [
          {
            id: "proof-1",
            packageType: "exception_resolution",
            packageKey: "exception:proof",
            status: "draft",
            completenessScore: 0.5,
            missingEvidence: ["bank_statement"],
            completenessFlags: [],
            evidenceIds: ["ev-1"],
            createdAt: "2026-01-01T00:06:00.000Z",
            finalizedAt: null,
          },
        ],
      },
      operatorSummary: {
        whatHappened: "Resolved with degraded evidence.",
        whyItMatters: "Evidence is not complete.",
        nextStep: "Attach evidence.",
        evidenceState: "degraded",
        proofState: "degraded",
        memoryState: "setup_required",
        evidenceCount: 1,
        attestedEvidenceCount: 0,
        degradedEvidenceCount: 1,
        proofPackageCount: 1,
        finalizedProofPackageCount: 0,
        bestCompletenessScore: 0.5,
        missingEvidenceCount: 1,
        memoryCount: 0,
        recurringResolutionReason: null,
        familyLabel: "Amount Mismatch",
        familyState: "building",
        supportingCaseCount: 0,
        recurrencePosture: "unavailable",
        reopenedCaseCount: 0,
        reopenRate: 0,
        dominantResolutionCode: null,
        latestResolution: null,
      },
      familySummary: {
        state: "building",
        familyCode: "AMOUNT_MISMATCH",
        familyLabel: "Amount Mismatch",
        familyCategory: "amount",
        totalCases: 1,
        totalAdjudications: 0,
        supportingCaseCount: 0,
        resolvedCaseCount: 0,
        unresolvedCaseCount: 1,
        reopenedCaseCount: 0,
        reopenRate: 0,
        recurrencePosture: "unavailable",
        dominantResolutionCode: null,
        dominantResolutionReason: null,
        dominantResolutionShare: null,
        firstSeenAt: null,
        lastSeenAt: null,
        avgConfidence: null,
        avgSourceTrustScore: null,
        reasonCodes: ["family_history_building"],
        summary: "Amount Mismatch is still building family memory.",
        nextStep: "Attach evidence.",
      },
    });

    const response = await getExceptionProofpack(
      req(`http://localhost/api/exceptions/${EXCEPTION_ID}/proofpack`),
      { params: Promise.resolve({ exceptionId: EXCEPTION_ID }) } as any
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.artifact.schemaVersion).toBe("proofpack.exception.v3");
    expect(payload.artifact.completeness.isExportReady).toBe(false);
    expect(payload.artifact.changeSincePreviousRun.available).toBe(false);
    expect(payload.artifact.changeSincePreviousRun.state).toBe("unavailable");
    expect(payload.artifact.completeness.degradedEvidenceReasons).toContain("source_unavailable");
    expect(payload.artifact.familySummary).toMatchObject({
      familyCode: "AMOUNT_MISMATCH",
      state: "building",
    });
    expect(payload.artifact.recurringContext.familySummary).toMatchObject({
      familyCode: "AMOUNT_MISMATCH",
      state: "building",
    });
  });

  test("returns 404 when a requested run scope does not exist", async () => {
    listReconciliationWorkbenchExceptionsMock.mockResolvedValue({
      kind: "not_found",
      requestedRunId: RUN_ID,
    });

    const response = await getExceptions(req(`http://localhost/api/exceptions?runId=${RUN_ID}`));

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toBe("Run not found");
  });

  test("returns 409 for ambiguous run UUID collisions", async () => {
    listReconciliationWorkbenchExceptionsMock.mockResolvedValue({
      kind: "ambiguous_uuid_collision",
      requestedRunId: RUN_ID,
      jobId: RUN_ID,
      ingestionRunId: RUN_ID,
    });

    const response = await getExceptions(req(`http://localhost/api/exceptions?runId=${RUN_ID}`));

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.code).toBe("RUN_ID_COLLISION");
  });

  test("returns canonical exception detail with durable memory, evidence, and proof summaries", async () => {
    getReconciliationWorkbenchExceptionDetailMock.mockResolvedValue({
      id: EXCEPTION_ID,
      type: "amount_mismatch",
      matchType: "unmatched",
      status: "resolved",
      canonicalStatus: "resolved",
      severity: "high",
      detectedAt: "2026-01-01T00:00:00.000Z",
      description: "Settlement amount mismatch",
      statusDetail: "Resolved with persisted adjudication memory.",
      reasonTags: ["amount_mismatch", "manual_resolution_without_counterpart"],
      amount: 11,
      currency: "USD",
      confidenceScore: 0.91,
      sourceTransactionId: "src-1",
      targetTransactionId: "tgt-1",
      runId: RUN_ID,
      assignedTo: "user-a",
      resolutionReason: "resolved_in_workbench",
      notes: "Reviewed with bank evidence.",
      sourceSystem: "stripe",
      targetSystem: "netsuite",
      runMetadata: { ingestionId: "ing-a" },
      expectedValue: { amount: 11 },
      actualValue: { amount: 11, amountDiff: 0 },
      resolution: "Reviewed with bank evidence.",
      resolvedAt: "2026-01-01T00:05:00.000Z",
      ignoredAt: null,
      ignoredBy: null,
      suggestedActions: ["Review the recorded proof package before exporting."],
      playbookApplied: "Amount tolerance review",
      operatorNotes: "Reviewed with bank evidence.",
      sourceTrustScore: 0.9,
      topArchetype: {
        id: "arch-1",
        code: "amount_mismatch",
        label: "Amount mismatch",
        confidence: 0.88,
        category: "settlement",
      },
      adjudicationMemories: [
        {
          id: "mem-1",
          resolution: "manual",
          resolutionReason: "resolved_in_workbench",
          resolutionCode: "MANUAL_REVIEW_CONFIRMED",
          adjudicationType: "initial",
          adjudicatorId: "user-a",
          adjudicatorType: "operator",
          outcome: "resolved",
          confidence: 0.91,
          sourceTrustScore: 0.9,
          operatorNotes: "Reviewed with bank evidence.",
          systemNotes: "Decision recorded from canonical operator workbench.",
          evidenceIds: ["ev-1", "ev-2"],
          createdAt: "2026-01-01T00:05:00.000Z",
          completedAt: "2026-01-01T00:05:00.000Z",
          parentMemoryId: null,
        },
      ],
      evidenceSummary: {
        total: 2,
        degraded: 0,
        attested: 1,
        latestCapturedAt: "2026-01-01T00:05:00.000Z",
        items: [
          {
            id: "ev-1",
            artifactType: "operator_annotation",
            artifactKey: "exception:key",
            capturedAt: "2026-01-01T00:05:00.000Z",
            capturedBy: "operator",
            degraded: false,
            degradedReasons: [],
            attested: true,
            reliabilityScore: 0.95,
          },
        ],
      },
      proofSummary: {
        total: 1,
        finalized: 1,
        latestCreatedAt: "2026-01-01T00:05:01.000Z",
        items: [
          {
            id: "proof-1",
            packageType: "exception_resolution",
            packageKey: "exception:proof",
            status: "finalized",
            completenessScore: 0.9,
            missingEvidence: [],
            completenessFlags: [],
            evidenceIds: ["ev-1", "ev-2"],
            createdAt: "2026-01-01T00:05:01.000Z",
            finalizedAt: "2026-01-01T00:05:02.000Z",
          },
        ],
      },
      operatorSummary: {
        whatHappened: "HIGH exception resolved: Settlement amount mismatch",
        whyItMatters:
          "Amount mismatch already has 2 prior cases of operator memory. Dominant path: duplicate record confirmed.",
        nextStep:
          "Review reopened or inconsistent cases before reusing the dominant resolution path for this family.",
        evidenceState: "degraded",
        proofState: "ready",
        memoryState: "ready",
        evidenceCount: 2,
        attestedEvidenceCount: 1,
        degradedEvidenceCount: 0,
        proofPackageCount: 1,
        finalizedProofPackageCount: 1,
        bestCompletenessScore: 0.9,
        missingEvidenceCount: 0,
        memoryCount: 2,
        recurringResolutionReason: "duplicate record confirmed",
        familyLabel: "Amount mismatch",
        familyState: "available",
        supportingCaseCount: 2,
        recurrencePosture: "stable",
        reopenedCaseCount: 0,
        reopenRate: 0,
        dominantResolutionCode: "DUPLICATE_RECORD_CONFIRMED",
        latestResolution: {
          outcome: "resolved",
          reason: "resolved_in_workbench",
          completedAt: "2026-01-01T00:05:00.000Z",
        },
      },
      familySummary: {
        state: "available",
        familyCode: "AMOUNT_MISMATCH",
        familyLabel: "Amount mismatch",
        familyCategory: "settlement",
        totalCases: 3,
        totalAdjudications: 3,
        supportingCaseCount: 2,
        resolvedCaseCount: 3,
        unresolvedCaseCount: 0,
        reopenedCaseCount: 0,
        reopenRate: 0,
        recurrencePosture: "stable",
        dominantResolutionCode: "DUPLICATE_RECORD_CONFIRMED",
        dominantResolutionReason: "duplicate record confirmed",
        dominantResolutionShare: 0.66,
        firstSeenAt: "2025-12-01T00:00:00.000Z",
        lastSeenAt: "2026-01-01T00:05:00.000Z",
        avgConfidence: 0.91,
        avgSourceTrustScore: 0.9,
        reasonCodes: [],
        summary: "Amount mismatch has appeared in 3 cases with 2 prior supporting cases.",
        nextStep:
          "Review reopened or inconsistent cases before reusing the dominant resolution path for this family.",
      },
      auditTrail: [
        {
          timestamp: "2026-01-01T00:00:00.000Z",
          action: "Detected",
          user: "system",
        },
      ],
    });

    const response = await getExceptionDetail(
      req(`http://localhost/api/exceptions/${EXCEPTION_ID}`),
      {
        params: Promise.resolve({ exceptionId: EXCEPTION_ID }),
      } as any
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.id).toBe(EXCEPTION_ID);
    expect(payload.exception.id).toBe(EXCEPTION_ID);
    expect(payload.provenance.run).toMatchObject({
      id: RUN_ID,
      runKind: "recon_job",
      recordFound: true,
    });
    expect(payload.adjudicationMemories).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "mem-1" })])
    );
    expect(payload.operatorSummary).toMatchObject({
      familyLabel: "Amount mismatch",
      supportingCaseCount: 2,
    });
    expect(payload.familySummary).toMatchObject({
      familyCode: "AMOUNT_MISMATCH",
      state: "available",
    });
    expect(payload.evidenceSummary.total).toBe(2);
    expect(payload.proofSummary.finalized).toBe(1);
    expect(payload.trace_id).toBe("trace-test");
  });

  test("returns 404 when the canonical exception detail read model has no row", async () => {
    getReconciliationWorkbenchExceptionDetailMock.mockResolvedValue(null);

    const response = await getExceptionDetail(
      req(`http://localhost/api/exceptions/${EXCEPTION_ID}`),
      {
        params: Promise.resolve({ exceptionId: EXCEPTION_ID }),
      } as any
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toBe("Exception not found");
  });

  test("returns 400 for invalid exception UUIDs", async () => {
    const response = await getExceptionDetail(req("http://localhost/api/exceptions/not-a-uuid"), {
      params: Promise.resolve({ exceptionId: "not-a-uuid" }),
    } as any);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Invalid exception ID");
  });
});
