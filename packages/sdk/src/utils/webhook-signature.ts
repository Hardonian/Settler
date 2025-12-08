/**
 * Webhook signature verification utility
 * Works in both Node.js and browser environments
 */

/**
 * Gets the crypto implementation (Node.js or Web Crypto API)
 */
function getCrypto(): {
  createHmac: (algorithm: string, secret: string) => {
    update: (data: string) => void;
    digest: (encoding: string) => string;
  };
  timingSafeEqual?: (a: Buffer, b: Buffer) => boolean;
} {
  // Node.js environment
  if (typeof require !== "undefined") {
    try {
      const crypto = require("crypto");
      return crypto;
    } catch {
      // Fall through to Web Crypto API
    }
  }

  // Browser/Web Crypto API fallback
  // Note: Web Crypto API doesn't support HMAC in the same way, so we use a polyfill
  // For production, consider using a library like crypto-js or @noble/hashes
  throw new Error(
    "Webhook signature verification requires Node.js crypto module or a crypto library"
  );
}

/**
 * Verifies a webhook signature using HMAC-SHA256
 * 
 * @param payload - The raw request body (as string or Buffer)
 * @param signature - The signature from the X-Settler-Signature header
 * @param secret - Your webhook secret
 * @returns true if the signature is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = verifyWebhookSignature(
 *   request.body,
 *   request.headers['x-settler-signature'],
 *   'your_webhook_secret'
 * );
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Buffer | ArrayBuffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Extract timestamp and signature from header
  // Format: t=<timestamp>,v1=<signature>
  const parts = signature.split(",");
  const signaturePart = parts.find((p) => p.startsWith("v1="));
  if (!signaturePart) {
    return false;
  }

  const expectedSignature = signaturePart.substring(3);

  try {
    const crypto = getCrypto();
    const hmac = crypto.createHmac("sha256", secret);
    
    // Convert payload to string
    let payloadString: string;
    if (typeof payload === "string") {
      payloadString = payload;
    } else if (Buffer.isBuffer(payload)) {
      payloadString = payload.toString();
    } else if (payload instanceof ArrayBuffer) {
      payloadString = Buffer.from(payload).toString();
    } else {
      payloadString = String(payload);
    }
    
    hmac.update(payloadString);
    const calculatedSignature = hmac.digest("hex");

    // Use constant-time comparison to prevent timing attacks (Node.js only)
    if (crypto.timingSafeEqual) {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(calculatedSignature, "hex")
      );
    }

    // Fallback for environments without timingSafeEqual (use constant-time comparison)
    if (expectedSignature.length !== calculatedSignature.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ calculatedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Extracts the timestamp from a webhook signature header
 * 
 * @param signature - The signature from the X-Settler-Signature header
 * @returns The timestamp in milliseconds, or null if not found
 */
export function extractWebhookTimestamp(signature: string): number | null {
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  if (!timestampPart) {
    return null;
  }

  const timestamp = parseInt(timestampPart.substring(2), 10);
  return isNaN(timestamp) ? null : timestamp * 1000; // Convert to milliseconds
}

/**
 * Verifies webhook signature and checks timestamp to prevent replay attacks
 * 
 * @param payload - The raw request body
 * @param signature - The signature from the X-Settler-Signature header
 * @param secret - Your webhook secret
 * @param maxAge - Maximum age of the webhook in milliseconds (default: 5 minutes)
 * @returns true if valid and not expired, false otherwise
 */
export function verifyWebhookSignatureWithTimestamp(
  payload: string | Buffer | ArrayBuffer,
  signature: string,
  secret: string,
  maxAge: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return false;
  }

  const timestamp = extractWebhookTimestamp(signature);
  if (!timestamp) {
    return false;
  }

  const age = Date.now() - timestamp;
  return age >= 0 && age <= maxAge;
}
