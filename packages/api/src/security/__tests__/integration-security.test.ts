import crypto from "crypto";
import {
  decryptCredential,
  encryptCredential,
  validateWebhookSignature,
  validateWebhookTimestamp,
} from "../integration-security";

describe("integration-security hardening", () => {
  const key = crypto.randomBytes(32).toString("hex");

  it("encrypts/decrypts with a valid key", () => {
    const token = "secret-token";
    const encrypted = encryptCredential(token, key);

    expect(decryptCredential(encrypted.encrypted, encrypted.iv, encrypted.tag, key)).toBe(token);
  });

  it("rejects invalid key format", () => {
    expect(() => encryptCredential("token", "abc123")).toThrow(
      "Invalid encryption key: expected 32-byte hex string"
    );
  });

  it("accepts prefixed webhook signatures and rejects malformed signatures", () => {
    const payload = JSON.stringify({ ok: true });
    const secret = "super-secret";
    const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    expect(validateWebhookSignature(payload, `sha256=${digest}`, secret)).toBe(true);
    expect(validateWebhookSignature(payload, `sha256=${digest}ZZ`, secret)).toBe(false);
    expect(validateWebhookSignature(payload, "not-hex-signature", secret)).toBe(false);
  });

  it("rejects invalid timestamps", () => {
    expect(validateWebhookTimestamp(Number.NaN)).toBe(false);
    expect(validateWebhookTimestamp(0)).toBe(false);
  });
});
