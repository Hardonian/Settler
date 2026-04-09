/** @jest-environment node */
import {
  checkRequestEntitlement,
  createEntitlementErrorResponse,
} from "@/shared/middleware/entitlements";
import type { ApiKeyAuthContext } from "@/shared/auth/apiKey";

jest.mock("@/domain/billing/entitlements", () => ({
  checkEntitlement: jest.fn(),
}));

const { checkEntitlement } = jest.requireMock("@/domain/billing/entitlements") as {
  checkEntitlement: jest.Mock;
};

describe("Entitlement middleware", () => {
  const authContext: ApiKeyAuthContext = {
    apiKeyId: "rk_test",
    userId: "user-test",
    billingAccountId: "00000000-0000-0000-0000-000000000000",
    tenantId: undefined,
    scopes: [],
  };

  beforeEach(() => {
    checkEntitlement.mockReset();
  });

  it("fails closed when entitlement check throws", async () => {
    checkEntitlement.mockRejectedValue(new Error("billing offline"));

    const result = await checkRequestEntitlement(authContext, "reconcile");

    expect(result.allowed).toBe(false);
    expect(result.error?.code).toBe("entitlement_check_failed");
    const response = createEntitlementErrorResponse(result.error!);
    expect(response.status).toBe(503);
  });

  it("returns 401 when billing account is missing", async () => {
    const result = await checkRequestEntitlement(
      { ...authContext, billingAccountId: undefined },
      "reconcile"
    );

    expect(result.allowed).toBe(false);
    expect(result.error?.status).toBe(401);
  });

  it("returns 400 for invalid service code", async () => {
    const invalidService = "unknown" as unknown as Parameters<typeof checkRequestEntitlement>[1];
    const result = await checkRequestEntitlement(authContext, invalidService);

    expect(result.allowed).toBe(false);
    expect(result.error?.status).toBe(400);
  });
});
