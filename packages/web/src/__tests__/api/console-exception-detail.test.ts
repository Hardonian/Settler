/** @jest-environment node */

const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const getTraceIdMock = jest.fn();
const getReconciliationWorkbenchExceptionDetailMock = jest.fn();
const applyReconciliationWorkbenchActionMock = jest.fn();
const resolveExceptionProvenanceRunMock = jest.fn();

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
  getReconciliationWorkbenchExceptionDetail: (...args: unknown[]) =>
    getReconciliationWorkbenchExceptionDetailMock(...args),
}));

jest.mock("@/lib/server/exceptions/reconciliation-workbench-actions", () => ({
  applyReconciliationWorkbenchAction: (...args: unknown[]) =>
    applyReconciliationWorkbenchActionMock(...args),
}));

jest.mock("@/lib/exceptions/resolve-exception-run-context", () => ({
  resolveExceptionProvenanceRun: (...args: unknown[]) => resolveExceptionProvenanceRunMock(...args),
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: { error: jest.fn(), info: jest.fn() },
}));

import { GET, POST } from "@/app/api/exceptions/[exceptionId]/route";

const EXCEPTION_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TENANT_UUID = "11111111-2222-4333-8444-555555555555";
const RUN_UUID = "66666666-7777-4888-8999-aaaaaaaaaaaa";

function makeRequest(exceptionId: string, searchParams: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/exceptions/${exceptionId}`);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return {
    url: url.toString(),
    nextUrl: url,
  } as unknown as import("next/server").NextRequest;
}

function makePostRequest(exceptionId: string, action: string, body: Record<string, unknown> = {}) {
  const url = new URL(`http://localhost/api/exceptions/${exceptionId}?action=${action}`);
  return {
    url: url.toString(),
    nextUrl: url,
    json: () => Promise.resolve(body),
  } as unknown as import("next/server").NextRequest;
}

function makeParams(exceptionId: string) {
  return { params: Promise.resolve({ exceptionId }) };
}

beforeEach(() => {
  resolveTenantMembershipScopeMock.mockReset();
  resolveTenantForMutationMock.mockReset();
  getTraceIdMock.mockReset();
  getReconciliationWorkbenchExceptionDetailMock.mockReset();
  applyReconciliationWorkbenchActionMock.mockReset();
  resolveExceptionProvenanceRunMock.mockReset();

  resolveTenantMembershipScopeMock.mockResolvedValue({
    tenantIds: [TENANT_UUID],
    userId: "user-test",
    supabase: {},
  });
  resolveTenantForMutationMock.mockReturnValue(TENANT_UUID);
  getTraceIdMock.mockResolvedValue("trace-test-001");
  resolveExceptionProvenanceRunMock.mockResolvedValue({
    id: RUN_UUID,
    runKind: "ingestion_run",
    sourceModel: "reconciliation_runs",
    name: "Canonical run",
    normalizedStatus: "completed",
    statusLabel: "Completed",
    createdAt: "2026-02-01T08:00:00.000Z",
    startedAt: "2026-02-01T08:05:00.000Z",
    completedAt: "2026-02-01T08:10:00.000Z",
    ingestionId: "99999999-aaaa-4bbb-8ccc-dddddddddddd",
    reconJobId: null,
    href: `/console/runs/${RUN_UUID}`,
    recordFound: true,
    latestResultId: null,
    uuidCollision: false,
  });
});

describe("GET /api/exceptions/[exceptionId]", () => {
  test("returns 400 for an invalid UUID", async () => {
    const res = await GET(makeRequest("not-a-uuid"), makeParams("not-a-uuid") as any);

    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.error).toBe("Invalid exception ID");
  });

  test("queries the canonical detail read model with exact tenant scope", async () => {
    getReconciliationWorkbenchExceptionDetailMock.mockResolvedValue({
      id: EXCEPTION_UUID,
      type: "amount_mismatch",
      matchType: "unmatched",
      status: "pending",
      canonicalStatus: "open",
      severity: "high",
      detectedAt: "2026-02-01T09:00:00.000Z",
      description: "Amount mismatch exception",
      statusDetail: "Awaiting operator review.",
      reasonTags: ["amount_mismatch"],
      amount: 500,
      currency: "USD",
      confidenceScore: 0.92,
      sourceTransactionId: "txn_src_999",
      targetTransactionId: "txn_tgt_888",
      runId: RUN_UUID,
      assignedTo: null,
      resolutionReason: null,
      notes: null,
      sourceSystem: "stripe",
      targetSystem: "netsuite",
      runMetadata: { ingestionId: "ing-1" },
      expectedValue: { amount: 500 },
      actualValue: { amount: 510 },
      resolution: null,
      resolvedAt: null,
      ignoredAt: null,
      ignoredBy: null,
      suggestedActions: ["Review the source and target records side by side."],
      playbookApplied: "Amount mismatch",
      operatorNotes: null,
      sourceTrustScore: null,
      topArchetype: null,
      adjudicationMemories: [],
      evidenceSummary: {
        total: 0,
        degraded: 0,
        attested: 0,
        latestCapturedAt: null,
        items: [],
      },
      proofSummary: {
        total: 0,
        finalized: 0,
        latestCreatedAt: null,
        items: [],
      },
      operatorSummary: {
        whatHappened: "HIGH exception is awaiting operator review: Amount mismatch exception",
        whyItMatters:
          "No supporting evidence is attached yet, so this exception still depends on operator judgment rather than reusable proof.",
        nextStep: "Review the source and target records side by side.",
        evidenceState: "setup_required",
        proofState: "setup_required",
        memoryState: "setup_required",
        evidenceCount: 0,
        attestedEvidenceCount: 0,
        degradedEvidenceCount: 0,
        proofPackageCount: 0,
        finalizedProofPackageCount: 0,
        bestCompletenessScore: null,
        missingEvidenceCount: 0,
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
        nextStep:
          "Capture a few explicit adjudications before treating this exception family as reusable operator memory.",
      },
      auditTrail: [
        {
          timestamp: "2026-02-01T09:00:00.000Z",
          action: "Detected",
          user: "system",
        },
      ],
    });

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(getReconciliationWorkbenchExceptionDetailMock).toHaveBeenCalledWith(
      expect.anything(),
      TENANT_UUID,
      EXCEPTION_UUID
    );
    expect(payload.provenance).toMatchObject({
      runId: RUN_UUID,
      run: expect.objectContaining({
        id: RUN_UUID,
        runKind: "ingestion_run",
        recordFound: true,
      }),
      fieldPath: null,
      ruleId: null,
      detectorId: null,
      sourceAdapter: "stripe",
      targetAdapter: "netsuite",
      sourceTransactionId: "txn_src_999",
      targetTransactionId: "txn_tgt_888",
      confidenceScore: 0.92,
      rationale_codes: ["amount_mismatch"],
    });
    expect(payload.exception.auditTrail).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "Detected", user: "system" })])
    );
    expect(payload.exception.operatorSummary).toMatchObject({
      familyLabel: "Amount Mismatch",
      familyState: "building",
    });
    expect(payload.exception.familySummary).toMatchObject({
      familyCode: "AMOUNT_MISMATCH",
      state: "building",
    });
    expect(payload.trace_id).toBe("trace-test-001");
  });

  test("returns 404 when exception does not exist", async () => {
    getReconciliationWorkbenchExceptionDetailMock.mockResolvedValue(null);

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);

    expect(res.status).toBe(404);
    const payload = await res.json();
    expect(payload.error).toBe("Exception not found");
  });
});

describe("POST /api/exceptions/[exceptionId] — actions", () => {
  test("returns 400 for missing or invalid action param", async () => {
    const url = new URL(`http://localhost/api/exceptions/${EXCEPTION_UUID}`);
    const req = {
      url: url.toString(),
      nextUrl: url,
      json: () => Promise.resolve({}),
    } as unknown as import("next/server").NextRequest;

    const res = await POST(req, makeParams(EXCEPTION_UUID) as any);

    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toMatch(/action/i);
  });

  test("resolve action delegates to the canonical workbench action service with notes", async () => {
    applyReconciliationWorkbenchActionMock.mockResolvedValue({
      success: true,
      exceptionId: EXCEPTION_UUID,
      status: "resolved",
      outcome: "resolved",
      message: "Exception resolved.",
    });

    const res = await POST(
      makePostRequest(EXCEPTION_UUID, "resolve", { notes: "Verified against source evidence." }),
      makeParams(EXCEPTION_UUID) as any
    );

    expect(res.status).toBe(200);
    expect(applyReconciliationWorkbenchActionMock).toHaveBeenCalledWith(expect.anything(), {
      tenantId: TENANT_UUID,
      userId: "user-test",
      exceptionId: EXCEPTION_UUID,
      action: "resolve",
      notes: "Verified against source evidence.",
    });
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(payload.data.outcome).toBe("resolved");
  });

  test("returns 404 when the canonical mutation path cannot find the exception", async () => {
    applyReconciliationWorkbenchActionMock.mockRejectedValue(
      Object.assign(new Error("Exception not found"), { status: 404 })
    );

    const res = await POST(
      makePostRequest(EXCEPTION_UUID, "ignore"),
      makeParams(EXCEPTION_UUID) as any
    );

    expect(res.status).toBe(404);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Exception not found");
  });
});
