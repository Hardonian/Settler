import { decryptCredentials, encryptCredentials } from "../credential-encryption";

const rpcMock = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: rpcMock }),
}));

describe("credential-encryption", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    delete process.env.SUPABASE_VAULT_KEY;
    delete process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK;
  });

  it("fails closed when no key or vault available", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "no vault" } });

    await expect(
      encryptCredentials({ client_id: "abc" }, "http://localhost", "service")
    ).rejects.toMatchObject({ code: "ENCRYPTION_UNAVAILABLE" });
  });

  it("allows legacy base64 fallback only when explicitly enabled", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "no vault" } });
    process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK = "true";

    const encoded = Buffer.from(JSON.stringify({ token: "legacy" }), "utf8").toString("base64");

    await expect(decryptCredentials(encoded, "http://localhost", "service")).resolves.toEqual({
      token: "legacy",
    });
  });

  it("rejects malformed encrypted payloads without leaking secrets", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "no vault" } });
    process.env.CREDENTIAL_ENCRYPTION_KEY = "a".repeat(64);

    await expect(
      decryptCredentials("this-is-not-base64-ciphertext", "http://localhost", "service")
    ).rejects.toMatchObject({
      code: "DECRYPTION_FAILED",
      message: "Failed to decrypt credentials",
    });
  });
});
