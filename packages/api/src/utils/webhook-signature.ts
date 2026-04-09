import crypto from "crypto";
import { getWebhookSecretForTenant } from "./webhook-secret";

export async function verifyWebhookSignature(
  adapter: string,
  payload: string | Buffer,
  signature: string,
  tenantId: string
): Promise<boolean> {
  const normalizedAdapter = adapter.trim().toLowerCase();
  const config = await getWebhookSecretForTenant(normalizedAdapter, tenantId);

  if (!config) {
    throw new Error(`Webhook secret not configured for adapter: ${normalizedAdapter}`);
  }
  const payloadBuffer = typeof payload === "string" ? Buffer.from(payload) : payload;

  switch (normalizedAdapter) {
    case "stripe": {
      // Stripe uses HMAC-SHA256 with hex encoding
      const expectedSignature = crypto
        .createHmac("sha256", config.secret)
        .update(payloadBuffer)
        .digest("hex");

      // Use timing-safe comparison
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }

    case "shopify": {
      // Shopify uses HMAC-SHA256 with base64 encoding
      const hmac = crypto
        .createHmac("sha256", config.secret)
        .update(payloadBuffer)
        .digest("base64");

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
    }

    case "paypal": {
      // PayPal uses HMAC-SHA256
      const hmac = crypto.createHmac("sha256", config.secret).update(payloadBuffer).digest("hex");

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
    }

    default: {
      // Default to HMAC-SHA256
      const algorithm = config.signature_algorithm || "hmac-sha256";
      if (algorithm === "hmac-sha256") {
        const hmac = crypto.createHmac("sha256", config.secret).update(payloadBuffer).digest("hex");

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
      }
      throw new Error(`Unsupported signature algorithm: ${algorithm}`);
    }
  }
}

export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string,
  algorithm: string = "hmac-sha256"
): string {
  const payloadBuffer = typeof payload === "string" ? Buffer.from(payload) : payload;

  if (algorithm === "hmac-sha256") {
    return crypto.createHmac("sha256", secret).update(payloadBuffer).digest("hex");
  }

  throw new Error(`Unsupported signature algorithm: ${algorithm}`);
}
