/**
 * Webhook Verification
 *
 * Verifies webhook signatures from various providers
 * SECURITY: All comparisons use timing-safe methods to prevent timing attacks
 */

import { createHmac, timingSafeEqual } from "crypto";

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Timing-safe comparison of two hex strings
 */
function safeCompareHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify Stripe webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const elements = signature.split(",");
    const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
    const signatures = elements.filter((e) => e.startsWith("v1=")).map((e) => e.split("=")[1]);

    if (!timestamp || signatures.length === 0) {
      return { valid: false, error: "Invalid signature format" };
    }

    // Check timestamp tolerance (5 minutes)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      return { valid: false, error: "Webhook timestamp too old" };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

    // Use timing-safe comparison
    const isValid = signatures.some((sig) => {
      if (!sig) return false;
      return safeCompareHex(expectedSignature, sig);
    });

    return { valid: isValid, error: isValid ? undefined : "Invalid signature" };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

/**
 * Verify Plaid webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyPlaidWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");

    // Use timing-safe comparison instead of ===
    const isValid = safeCompareHex(expectedSignature, signature);
    return { valid: isValid, error: isValid ? undefined : "Invalid signature" };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

/**
 * Verify Chargebee webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyChargebeeWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");

    // Use timing-safe comparison instead of ===
    const isValid = safeCompareHex(expectedSignature, signature);
    return { valid: isValid, error: isValid ? undefined : "Invalid signature" };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

/**
 * Verify Recurly webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyRecurlyWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = createHmac("sha1", secret).update(payload).digest("hex");

    // Use timing-safe comparison instead of ===
    const isValid = safeCompareHex(expectedSignature, signature);
    return { valid: isValid, error: isValid ? undefined : "Invalid signature" };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

/**
 * Verify webhook signature based on provider
 * SECURITY: Unknown providers are rejected by default
 */
export function verifyWebhook(
  providerId: string,
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  switch (providerId.toLowerCase()) {
    case "stripe":
    case "stripe-connect":
      return verifyStripeWebhook(payload, signature, secret);
    case "plaid":
      return verifyPlaidWebhook(payload, signature, secret);
    case "chargebee":
      return verifyChargebeeWebhook(payload, signature, secret);
    case "recurly":
      return verifyRecurlyWebhook(payload, signature, secret);
    default:
      // SECURITY: Reject unknown providers instead of accepting them
      return { valid: false, error: `Unknown webhook provider: ${providerId}` };
  }
}
