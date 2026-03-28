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
    delete process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK_IN_DEV;
  });

  it("fails closed when no key or vault available", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "no vault" } });

    await expect(
      encryptCredentials({ client_id: "abc" }, "http://localhost", "service")
    ).rejects.toMatchObject({ code: "ENCRYPTION_UNAVAILABLE" });
  });

  it("allows legacy base64 fallback only in dev/test with both explicit gates", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "no vault" } });
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK = "true";
    process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK_IN_DEV = "true";

    const encoded = Buffer.from(JSON.stringify({ token: "legacy" }), "utf8").toString("base64");

    await expect(decryptCredentials(encoded, "http://localhost", "service")).resolves.toEqual({
      token: "legacy",
    });
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("rejects insecure fallback in production even if ALLOW_INSECURE_CREDENTIAL_FALLBACK=true", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "no vault" } });
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK = "true";
    delete process.env.ALLOW_INSECURE_CREDENTIAL_FALLBACK_IN_DEV;

    const encoded = Buffer.from(JSON.stringify({ token: "legacy" }), "utf8").toString("base64");

    await expect(decryptCredentials(encoded, "http://localhost", "service")).rejects.toMatchObject({
      code: "DECRYPTION_UNAVAILABLE",
    });
    process.env.NODE_ENV = prevNodeEnv;
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
