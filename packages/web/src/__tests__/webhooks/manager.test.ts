/** @jest-environment node */

import { getWebhookDeliveries } from "@/lib/webhooks/manager";

const findFirstMock = jest.fn();
const findManyMock = jest.fn();

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    webhook: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
    webhookDelivery: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}));

describe("getWebhookDeliveries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires an explicit tenant scope instead of falling back to the user id", async () => {
    await expect(getWebhookDeliveries("wh_123", "user_123", "")).rejects.toThrow(
      "Tenant context is required for webhook operations"
    );

    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("uses the provided tenant id for object-level ownership checks", async () => {
    findFirstMock.mockResolvedValue({
      id: "wh_123",
      userId: "user_123",
      tenantId: "tenant_123",
      deletedAt: null,
    });
    findManyMock.mockResolvedValue([]);

    await getWebhookDeliveries("wh_123", "user_123", "tenant_123");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        id: "wh_123",
        userId: "user_123",
        tenantId: "tenant_123",
        deletedAt: null,
      },
    });
  });
});
