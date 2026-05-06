import { verifyPlaidWebhook, WebhookVerificationResult } from "../webhook-verification";
import { createHmac } from "crypto";

describe("verifyPlaidWebhook", () => {
  const secret = "my-super-secret-key";
  const payload = JSON.stringify({ item_id: "item-123", webhook_code: "DEFAULT_UPDATE" });

  it("should return valid=true for a correct signature", () => {
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    const result: WebhookVerificationResult = verifyPlaidWebhook(payload, signature, secret);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return valid=false for an incorrect signature", () => {
    const incorrectSignature = createHmac("sha256", "wrong-secret").update(payload).digest("hex");
    const result: WebhookVerificationResult = verifyPlaidWebhook(
      payload,
      incorrectSignature,
      secret
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid signature");
  });

  it("should handle errors thrown during verification", () => {
    // Passing null as secret to trigger crypto.createHmac error
    // @ts-expect-error Intentionally passing invalid type for testing error handling
    const result: WebhookVerificationResult = verifyPlaidWebhook(payload, "signature", null);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    // In jest environments error from node core might not be instanceof Error, so we just check it returns a string
    expect(typeof result.error).toBe("string");
  });
});
