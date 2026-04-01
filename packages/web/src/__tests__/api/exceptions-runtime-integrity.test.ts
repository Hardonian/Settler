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
  prisma: {},
}));

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
