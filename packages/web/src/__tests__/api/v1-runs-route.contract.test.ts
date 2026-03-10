/** @jest-environment node */

import { GET, POST } from "@/app/api/v1/runs/route";

const authByKey: Record<string, { userId: string; tenantId?: string }> = {
  rk_tenant_a: { userId: "user-a", tenantId: "tenant-a" },
  rk_tenant_b: { userId: "user-b", tenantId: "tenant-b" },
};

const jobs: any[] = [];
const results: any[] = [];

jest.mock("@/shared/auth/apiKey", () => ({
  authenticateApiKey: jest.fn(async (request: { headers: Headers }) => {
    const key = request.headers.get("x-api-key");
    return key ? authByKey[key] || null : null;
  }),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconJob: {
      findMany: jest.fn(async ({ where }: any) =>
        jobs
          .filter((job) => job.tenantId === where.tenantId)
          .filter((job) => (where.status ? job.status === where.status : true))
      ),
      create: jest.fn(async ({ data }: any) => {
        const job = {
          id: `run-${jobs.length + 1}`,
          createdAt: new Date("2026-02-10T00:00:00.000Z"),
          ...data,
        };
        jobs.unshift(job);
        return job;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = jobs.findIndex((job) => job.id === where.id);
        if (idx >= 0) jobs[idx] = { ...jobs[idx], ...data };
      }),
    },
    reconResult: {
      create: jest.fn(async ({ data }: any) => {
        results.push(data);
        return data;
      }),
    },
    $executeRaw: jest.fn(async () => 1),
  },
}));

function req(url: string, init: { apiKey?: string; idempotencyKey?: string; body?: unknown } = {}) {
  const headers = new Headers();
  if (init.apiKey) headers.set("x-api-key", init.apiKey);
  if (init.idempotencyKey) headers.set("idempotency-key", init.idempotencyKey);

  return {
    headers,
    nextUrl: new URL(url),
    json: async () => init.body,
  } as any;
}

describe("/api/v1/runs contract and failure paths", () => {
  beforeEach(() => {
    jobs.length = 0;
    results.length = 0;
  });

  it("api.v1.runs.auth.unauthenticated_problem_contract", async () => {
    const response = await GET(req("http://localhost/api/v1/runs"));
    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const payload = await response.json();
    expect(payload.code).toBe("SETTLER_AUTH_REQUIRED");
  });

  it("api.v1.runs.create.async_contract", async () => {
    const response = await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_a",
        idempotencyKey: "idem-1",
        body: {
          name: "daily-run",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
          async: true,
        },
      })
    );

    expect(response.status).toBe(202);
    const payload = await response.json();
    expect(payload).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: "queued",
        mode: "async",
        created_at: expect.any(String),
      })
    );
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("api.v1.runs.idempotency.conflict", async () => {
    await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_a",
        idempotencyKey: "idem-conflict",
        body: {
          name: "baseline",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
        },
      })
    );

    const conflict = await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_a",
        idempotencyKey: "idem-conflict",
        body: {
          name: "mutated",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
        },
      })
    );

    expect(conflict.status).toBe(409);
    const payload = await conflict.json();
    expect(payload.code).toBe("SETTLER_CONFLICT");
  });

  it("api.v1.runs.idempotency.tenant_isolation", async () => {
    const first = await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_a",
        idempotencyKey: "idem-shared",
        body: {
          name: "tenant-a-run",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
        },
      })
    );
    const firstPayload = await first.json();

    const replay = await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_a",
        idempotencyKey: "idem-shared",
        body: {
          name: "tenant-a-run",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
        },
      })
    );
    const replayPayload = await replay.json();

    const tenantB = await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_b",
        idempotencyKey: "idem-shared",
        body: {
          name: "tenant-b-run",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
        },
      })
    );
    const tenantBPayload = await tenantB.json();

    expect(replayPayload).toEqual(firstPayload);
    expect(tenantBPayload.id).not.toEqual(firstPayload.id);
  });

  it("api.v1.runs.validation.invalid_body", async () => {
    const invalid = await POST(
      req("http://localhost/api/v1/runs", {
        apiKey: "rk_tenant_a",
        idempotencyKey: "idem-invalid",
        body: {
          name: "",
          sourceAdapter: "stripe",
          targetAdapter: "netsuite",
        },
      })
    );

    expect(invalid.status).toBe(400);
    expect(invalid.headers.get("content-type")).toContain("application/problem+json");
    const payload = await invalid.json();
    expect(payload.code).toBe("SETTLER_INVALID_INPUT");
  });
});
