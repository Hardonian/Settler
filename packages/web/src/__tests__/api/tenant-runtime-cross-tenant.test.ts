/** @jest-environment node */

import { GET as getRuns } from "@/app/api/v1/runs/route";
import { GET as getRunById } from "@/app/api/v1/runs/[id]/route";
import { GET as getRunResults } from "@/app/api/v1/runs/[id]/results/route";
import { GET as getRunEvidence } from "@/app/api/v1/runs/[id]/evidence/route";

const authByKey: Record<string, { userId: string; tenantId?: string }> = {
  rk_tenant_a: { userId: "user-a", tenantId: "tenant-a" },
  rk_tenant_b: { userId: "user-b", tenantId: "tenant-b" },
  rk_missing_tenant: { userId: "user-no-tenant" },
};

const fixtureRuns = [
  {
    id: "run-tenant-a-1",
    tenantId: "tenant-a",
    status: "completed",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    sourceAdapter: "source-a",
    targetAdapter: "target-a",
    deletedAt: null,
  },
  {
    id: "run-tenant-b-1",
    tenantId: "tenant-b",
    status: "queued",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    sourceAdapter: "source-b",
    targetAdapter: "target-b",
    deletedAt: null,
  },
];

const fixtureResults = [
  {
    reconJobId: "run-tenant-a-1",
    tenantId: "tenant-a",
    status: "succeeded",
    summary: { matched: 10 },
    matchedCount: 10,
    unmatchedSourceCount: 0,
    unmatchedTargetCount: 0,
    metadata: { fingerprint: "fp-a" },
    proofCapsule: { root: "proof-a" },
    startedAt: new Date("2026-01-01T01:00:00.000Z"),
  },
  {
    reconJobId: "run-tenant-b-1",
    tenantId: "tenant-b",
    status: "failed",
    summary: { matched: 1 },
    matchedCount: 1,
    unmatchedSourceCount: 2,
    unmatchedTargetCount: 3,
    metadata: { fingerprint: "fp-b" },
    proofCapsule: { root: "proof-b" },
    startedAt: new Date("2026-01-02T01:00:00.000Z"),
  },
];

jest.mock("@/shared/auth/apiKey", () => ({
  authenticateApiKey: jest.fn(
    async (request: { headers: { get: (name: string) => string | null } }) => {
      const key = request.headers.get("x-api-key");
      return key ? authByKey[key] || null : null;
    }
  ),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconJob: {
      findMany: jest.fn(async ({ where }: { where: { tenantId?: string; status?: string } }) =>
        fixtureRuns.filter(
          (run) =>
            run.tenantId === where.tenantId && (where.status ? run.status === where.status : true)
        )
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; tenantId: string; deletedAt: null } }) =>
          fixtureRuns.find(
            (run) =>
              run.id === where.id &&
              run.tenantId === where.tenantId &&
              run.deletedAt === where.deletedAt
          ) || null
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
    $executeRaw: jest.fn(async () => 1),
  },
}));

jest.mock("@/lib/trust-graph/explorer", () => ({
  getExecutionGraph: jest.fn(() => ({ graphHash: "graph-hash" })),
  verifyProofChain: jest.fn(() => ({ proofNodeRefs: ["node-a", "node-b"] })),
}));

function req(url: string, apiKey?: string) {
  const headers = new Headers();
  if (apiKey) headers.set("x-api-key", apiKey);
  return {
    headers,
    nextUrl: new URL(url),
  } as any;
}

describe("tenant runtime cross-tenant denial", () => {
  it("returns only caller tenant runs for list endpoint", async () => {
    const response = await getRuns(req("http://localhost/api/v1/runs", "rk_tenant_b"));
    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.rows).toHaveLength(1);
    expect(payload.rows[0].run_id).toBe("run-tenant-b-1");
    expect(payload.rows[0].run_id).not.toBe("run-tenant-a-1");
  });

  it("denies direct cross-tenant reads by id and avoids leaking foreign metadata", async () => {
    const directResponse = await getRunById(
      req("http://localhost/api/v1/runs/run-tenant-a-1", "rk_tenant_b"),
      {
        params: Promise.resolve({ id: "run-tenant-a-1" }),
      }
    );
    expect(directResponse.status).toBe(404);
    const payload = await directResponse.json();
    expect(payload.code).toBe("SETTLER_NOT_FOUND");
    expect(JSON.stringify(payload)).not.toContain("tenant-a");

    const resultsResponse = await getRunResults(
      req("http://localhost/api/v1/runs/run-tenant-a-1/results", "rk_tenant_b"),
      { params: Promise.resolve({ id: "run-tenant-a-1" }) }
    );
    expect(resultsResponse.status).toBe(404);

    const evidenceResponse = await getRunEvidence(
      req("http://localhost/api/v1/runs/run-tenant-a-1/evidence", "rk_tenant_b"),
      { params: Promise.resolve({ id: "run-tenant-a-1" }) }
    );
    expect(evidenceResponse.status).toBe(404);
  });

  it("denies requests with missing tenant context", async () => {
    const missingTenant = await getRuns(req("http://localhost/api/v1/runs", "rk_missing_tenant"));
    expect(missingTenant.status).toBe(401);
    const payload = await missingTenant.json();
    expect(payload.code).toBe("SETTLER_AUTH_REQUIRED");

    const unauthenticated = await getRuns(req("http://localhost/api/v1/runs"));
    expect(unauthenticated.status).toBe(401);
  });
});
