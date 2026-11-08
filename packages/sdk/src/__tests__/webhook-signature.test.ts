import { describe, it, expect } from "@jest/globals";
import {
  signWebhookPayload,
  verifyWebhookSignature,
  verifyWebhookSignatureWithTimestamp,
  extractWebhookTimestamp,
} from "../utils/webhook-signature";

describe("Webhook Signature Verification", () => {
  const secret = "test_secret";
  const payload = JSON.stringify({ event: "test", data: {} });

  it("should verify a valid signature", () => {
    const crypto = require("crypto");
    const timestamp = Math.floor(Date.now() / 1000);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const signature = hmac.digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(verifyWebhookSignature(payload, header, secret)).toBe(true);
  });

  it("should reject an invalid signature", () => {
    const header = "t=1234567890,v1=invalid_signature";
    expect(verifyWebhookSignature(payload, header, secret)).toBe(false);
  });

  it("should reject signature with wrong secret", () => {
    const crypto = require("crypto");
    const timestamp = Math.floor(Date.now() / 1000);
    const hmac = crypto.createHmac("sha256", "wrong_secret");
    hmac.update(payload);
    const signature = hmac.digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(verifyWebhookSignature(payload, header, secret)).toBe(false);
  });

  it("should extract timestamp from signature", () => {
    const timestamp = 1234567890;
    const header = `t=${timestamp},v1=abc123`;
    const extracted = extractWebhookTimestamp(header);
    expect(extracted).toBe(timestamp * 1000);
  });

  it("should verify signature with timestamp check", () => {
    const crypto = require("crypto");
    const timestamp = Math.floor(Date.now() / 1000);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const signature = hmac.digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(verifyWebhookSignatureWithTimestamp(payload, header, secret, 60000)).toBe(true);
  });

  it("should reject expired signature", () => {
    const crypto = require("crypto");
    const timestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const signature = hmac.digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(
      verifyWebhookSignatureWithTimestamp(payload, header, secret, 300000) // 5 minutes max age
    ).toBe(false);
  });

  it("should sign and verify canonical timestamp-bound signatures (t.payload) and reject timestamp tampering under strict mode", () => {
    const ts = Math.floor(Date.now() / 1000);
    const signedHeader = signWebhookPayload(payload, secret, ts);

    expect(
      verifyWebhookSignature(payload, signedHeader, secret, { requireTimestampBinding: true })
    ).toBe(true);

    // Tampering with t= header invalidates timestamp-bound HMAC
    const tamperedHeader = signedHeader.replace(`t=${ts}`, `t=${ts + 60}`);
    expect(
      verifyWebhookSignature(payload, tamperedHeader, secret, { requireTimestampBinding: true })
    ).toBe(false);
  });
});
