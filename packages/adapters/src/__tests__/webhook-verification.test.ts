import { verifyStripeWebhook } from "../webhook-verification";
import { createHmac } from "crypto";

describe("webhook-verification", () => {
  describe("verifyStripeWebhook", () => {
    const secret = "whsec_test_secret";
    const payload = JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" });

    it("should return valid for a correct signature", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payload}`;
      const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const header = `t=${timestamp},v1=${signature}`;

      const result = verifyStripeWebhook(payload, header, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return valid when multiple v1 signatures are present and one matches", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payload}`;
      const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
      const invalidSignature = "invalid_sig_hex";
      const header = `t=${timestamp},v1=${invalidSignature},v1=${signature}`;

      const result = verifyStripeWebhook(payload, header, secret);
      expect(result).toEqual({ valid: true });
    });

    it("should return invalid for an incorrect signature", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const header = `t=${timestamp},v1=invalid_signature`;

      const result = verifyStripeWebhook(payload, header, secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature" });
    });

    it("should return invalid for missing timestamp", () => {
      const signature = createHmac("sha256", secret).update(`12345.${payload}`).digest("hex");
      const header = `v1=${signature}`;

      const result = verifyStripeWebhook(payload, header, secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature format" });
    });

    it("should return invalid for missing v1 signatures", () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const header = `t=${timestamp}`;

      const result = verifyStripeWebhook(payload, header, secret);
      expect(result).toEqual({ valid: false, error: "Invalid signature format" });
    });
  });
});
