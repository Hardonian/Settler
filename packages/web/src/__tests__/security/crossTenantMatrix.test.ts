/** @jest-environment node */

import { GET as getRuns } from "@/app/api/v1/runs/route";
import { GET as getRunById } from "@/app/api/v1/runs/[id]/route";
import { GET as getRunResults } from "@/app/api/v1/runs/[id]/results/route";
import { GET as getRunEvidence } from "@/app/api/v1/runs/[id]/evidence/route";
import { POST as createExport } from "@/app/api/exports/route";
import { GET as getAdminAudit } from "@/app/api/admin/audit/route";

type FixtureCase = {
  name: string;
  actorTenant: string | null;
  resourceTenant: string;
  route: string;
  method: "GET" | "POST";
  execute: () => Promise<Response>;
  expectedStatus: number | number[];
  invariant: (payload: unknown) => void;
};

const keyMap: Record<string, { userId: string; tenantId?: string }> = {
  rk_tenant_a: { userId: "user-a", tenantId: "tenant-a" },
  rk_tenant_b: { userId: "user-b", tenantId: "tenant-b" },
  rk_admin: { userId: "admin", tenantId: "tenant-a" },
};

const fixtureRuns = [
  {
    id: "run-a-1",
    tenantId: "tenant-a",
    status: "completed",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    sourceAdapter: "source-a",
    targetAdapter: "target-a",
    deletedAt: null,
  },
  {
    id: "run-b-1",
    tenantId: "tenant-b",
    status: "queued",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    sourceAdapter: "source-b",
    targetAdapter: "target-b",
    deletedAt: null,
  },
];

const fixtureResults = [
  { reconJobId: "run-a-1", tenantId: "tenant-a", status: "succeeded", summary: {}, metadata: {} },
  { reconJobId: "run-b-1", tenantId: "tenant-b", status: "failed", summary: {}, metadata: {} },
];

jest.mock("@/shared/auth/apiKey", () => ({
  authenticateApiKey: jest.fn(
    async (request: { headers: { get: (name: string) => string | null } }) => {
      const key = request.headers.get("x-api-key");
      return key ? keyMap[key] || null : null;
    }
  ),
}));

jest.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: jest.fn(async () => false),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  })),
}));

jest.mock("@/lib/trust-graph/explorer", () => ({
  getExecutionGraph: jest.fn(() => ({ graphHash: "hash" })),
  verifyProofChain: jest.fn(() => ({ proofNodeRefs: ["n-1"] })),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconJob: {
      findMany: jest.fn(async ({ where }: { where: { tenantId: string; status?: string } }) =>
        fixtureRuns.filter(
          (run) => run.tenantId === where.tenantId && (!where.status || run.status === where.status)
        )
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; tenantId: string; deletedAt?: null } }) =>
          fixtureRuns.find((run) => run.id === where.id && run.tenantId === where.tenantId) || null
      ),
    },
    reconResult: {
      findFirst: jest.fn(
        async ({ where }: { where: { reconJobId: string; tenantId: string } }) =>
          fixtureResults.find(
            (result) => result.reconJobId === where.reconJobId && result.tenantId === where.tenantId
          ) || null
      ),
    },
    export: {
      create: jest.fn(async ({ data }: { data: { tenantId: string; userId: string } }) => ({
        id: `exp-${data.tenantId}`,
        status: "pending",
        type: "csv",
        format: "all",
        tenantId: data.tenantId,
        userId: data.userId,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      })),
      update: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
    },
    billingAccount: {
      findFirst: jest.fn(async ({ where }: { where: { userId?: string } }) => ({
        tenantId: where.userId === "user-b" ? "tenant-b" : "tenant-a",
      })),
    },
    reconAudit: {
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
    },
    $executeRaw: jest.fn(async () => 1),
  },
}));

function request(
  url: string,
  method: "GET" | "POST",
  apiKey?: string,
  body?: Record<string, unknown>
) {
  const headers = new Headers();
  if (apiKey) headers.set("x-api-key", apiKey);
  if (method === "POST") headers.set("content-type", "application/json");
  return {
    headers,
    method,
    url,
    nextUrl: new URL(url),
    json: async () => body || {},
  } as any;
}

const CASES: FixtureCase[] = [
  {
    name: "read list denies foreign tenant records",
    actorTenant: "tenant-b",
    resourceTenant: "tenant-a",
    route: "/api/v1/runs?status=completed&limit=1",
    method: "GET",
    execute: () =>
      getRuns(
        request("http://localhost/api/v1/runs?status=completed&limit=1", "GET", "rk_tenant_b")
      ),
    expectedStatus: 200,
    invariant: (payload) => {
      const rows = (payload as { rows: Array<{ run_id: string }> }).rows;
      expect(rows.every((row) => row.run_id.startsWith("run-b"))).toBe(true);
    },
  },
  {
    name: "direct read by id blocks cross-tenant",
    actorTenant: "tenant-b",
    resourceTenant: "tenant-a",
    route: "/api/v1/runs/run-a-1",
    method: "GET",
    execute: () =>
      getRunById(request("http://localhost/api/v1/runs/run-a-1", "GET", "rk_tenant_b"), {
        params: Promise.resolve({ id: "run-a-1" }),
      }),
    expectedStatus: 404,
    invariant: (payload) => {
      const body = JSON.stringify(payload);
      expect(body).not.toContain("tenant-a");
      expect(body).toContain("SETTLER_NOT_FOUND");
    },
  },
  {
    name: "results endpoint blocks cross-tenant",
    actorTenant: "tenant-b",
    resourceTenant: "tenant-a",
    route: "/api/v1/runs/run-a-1/results",
    method: "GET",
    execute: () =>
      getRunResults(request("http://localhost/api/v1/runs/run-a-1/results", "GET", "rk_tenant_b"), {
        params: Promise.resolve({ id: "run-a-1" }),
      }),
    expectedStatus: 404,
    invariant: () => undefined,
  },
  {
    name: "evidence export endpoint blocks cross-tenant",
    actorTenant: "tenant-b",
    resourceTenant: "tenant-a",
    route: "/api/v1/runs/run-a-1/evidence",
    method: "GET",
    execute: () =>
      getRunEvidence(
        request("http://localhost/api/v1/runs/run-a-1/evidence", "GET", "rk_tenant_b"),
        {
          params: Promise.resolve({ id: "run-a-1" }),
        }
      ),
    expectedStatus: 404,
    invariant: () => undefined,
  },
  {
    name: "mutation endpoint keeps tenant scope",
    actorTenant: "tenant-b",
    resourceTenant: "tenant-b",
    route: "/api/exports",
    method: "POST",
    execute: () =>
      createExport(
        request("http://localhost/api/exports", "POST", "rk_tenant_b", {
          type: "csv",
          format: "all",
          reconciliationRunId: "11111111-1111-1111-1111-111111111111",
        })
      ),
    expectedStatus: [201, 401, 403],
    invariant: (payload) => {
      expect(JSON.stringify(payload)).not.toContain("tenant-a");
    },
  },
  {
    name: "admin route remains bounded to admin scope",
    actorTenant: "tenant-b",
    resourceTenant: "tenant-a",
    route: "/api/admin/audit",
    method: "GET",
    execute: () => getAdminAudit(request("http://localhost/api/admin/audit", "GET", "rk_tenant_b")),
    expectedStatus: 403,
    invariant: (payload) => {
      expect(JSON.stringify(payload)).toContain("Forbidden");
    },
  },
];

describe("cross-tenant matrix", () => {
  it.each(CASES)("$name", async (fixtureCase) => {
    const response = await fixtureCase.execute();
    const expected = Array.isArray(fixtureCase.expectedStatus)
      ? fixtureCase.expectedStatus
      : [fixtureCase.expectedStatus];
    expect(expected).toContain(response.status);
    const payload = await response.json();
    fixtureCase.invariant(payload);
  });
});
