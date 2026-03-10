/** @jest-environment node */

import { GET as getAdminAudit } from "@/app/api/admin/audit/route";
import { POST as resolveException } from "@/app/api/admin/exceptions/[id]/resolve/route";
import { POST as escalateException } from "@/app/api/admin/exceptions/[id]/escalate/route";
import { PATCH as patchPolicy } from "@/app/api/control-plane/policies/[policyId]/route";

let isSuperAdminMock = true;

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: jest.fn(async () => isSuperAdminMock),
  getSuperAdminStatus: jest.fn(async () => ({ userId: "admin-user" })),
}));

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    reconAudit: {
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
    },
    driftEvent: {
      findUnique: jest.fn(async () => ({ metadata: {} })),
      update: jest.fn(async () => ({})),
    },
  },
}));

jest.mock("@/lib/control-plane/state", () => ({
  updatePolicy: jest.fn((_policyId: string) => null),
}));

function req(url: string, body?: unknown) {
  return {
    url,
    headers: new Headers(),
    nextUrl: new URL(url),
    json: async () => {
      if (body instanceof Error) throw body;
      return body;
    },
  } as any;
}

describe("admin/control-plane contract coverage", () => {
  beforeEach(() => {
    isSuperAdminMock = true;
  });

  it("api.admin.audit.authz.non_superadmin_denied", async () => {
    isSuperAdminMock = false;
    const response = await getAdminAudit(req("http://localhost/api/admin/audit"));
    expect(response.status).toBe(403);
  });

  it("api.admin.audit.validation.invalid_query_400", async () => {
    const response = await getAdminAudit(req("http://localhost/api/admin/audit?limit=invalid"));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain("Invalid");
  });

  it("api.admin.exceptions.resolve.invalid_id", async () => {
    const response = await resolveException(req("http://localhost", { resolutionNotes: "x" }), {
      params: Promise.resolve({ id: "bad-id" }),
    });
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.message).toContain("UUID");
  });

  it("api.admin.exceptions.escalate.invalid_id", async () => {
    const response = await escalateException(req("http://localhost", { escalationReason: "x" }), {
      params: Promise.resolve({ id: "bad-id" }),
    });
    expect(response.status).toBe(400);
  });

  it("api.control_plane.policies.invalid_json", async () => {
    const response = await patchPolicy(req("http://localhost", new Error("bad json")), {
      params: Promise.resolve({ policyId: "policy-a" }),
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
  });

  it("api.control_plane.policies.validation.enabled_boolean", async () => {
    const response = await patchPolicy(req("http://localhost", { enabled: "yes" }), {
      params: Promise.resolve({ policyId: "policy-a" }),
    });
    expect(response.status).toBe(400);
  });

  it("api.control_plane.policies.not_found", async () => {
    const response = await patchPolicy(req("http://localhost", { enabled: true }), {
      params: Promise.resolve({ policyId: "unknown-policy" }),
    });
    expect(response.status).toBe(404);
  });
});
