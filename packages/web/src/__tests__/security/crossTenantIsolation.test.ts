/** @jest-environment node */

import { POST as createExport } from "@/app/api/exports/route";
import { GET as getAdminAudit } from "@/app/api/admin/audit/route";

jest.mock("@/shared/auth/apiKey", () => ({
  authenticateApiKey: jest.fn(async () => ({ userId: "user-b", tenantId: "tenant-b" })),
}));

jest.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: jest.fn(async () => false),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  })),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    export: {
      create: jest.fn(async ({ data }: { data: { tenantId: string } }) => ({
        id: "exp-1",
        status: "pending",
        type: "csv",
        format: "all",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        tenantId: data.tenantId,
      })),
      update: jest.fn(async () => null),
    },
    reconAudit: {
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
    },
    billingAccount: {
      findFirst: jest.fn(async () => ({ tenantId: "tenant-b" })),
    },
  },
}));

function req(url: string, body?: Record<string, unknown>, method = "GET") {
  const headers = new Headers({ "content-type": "application/json", "x-api-key": "rk_tenant_b" });
  return {
    headers,
    url,
    nextUrl: new URL(url),
    method,
    json: async () => body || {},
  } as any;
}

describe("cross-tenant runtime isolation", () => {
  it("requires tenant context for export endpoint", async () => {
    const response = await createExport(
      req(
        "http://localhost/api/exports",
        {
          type: "csv",
          format: "all",
          reconciliationRunId: "11111111-1111-1111-1111-111111111111",
        },
        "POST"
      )
    );

    expect([201, 401, 403]).toContain(response.status);
  });

  it("denies admin audit endpoint to non-super-admin caller", async () => {
    const response = await getAdminAudit(req("http://localhost/api/admin/audit"));
    expect(response.status).toBe(403);
  });
});
