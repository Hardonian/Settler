import { createHmac } from "crypto";
import {
  verifyStripeWebhook,
  verifyPlaidWebhook,
  verifyChargebeeWebhook,
  verifyRecurlyWebhook,
  verifyWebhook,
} from "../webhook-verification";

describe("Webhook Verification", () => {
  const secret = "test_secret_key";
  const payload = JSON.stringify({ id: "evt_123", type: "payment.succeeded" });

  describe("verifyStripeWebhook", () => {
    it("should return valid for a correct signature", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payload}`;
      const signatureHash = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const signatureHeader = `t=${timestamp},v1=${signatureHash}`;

      const result = verifyStripeWebhook(payload, signatureHeader, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return valid when multiple signatures exist and one is correct", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payload}`;
      const validSignatureHash = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const invalidSignatureHash = "badhash";
      const signatureHeader = `t=${timestamp},v1=${invalidSignatureHash},v1=${validSignatureHash}`;

      const result = verifyStripeWebhook(payload, signatureHeader, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return invalid for an incorrect signature", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const invalidSignatureHash = "badhash";
      const signatureHeader = `t=${timestamp},v1=${invalidSignatureHash}`;

      const result = verifyStripeWebhook(payload, signatureHeader, secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature" });
    });

    it("should return invalid format if timestamp is missing", () => {
      const signedPayload = `1234567890.${payload}`;
      const signatureHash = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const signatureHeader = `v1=${signatureHash}`; // missing t=

      const result = verifyStripeWebhook(payload, signatureHeader, secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature format" });
    });

    it("should return invalid format if signatures are missing", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signatureHeader = `t=${timestamp}`; // missing v1=

      const result = verifyStripeWebhook(payload, signatureHeader, secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature format" });
    });
  });

  describe("verifyPlaidWebhook", () => {
    it("should return valid for a correct signature", () => {
      const signatureHash = createHmac("sha256", secret).update(payload).digest("hex");
      const result = verifyPlaidWebhook(payload, signatureHash, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return invalid for an incorrect signature", () => {
      const result = verifyPlaidWebhook(payload, "invalid_signature", secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature" });
    });
  });

  describe("verifyChargebeeWebhook", () => {
    it("should return valid for a correct signature", () => {
      const signatureHash = createHmac("sha256", secret).update(payload).digest("hex");
      const result = verifyChargebeeWebhook(payload, signatureHash, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return invalid for an incorrect signature", () => {
      const result = verifyChargebeeWebhook(payload, "invalid_signature", secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature" });
    });
  });

  describe("verifyRecurlyWebhook", () => {
    it("should return valid for a correct signature", () => {
      const signatureHash = createHmac("sha1", secret).update(payload).digest("hex");
      const result = verifyRecurlyWebhook(payload, signatureHash, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return invalid for an incorrect signature", () => {
      const result = verifyRecurlyWebhook(payload, "invalid_signature", secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature" });
    });
  });

  describe("verifyWebhook (Router)", () => {
    it("should route to verifyStripeWebhook for stripe", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payload}`;
      const signatureHash = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const signatureHeader = `t=${timestamp},v1=${signatureHash}`;

      const result = verifyWebhook("stripe", payload, signatureHeader, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should route to verifyStripeWebhook for stripe-connect", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payload}`;
      const signatureHash = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const signatureHeader = `t=${timestamp},v1=${signatureHash}`;

      const result = verifyWebhook("stripe-connect", payload, signatureHeader, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should route to verifyPlaidWebhook for plaid", () => {
      const signatureHash = createHmac("sha256", secret).update(payload).digest("hex");
      const result = verifyWebhook("plaid", payload, signatureHash, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should route to verifyChargebeeWebhook for chargebee", () => {
      const signatureHash = createHmac("sha256", secret).update(payload).digest("hex");
      const result = verifyWebhook("chargebee", payload, signatureHash, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should route to verifyRecurlyWebhook for recurly", () => {
      const signatureHash = createHmac("sha1", secret).update(payload).digest("hex");
      const result = verifyWebhook("recurly", payload, signatureHash, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return valid by default for unknown providers", () => {
      const result = verifyWebhook("unknown-provider", payload, "any-signature", secret);
      expect(result).toEqual({ valid: true });
    });
  });
});
