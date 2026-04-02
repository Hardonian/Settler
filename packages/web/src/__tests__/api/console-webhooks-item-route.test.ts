/** @jest-environment node */

import { PATCH, DELETE } from "@/app/api/console/webhooks/[id]/route";

jest.mock("@/middleware/billing-gate-universal", () => ({
  withUniversalBillingGate: (handler: unknown) => handler,
}));

jest.mock("@/lib/middleware/api-security", () => ({
  withSecurity: (handler: unknown) => handler,
}));

const requireTenantRequestContextMock = jest.fn();
const updateWebhookMock = jest.fn();
const deleteWebhookMock = jest.fn();

jest.mock("@/lib/api/tenant-context", () => ({
  requireTenantRequestContext: (...args: unknown[]) => requireTenantRequestContextMock(...args),
  buildTenantContextErrorResponse: (error: {
    status: number;
    code: string;
    message: string;
    capability: unknown;
  }) =>
    Response.json(
      { error: error.message, code: error.code, capability: error.capability },
      { status: error.status }
    ),
}));

jest.mock("@/lib/webhooks/manager", () => ({
  updateWebhook: (...args: unknown[]) => updateWebhookMock(...args),
  deleteWebhook: (...args: unknown[]) => deleteWebhookMock(...args),
}));

function req(method: "PATCH" | "DELETE", body?: unknown) {
  return {
    method,
    json: async () => body ?? {},
  } as any;
}

describe("console webhook item routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns setup_required when tenant context is unresolved", async () => {
    requireTenantRequestContextMock.mockRejectedValue({
      status: 409,
      code: "TENANT_CONTEXT_REQUIRED",
      message: "Select or finish setting up a workspace before using this feature.",
      capability: {
        state: "setup_required",
        reason: "tenant_context_required",
      },
    });

    const response = await PATCH(req("PATCH", { active: false }), {
      params: Promise.resolve({ id: "wh_1" }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.capability).toEqual({
      state: "setup_required",
      reason: "tenant_context_required",
    });
    expect(updateWebhookMock).not.toHaveBeenCalled();
  });

  it("returns 404 when deleting a webhook outside the resolved tenant scope", async () => {
    requireTenantRequestContextMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
    });
    deleteWebhookMock.mockRejectedValue(new Error("Webhook not found"));

    const response = await DELETE(req("DELETE"), {
      params: Promise.resolve({ id: "wh_missing" }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.capability).toEqual({
      state: "unavailable",
      reason: "webhook_not_found",
    });
  });
});
