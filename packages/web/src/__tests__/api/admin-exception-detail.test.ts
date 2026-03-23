/** @jest-environment node */

/**
 * Admin exception detail API tests.
 *
 * Verifies:
 * - GET returns expected shape for a valid exception
 * - 404 returned when exception does not exist
 * - 400 returned for invalid UUID
 * - 403 returned without super admin access
 * - Provenance fields derived correctly from metadata
 * - Missing provenance fields expressed as null, not fabricated
 * - Status derivation from acknowledged + metadata.resolution
 * - No list-fetch-filter anti-pattern (findUnique, not findMany)
 */

import { GET } from "@/app/api/admin/exceptions/[id]/route";

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const isSuperAdminMock = jest.fn();
const driftEventFindUniqueMock = jest.fn();

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: (...args: unknown[]) => isSuperAdminMock(...args),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    driftEvent: {
      findUnique: (...args: unknown[]) => driftEventFindUniqueMock(...args),
    },
  },
}));

jest.mock("@/lib/admin/utils/logger", () => ({
  adminLogger: {
    error: jest.fn(),
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(id: string) {
  return {
    url: `http://localhost/api/admin/exceptions/${id}`,
    nextUrl: new URL(`http://localhost/api/admin/exceptions/${id}`),
  } as unknown as import("next/server").NextRequest;
}

function makeParams(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

const VALID_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TENANT_UUID = "11111111-2222-4333-8444-555555555555";
const RUN_UUID = "66666666-7777-4888-8999-aaaaaaaaaaaa";

function makeException(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    tenantId: TENANT_UUID,
    driftType: "amount_mismatch",
    severity: "critical",
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
    updatedAt: new Date("2026-01-15T10:00:00.000Z"),
    reconJobId: RUN_UUID,
    fieldPath: "amount",
    expectedValue: "100.00",
    actualValue: "110.00",
    driftMetrics: null,
    metadata: {},
    ...overrides,
  };
}

// ─── Test suite ────────────────────────────────────────────────────────────────

describe("GET /api/admin/exceptions/[id]", () => {
  beforeEach(() => {
    isSuperAdminMock.mockReset();
    driftEventFindUniqueMock.mockReset();

    // Default: super admin access granted
    isSuperAdminMock.mockResolvedValue(true);
  });

  // ── Auth ──────────────────────────────────────────────────────────────────────

  test("returns 403 when caller is not super admin", async () => {
    isSuperAdminMock.mockResolvedValue(false);

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));

    expect(res.status).toBe(403);
    const payload = await res.json();
    expect(payload.error).toBe("Forbidden");
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  test("returns 400 for an invalid UUID", async () => {
    const res = await GET(makeRequest("not-a-uuid"), makeParams("not-a-uuid"));

    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.error).toBe("Invalid exception ID");
  });

  // ── Not found ────────────────────────────────────────────────────────────────

  test("returns 404 when exception does not exist", async () => {
    driftEventFindUniqueMock.mockResolvedValue(null);

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));

    expect(res.status).toBe(404);
    const payload = await res.json();
    expect(payload.error).toBe("Not found");
    expect(payload.message).toMatch(/no longer exists/);
  });

  // ── Happy path ───────────────────────────────────────────────────────────────

  test("returns 200 with expected shape for a valid exception", async () => {
    driftEventFindUniqueMock.mockResolvedValue(makeException());

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));

    expect(res.status).toBe(200);
    const payload = await res.json();

    // Core identity
    expect(payload.id).toBe(VALID_UUID);
    expect(payload.tenantId).toBe(TENANT_UUID);
    expect(payload.source).toBe("amount_mismatch");
    expect(payload.severity).toBe("critical");
    expect(payload.status).toBe("new");
    expect(payload.reason).toBe("Field mismatch: amount");

    // Evidence
    expect(payload.evidence.expected).toBe("100.00");
    expect(payload.evidence.actual).toBe("110.00");

    // Timestamps present
    expect(payload.createdAt).toBe("2026-01-15T10:00:00.000Z");
    expect(typeof payload.updatedAt).toBe("string");

    // Provenance must be present (fields may be null but must be declared)
    expect(payload.provenance).toBeDefined();
    expect(payload.provenance.runId).toBe(RUN_UUID);
    expect(payload.provenance.fieldPath).toBe("amount");
    expect(payload.provenance.ruleId).toBeNull();
    expect(payload.provenance.detectorId).toBeNull();
    expect(payload.provenance.sourceAdapter).toBeNull();
    expect(payload.provenance.confidenceScore).toBeNull();
  });

  // ── Uses findUnique, not findMany ─────────────────────────────────────────────

  test("queries by ID via findUnique, not by list scan", async () => {
    driftEventFindUniqueMock.mockResolvedValue(makeException());

    await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));

    expect(driftEventFindUniqueMock).toHaveBeenCalledTimes(1);
    const callArg = driftEventFindUniqueMock.mock.calls[0]?.[0];
    expect(callArg?.where?.id).toBe(VALID_UUID);
  });

  // ── Status derivation ────────────────────────────────────────────────────────

  test("derives status=new when acknowledged=false and no resolution", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({ acknowledged: false, metadata: {} })
    );
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.status).toBe("new");
  });

  test("derives status=in_review when acknowledged=true and no resolution", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        acknowledgedBy: "user-x",
        acknowledgedAt: new Date("2026-01-15T11:00:00.000Z"),
        metadata: {},
      })
    );
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.status).toBe("in_review");
  });

  test("derives status=resolved when metadata.resolution.status=resolved", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        metadata: {
          resolution: {
            status: "resolved",
            resolvedBy: "user-x",
            resolvedAt: "2026-01-15T12:00:00.000Z",
          },
        },
      })
    );
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.status).toBe("resolved");
  });

  test("derives status=resolved when metadata.resolution.status=ignored", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        metadata: {
          resolution: {
            status: "ignored",
            ignoredBy: "user-x",
            ignoredAt: "2026-01-15T12:00:00.000Z",
          },
        },
      })
    );
    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.status).toBe("resolved");
  });

  // ── Provenance from metadata ──────────────────────────────────────────────────

  test("extracts ruleId and detectorId from metadata", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({
        metadata: {
          ruleId: "rule_amount_tolerance_v2",
          detectorId: "detector_001",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
          sourceTransactionId: "txn_src_111",
          targetTransactionId: "txn_tgt_222",
          ingestionId: "ing_333",
        },
      })
    );

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();

    expect(payload.provenance.ruleId).toBe("rule_amount_tolerance_v2");
    expect(payload.provenance.detectorId).toBe("detector_001");
    expect(payload.provenance.sourceAdapter).toBe("stripe");
    expect(payload.provenance.targetAdapter).toBe("netsuite");
    expect(payload.provenance.sourceTransactionId).toBe("txn_src_111");
    expect(payload.provenance.targetTransactionId).toBe("txn_tgt_222");
    expect(payload.provenance.ingestionId).toBe("ing_333");
  });

  test("extracts confidenceScore from driftMetrics", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({
        driftMetrics: { confidenceScore: 0.87 },
        metadata: {},
      })
    );

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.provenance.confidenceScore).toBeCloseTo(0.87);
  });

  // ── Missing data graceful degradation ─────────────────────────────────────────

  test("returns null provenance fields rather than fabricating them", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({ reconJobId: null, fieldPath: null, metadata: {}, driftMetrics: null })
    );

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();

    expect(payload.provenance.runId).toBeNull();
    expect(payload.provenance.fieldPath).toBeNull();
    expect(payload.provenance.ruleId).toBeNull();
    expect(payload.provenance.detectorId).toBeNull();
    expect(payload.provenance.sourceAdapter).toBeNull();
    expect(payload.provenance.targetAdapter).toBeNull();
    expect(payload.provenance.sourceTransactionId).toBeNull();
    expect(payload.provenance.targetTransactionId).toBeNull();
    expect(payload.provenance.ingestionId).toBeNull();
    expect(payload.provenance.matchReason).toBeNull();
    expect(payload.provenance.confidenceScore).toBeNull();
  });

  test("handles null expectedValue and actualValue without throwing", async () => {
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({ expectedValue: null, actualValue: null })
    );

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.evidence.expected).toBeNull();
    expect(payload.evidence.actual).toBeNull();
  });

  test("uses fallback severity=info when severity is null", async () => {
    driftEventFindUniqueMock.mockResolvedValue(makeException({ severity: null }));

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.severity).toBe("info");
  });

  test("uses fallback source=unknown when driftType is null", async () => {
    driftEventFindUniqueMock.mockResolvedValue(makeException({ driftType: null }));

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.source).toBe("unknown");
  });

  // ── Reviewed metadata ────────────────────────────────────────────────────────

  test("exposes reviewedBy and reviewedAt when present", async () => {
    const reviewedAt = new Date("2026-01-15T14:00:00.000Z");
    driftEventFindUniqueMock.mockResolvedValue(
      makeException({
        acknowledged: true,
        acknowledgedBy: "admin-user",
        acknowledgedAt: reviewedAt,
        metadata: {},
      })
    );

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.reviewedBy).toBe("admin-user");
    expect(payload.reviewedAt).toBe(reviewedAt.toISOString());
  });

  test("returns reviewedBy=null and reviewedAt=null when not reviewed", async () => {
    driftEventFindUniqueMock.mockResolvedValue(makeException());

    const res = await GET(makeRequest(VALID_UUID), makeParams(VALID_UUID));
    const payload = await res.json();
    expect(payload.reviewedBy).toBeNull();
    expect(payload.reviewedAt).toBeNull();
  });
});
