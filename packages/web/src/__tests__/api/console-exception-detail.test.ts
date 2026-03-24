/** @jest-environment node */

/**
 * Console exception detail API tests.
 *
 * Verifies:
 * - GET returns expected shape including structured provenance block
 * - 404 returned when exception does not exist
 * - 400 returned for invalid UUID
 * - Provenance fields extracted from metadata (ruleId, detectorId, ingestionId, matchReason)
 * - Missing provenance fields returned as null, not fabricated
 * - Status derivation: pending / investigating / resolved / ignored
 * - No list-filter anti-pattern (findFirst with exact ID + tenant scope, not findMany + filter)
 * - rationale_codes extracted and filtered to string values
 * - confidenceScore resolved from driftMetrics then metadata fallback
 * - POST resolve/ignore/reopen actions return success and call correct mutation
 */

import { GET, POST } from "@/app/api/exceptions/[exceptionId]/route";

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const resolveTenantMembershipScopeMock = jest.fn();
const resolveTenantForMutationMock = jest.fn();
const getTraceIdMock = jest.fn();
const driftEventFindFirstMock = jest.fn();
const driftEventUpdateMock = jest.fn();

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
    driftEvent: {
      findFirst: (...args: unknown[]) => driftEventFindFirstMock(...args),
      update: (...args: unknown[]) => driftEventUpdateMock(...args),
    },
  },
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: { error: jest.fn(), info: jest.fn() },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

const EXCEPTION_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TENANT_UUID = "11111111-2222-4333-8444-555555555555";
const RUN_UUID = "66666666-7777-4888-8999-aaaaaaaaaaaa";

function makeRequest(exceptionId: string, searchParams: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/exceptions/${exceptionId}`);
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
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

function makeException(overrides: Record<string, unknown> = {}) {
  return {
    id: EXCEPTION_UUID,
    tenantId: TENANT_UUID,
    driftType: "amount_mismatch",
    severity: "high",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    createdAt: new Date("2026-02-01T09:00:00.000Z"),
    updatedAt: new Date("2026-02-01T09:00:00.000Z"),
    reconJobId: RUN_UUID,
    fieldPath: "amount",
    expectedValue: "500.00",
    actualValue: "510.00",
    driftMetrics: null,
    metadata: {},
    ...overrides,
  };
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  resolveTenantMembershipScopeMock.mockReset();
  resolveTenantForMutationMock.mockReset();
  getTraceIdMock.mockReset();
  driftEventFindFirstMock.mockReset();
  driftEventUpdateMock.mockReset();

  resolveTenantMembershipScopeMock.mockResolvedValue({
    tenantIds: [TENANT_UUID],
    userId: "user-test",
    supabase: {},
  });
  resolveTenantForMutationMock.mockReturnValue(TENANT_UUID);
  getTraceIdMock.mockResolvedValue("trace-test-001");
});

// ─── GET tests ────────────────────────────────────────────────────────────────

describe("GET /api/exceptions/[exceptionId]", () => {
  // ── Validation ──────────────────────────────────────────────────────────────

  test("returns 400 for an invalid UUID", async () => {
    const res = await GET(makeRequest("not-a-uuid"), makeParams("not-a-uuid") as any);

    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.error).toBe("Invalid exception ID");
  });

  // ── Not found ───────────────────────────────────────────────────────────────

  test("returns 404 when exception does not exist", async () => {
    driftEventFindFirstMock.mockResolvedValue(null);

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);

    expect(res.status).toBe(404);
    const payload = await res.json();
    expect(payload.error).toBe("Exception not found");
  });

  // ── No list-filter anti-pattern ─────────────────────────────────────────────

  test("queries with exact ID + tenantId via findFirst — not a list scan", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException());

    await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);

    expect(driftEventFindFirstMock).toHaveBeenCalledTimes(1);
    const callArg = driftEventFindFirstMock.mock.calls[0]?.[0];
    expect(callArg?.where?.id).toBe(EXCEPTION_UUID);
    expect(callArg?.where?.tenantId).toBe(TENANT_UUID);
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  test("returns 200 with core fields for a valid exception", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException());

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);

    expect(res.status).toBe(200);
    const payload = await res.json();

    expect(payload.id).toBe(EXCEPTION_UUID);
    expect(payload.type).toBe("amount_mismatch");
    expect(payload.severity).toBe("high");
    expect(payload.status).toBe("pending");
    expect(payload.runId).toBe(RUN_UUID);
    expect(payload.trace_id).toBe("trace-test-001");
  });

  // ── Provenance block present ─────────────────────────────────────────────────

  test("returns a provenance block with all fields declared", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException());

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance).toBeDefined();
    expect(payload.provenance.runId).toBe(RUN_UUID);
    expect(payload.provenance.fieldPath).toBe("amount");
    // These are null when absent — not fabricated
    expect(payload.provenance.ruleId).toBeNull();
    expect(payload.provenance.detectorId).toBeNull();
    expect(payload.provenance.ingestionId).toBeNull();
    expect(payload.provenance.matchReason).toBeNull();
    expect(payload.provenance.sourceAdapter).toBeNull();
    expect(payload.provenance.targetAdapter).toBeNull();
    expect(payload.provenance.sourceTransactionId).toBeNull();
    expect(payload.provenance.targetTransactionId).toBeNull();
    expect(payload.provenance.confidenceScore).toBeNull();
    expect(payload.provenance.rationale_codes).toBeNull();
  });

  // ── Provenance extraction from metadata ──────────────────────────────────────

  test("extracts ruleId and detectorId from metadata (camelCase)", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        metadata: {
          ruleId: "rule_amount_tolerance_v3",
          detectorId: "detector_007",
          ingestionId: "ing_abc123",
          matchReason: "Amount within 2% tolerance threshold",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
          sourceTransactionId: "txn_src_999",
          targetTransactionId: "txn_tgt_888",
        },
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.ruleId).toBe("rule_amount_tolerance_v3");
    expect(payload.provenance.detectorId).toBe("detector_007");
    expect(payload.provenance.ingestionId).toBe("ing_abc123");
    expect(payload.provenance.matchReason).toBe("Amount within 2% tolerance threshold");
    expect(payload.provenance.sourceAdapter).toBe("stripe");
    expect(payload.provenance.targetAdapter).toBe("netsuite");
    expect(payload.provenance.sourceTransactionId).toBe("txn_src_999");
    expect(payload.provenance.targetTransactionId).toBe("txn_tgt_888");
  });

  test("extracts ruleId from snake_case fallback (rule_id)", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        metadata: {
          rule_id: "rule_snake_case",
          detector_id: "det_snake_case",
        },
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.ruleId).toBe("rule_snake_case");
    expect(payload.provenance.detectorId).toBe("det_snake_case");
  });

  test("extracts matchReason from driftMetrics when not in metadata", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        driftMetrics: { matchReason: "Reason from metrics", confidenceScore: 0.92 },
        metadata: {},
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.matchReason).toBe("Reason from metrics");
    expect(payload.provenance.confidenceScore).toBeCloseTo(0.92);
  });

  test("extracts confidenceScore from metadata as fallback", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        driftMetrics: null,
        metadata: { confidenceScore: 0.75 },
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.confidenceScore).toBeCloseTo(0.75);
  });

  test("extracts rationale_codes as string array, filtering non-strings", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        metadata: { rationale_codes: ["tolerance_breach", "manual_flag", 42, null, "confirmed"] },
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.rationale_codes).toEqual([
      "tolerance_breach",
      "manual_flag",
      "confirmed",
    ]);
  });

  test("returns rationale_codes as null when absent", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException({ metadata: {} }));

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.rationale_codes).toBeNull();
  });

  // ── Status derivation ────────────────────────────────────────────────────────

  test("derives status=pending when acknowledged=false and no resolution", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException({ acknowledged: false, metadata: {} }));

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.status).toBe("pending");
    expect(payload.exception.status).toBe("pending");
  });

  test("derives status=investigating when acknowledged=true and no resolution", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        acknowledgedBy: "user-x",
        acknowledgedAt: new Date("2026-02-01T10:00:00.000Z"),
        metadata: {},
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.status).toBe("investigating");
  });

  test("derives status=resolved when metadata.resolution.status=resolved", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        metadata: {
          resolution: {
            status: "resolved",
            resolvedBy: "user-x",
            resolvedAt: "2026-02-01T11:00:00.000Z",
          },
        },
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.status).toBe("resolved");
  });

  test("derives status=ignored when metadata.resolution.status=ignored", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        metadata: {
          resolution: {
            status: "ignored",
            ignoredBy: "user-y",
            ignoredAt: "2026-02-01T11:30:00.000Z",
          },
        },
      })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.status).toBe("ignored");
  });

  // ── Graceful missing data ────────────────────────────────────────────────────

  test("handles null reconJobId — provenance.runId=null, not fabricated", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({ reconJobId: null, fieldPath: null, metadata: {}, driftMetrics: null })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.provenance.runId).toBeNull();
    expect(payload.provenance.fieldPath).toBeNull();
    expect(payload.runId).toBeNull();
  });

  test("handles null expectedValue and actualValue without throwing", async () => {
    driftEventFindFirstMock.mockResolvedValue(
      makeException({ expectedValue: null, actualValue: null })
    );

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.expectedValue).toBeNull();
    expect(payload.actualValue).toBeNull();
  });

  test("falls back severity=low when severity is null", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException({ severity: null }));

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.severity).toBe("low");
  });

  test("falls back type=unknown when driftType is null", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException({ driftType: null }));

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.type).toBe("unknown");
  });

  // ── Audit trail ─────────────────────────────────────────────────────────────

  test("includes audit trail with system Detected entry", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException());

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    expect(payload.exception.auditTrail).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "Detected", user: "system" })])
    );
  });

  // ── Both response shapes preserved for backward compat ──────────────────────

  test("returns both top-level and exception-nested shapes", async () => {
    driftEventFindFirstMock.mockResolvedValue(makeException());

    const res = await GET(makeRequest(EXCEPTION_UUID), makeParams(EXCEPTION_UUID) as any);
    const payload = await res.json();

    // Top-level fields (used by some clients)
    expect(payload.id).toBe(EXCEPTION_UUID);
    expect(payload.status).toBeDefined();
    // Nested exception object
    expect(payload.exception).toBeDefined();
    expect(payload.exception.id).toBe(EXCEPTION_UUID);
    // Provenance at top level
    expect(payload.provenance).toBeDefined();
  });
});

// ─── POST action tests ────────────────────────────────────────────────────────

describe("POST /api/exceptions/[exceptionId] — actions", () => {
  beforeEach(() => {
    // For mutations, findFirst is called first (ownership check), then update
    driftEventFindFirstMock.mockResolvedValue(makeException());
    driftEventUpdateMock.mockResolvedValue({ id: EXCEPTION_UUID });
  });

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

  test("resolve action marks exception acknowledged with resolution.status=resolved", async () => {
    const res = await POST(
      makePostRequest(EXCEPTION_UUID, "resolve"),
      makeParams(EXCEPTION_UUID) as any
    );

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);

    // Verify the update call was made with resolution.status=resolved
    expect(driftEventUpdateMock).toHaveBeenCalledTimes(1);
    const updateArg = driftEventUpdateMock.mock.calls[0]?.[0];
    expect(updateArg?.where?.id).toBe(EXCEPTION_UUID);
    expect(updateArg?.data?.acknowledged).toBe(true);
    const metaAfter = updateArg?.data?.metadata as Record<string, unknown>;
    expect((metaAfter?.resolution as Record<string, unknown>)?.status).toBe("resolved");
  });

  test("ignore action marks exception acknowledged with resolution.status=ignored", async () => {
    const res = await POST(
      makePostRequest(EXCEPTION_UUID, "ignore"),
      makeParams(EXCEPTION_UUID) as any
    );

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);

    const updateArg = driftEventUpdateMock.mock.calls[0]?.[0];
    const metaAfter = updateArg?.data?.metadata as Record<string, unknown>;
    expect((metaAfter?.resolution as Record<string, unknown>)?.status).toBe("ignored");
  });

  test("reopen action clears acknowledgment and removes resolution", async () => {
    const res = await POST(
      makePostRequest(EXCEPTION_UUID, "reopen"),
      makeParams(EXCEPTION_UUID) as any
    );

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);

    const updateArg = driftEventUpdateMock.mock.calls[0]?.[0];
    expect(updateArg?.data?.acknowledged).toBe(false);
    expect(updateArg?.data?.acknowledgedBy).toBeNull();
    expect(updateArg?.data?.acknowledgedAt).toBeNull();
    const metaAfter = updateArg?.data?.metadata as Record<string, unknown>;
    expect(metaAfter?.resolution).toBeNull();
  });

  test("returns 404 when exception does not exist for action", async () => {
    driftEventFindFirstMock.mockResolvedValue(null);

    const res = await POST(
      makePostRequest(EXCEPTION_UUID, "resolve"),
      makeParams(EXCEPTION_UUID) as any
    );

    expect(res.status).toBe(404);
    const payload = await res.json();
    expect(payload.success).toBe(false);
  });
});
