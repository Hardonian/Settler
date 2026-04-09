/** @jest-environment node */

import {
  GET as getCustomization,
  PUT as putCustomization,
} from "@/app/api/admin/operator-customization/route";
import {
  GET as getProposals,
  POST as postProposal,
} from "@/app/api/admin/operator-customization/proposals/route";
import { POST as postApplyProposal } from "@/app/api/admin/operator-customization/proposals/[id]/apply/route";
import { POST as postPublish } from "@/app/api/admin/operator-customization/publish/route";
import { POST as postDismissSuggestion } from "@/app/api/admin/operator-customization/suggestions/dismiss/route";

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

jest.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: jest.fn(async () => true),
  getSuperAdminStatus: jest.fn(async () => ({ userId: "00000000-0000-0000-0000-000000000099" })),
}));

/** Zod v4 uuid() requires RFC variant/version nibble constraints on segments 3–4. */
const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    tenant: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    operatorCustomizationState: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    operatorCustomizationProposal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    operatorCustomizationAudit: {
      create: jest.fn(),
    },
    operatorSuggestionDismissal: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/domain/billing/entitlements", () => ({
  getAccountPlanCode: jest.fn(async () => "starter"),
}));

import { getAccountPlanCode } from "@/domain/billing/entitlements";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { prisma } from "@/shared/db/prismaClient";

const prismaMock = prisma as jest.Mocked<typeof prisma>;

function req(url: string, init?: { method?: string; body?: unknown }) {
  return {
    url,
    method: init?.method ?? "GET",
    headers: new Headers(),
    nextUrl: new URL(url),
    json: async () => {
      if (init?.body instanceof Error) throw init.body;
      return init?.body ?? {};
    },
  } as any;
}

describe("operator customization API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.operatorCustomizationState.findUnique.mockResolvedValue(null as never);
    prismaMock.operatorCustomizationState.upsert.mockResolvedValue({} as never);
    prismaMock.operatorCustomizationAudit.create.mockResolvedValue({} as never);
    prismaMock.operatorSuggestionDismissal.upsert.mockResolvedValue({} as never);
    (getAccountPlanCode as jest.Mock).mockResolvedValue("starter");
    prismaMock.tenant.findUnique.mockResolvedValue({ billingAccountId: null });
  });

  it("GET returns 403 when not super-admin", async () => {
    (isSuperAdmin as jest.Mock).mockResolvedValueOnce(false);
    const response = await getCustomization(
      req("http://localhost/api/admin/operator-customization")
    );
    expect(response.status).toBe(403);
    (isSuperAdmin as jest.Mock).mockResolvedValue(true);
  });

  it("GET returns 400 when multiple tenants and tenantId omitted", async () => {
    prismaMock.tenant.count.mockResolvedValue(2);
    const response = await getCustomization(
      req("http://localhost/api/admin/operator-customization")
    );
    expect(response.status).toBe(400);
    const j = await response.json();
    expect(j.code).toBe("ambiguous_tenant");
  });

  it("PUT returns 400 when multiple tenants and tenantId omitted", async () => {
    prismaMock.tenant.count.mockResolvedValue(2);
    const { defaultAdminDashboardCustomization } =
      await import("@/lib/operator-customization/registry");
    const response = await putCustomization(
      req("http://localhost/api/admin/operator-customization", {
        method: "PUT",
        body: { draft: defaultAdminDashboardCustomization() },
      })
    );
    expect(response.status).toBe(400);
    const j = await response.json();
    expect(j.code).toBe("ambiguous_tenant");
  });

  it("POST publish returns 400 when multiple tenants and tenantId omitted", async () => {
    prismaMock.tenant.count.mockResolvedValue(2);
    const response = await postPublish(
      req("http://localhost/api/admin/operator-customization/publish", { method: "POST", body: {} })
    );
    expect(response.status).toBe(400);
    const j = await response.json();
    expect(j.code).toBe("ambiguous_tenant");
  });

  it("POST suggestion dismiss returns 400 when multiple tenants and tenantId omitted", async () => {
    prismaMock.tenant.count.mockResolvedValue(2);
    const response = await postDismissSuggestion(
      req("http://localhost/api/admin/operator-customization/suggestions/dismiss", {
        method: "POST",
        body: { suggestionKey: "exceptions_overview", suggestionKind: "pin_module" },
      })
    );
    expect(response.status).toBe(400);
    const j = await response.json();
    expect(j.code).toBe("ambiguous_tenant");
  });

  it("GET succeeds for single-tenant implicit resolve", async () => {
    prismaMock.tenant.count.mockResolvedValue(1);
    prismaMock.tenant.findFirst.mockResolvedValue({ id: T1, slug: "only" });
    const response = await getCustomization(
      req("http://localhost/api/admin/operator-customization")
    );
    expect(response.status).toBe(200);
    const j = await response.json();
    expect(j.tenant.slug).toBe("only");
    expect(j.entitlements.capabilities.baseline_studio).toBe(true);
  });

  it("GET returns 404 for unknown tenantId", async () => {
    prismaMock.tenant.findFirst.mockResolvedValue(null);
    const response = await getCustomization(
      req(`http://localhost/api/admin/operator-customization?tenantId=${T2}`)
    );
    expect(response.status).toBe(404);
  });

  it("PUT rejects advanced preset when plan is starter", async () => {
    prismaMock.tenant.count.mockResolvedValue(1);
    prismaMock.tenant.findFirst.mockResolvedValue({ id: T1, slug: "solo" });
    const { defaultAdminDashboardCustomization } =
      await import("@/lib/operator-customization/registry");
    const draft = defaultAdminDashboardCustomization();
    draft.lastAppliedPresetId = "buyer_demo";
    const response = await putCustomization(
      req("http://localhost/api/admin/operator-customization", {
        method: "PUT",
        body: { draft },
      })
    );
    expect(response.status).toBe(403);
    const j = await response.json();
    expect(j.code).toBe("advanced_presets_require_plan");
  });

  it("POST proposals rejects buyer_demo intent on starter plan (server-enforced)", async () => {
    prismaMock.tenant.findFirst.mockResolvedValue({ id: T1, slug: "solo" });
    prismaMock.tenant.count.mockResolvedValue(1);
    const response = await postProposal(
      req("http://localhost/api/admin/operator-customization/proposals", {
        method: "POST",
        body: { tenantId: T1, request: "buyer demo layout" },
      })
    );
    expect(response.status).toBe(403);
    const j = await response.json();
    expect(j.code).toBe("advanced_presets_require_plan");
    expect(prismaMock.operatorCustomizationProposal.create).not.toHaveBeenCalled();
  });

  it("proposals GET lists only current user rows for tenant", async () => {
    prismaMock.tenant.findFirst.mockResolvedValue({ id: T1, slug: "solo" });
    prismaMock.tenant.count.mockResolvedValue(2);
    prismaMock.operatorCustomizationProposal.findMany.mockResolvedValue([]);
    await getProposals(
      req(`http://localhost/api/admin/operator-customization/proposals?tenantId=${T1}`)
    );
    expect(prismaMock.operatorCustomizationProposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: T1, userId: "00000000-0000-0000-0000-000000000099" },
      })
    );
  });

  it("POST proposal create uses resolved tenant id in prisma create", async () => {
    prismaMock.tenant.findFirst.mockResolvedValue({ id: T1, slug: "a" });
    prismaMock.tenant.count.mockResolvedValue(2);
    prismaMock.operatorCustomizationProposal.create.mockResolvedValue({
      id: "prop-new",
      status: "pending",
    } as never);
    const response = await postProposal(
      req("http://localhost/api/admin/operator-customization/proposals", {
        method: "POST",
        body: { tenantId: T1, request: "pin exceptions module" },
      })
    );
    expect(response.status).toBe(200);
    expect(prismaMock.operatorCustomizationProposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: T1,
          userId: "00000000-0000-0000-0000-000000000099",
        }),
      })
    );
  });

  it("apply proposal returns 404 when no proposal for resolved tenant (cross-tenant safe)", async () => {
    prismaMock.tenant.findFirst.mockResolvedValue({ id: T1, slug: "a" });
    prismaMock.tenant.count.mockResolvedValue(2);
    // Proposal lives on another tenant; scoped find returns nothing.
    prismaMock.operatorCustomizationProposal.findFirst.mockResolvedValue(null);
    const response = await postApplyProposal(
      req("http://localhost/api/admin/operator-customization/proposals/prop-1/apply", {
        method: "POST",
        body: { tenantId: T1 },
      }),
      { params: Promise.resolve({ id: "prop-1" }) }
    );
    expect(response.status).toBe(404);
  });
});
