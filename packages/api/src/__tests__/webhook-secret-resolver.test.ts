import { getWebhookSecretForTenant } from "../utils/webhook-secret";

jest.mock("../db", () => ({
  query: jest.fn(),
}));

const { query } = jest.requireMock("../db") as { query: jest.Mock };

describe("getWebhookSecretForTenant", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("queries with tenant_id and normalized adapter", async () => {
    query.mockResolvedValueOnce([{ secret: "s", signature_algorithm: "hmac-sha256" }]);
    const row = await getWebhookSecretForTenant("Stripe", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(row?.secret).toBe("s");
    expect(query).toHaveBeenCalledWith(expect.stringContaining("tenant_id = $1"), [
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "stripe",
    ]);
  });

  it("returns null for empty adapter", async () => {
    const row = await getWebhookSecretForTenant("  ", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(row).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
});
