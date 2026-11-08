/**
 * Webhook signature verification utility
 * Works in both Node.js and browser environments
 */

/**
 * Gets the crypto implementation (Node.js or Web Crypto API)
 */
interface CryptoModule {
  createHmac: (
    algorithm: string,
    secret: string
  ) => {
    update: (data: string) => void;
    digest: (encoding: string) => string;
  };
  timingSafeEqual?: (a: Buffer, b: Buffer) => boolean;
}

function getCrypto(): CryptoModule {
  // Node.js environment
  if (typeof require !== "undefined") {
    try {
      const crypto = require("crypto") as CryptoModule;
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
function constantTimeHexEquals(
  crypto: CryptoModule,
  expectedHex: string,
  calculatedHex: string
): boolean {
  if (expectedHex.length !== calculatedHex.length) {
    return false;
  }
  if (crypto.timingSafeEqual && /^[a-f0-9]+$/i.test(expectedHex)) {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(calculatedHex, "hex");
    if (a.length === b.length) {
      return crypto.timingSafeEqual(a, b);
    }
  }
  let result = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    result |= expectedHex.charCodeAt(i) ^ calculatedHex.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generates a timestamp-bound HMAC-SHA256 webhook signature header (`t=<ts>,v1=<sig>`)
 */
export function signWebhookPayload(
  payload: string | Buffer,
  secret: string,
  timestampSeconds: number = Math.floor(Date.now() / 1000)
): string {
  const crypto = getCrypto();
  const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${timestampSeconds}.${payloadString}`);
  const sig = hmac.digest("hex");
  return `t=${timestampSeconds},v1=${sig}`;
}

export function verifyWebhookSignature(
  payload: string | Buffer | ArrayBuffer,
  signature: string,
  secret: string,
  options?: { requireTimestampBinding?: boolean }
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

  const timestampPart = parts.find((p) => p.startsWith("t="));
  const rawTimestamp = timestampPart ? timestampPart.substring(2) : null;
  const expectedSignature = signaturePart.substring(3);

  try {
    const crypto = getCrypto();

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

    // 1. Canonical timestamp-bound signature: HMAC(secret, `${timestamp}.${payload}`)
    if (rawTimestamp) {
      const boundHmac = crypto.createHmac("sha256", secret);
      boundHmac.update(`${rawTimestamp}.${payloadString}`);
      const boundCalculated = boundHmac.digest("hex");
      if (constantTimeHexEquals(crypto, expectedSignature, boundCalculated)) {
        return true;
      }
      if (options?.requireTimestampBinding) {
        return false;
      }
    } else if (options?.requireTimestampBinding) {
      return false;
    }

    // 2. Legacy payload-only signature fallback
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadString);
    const calculatedSignature = hmac.digest("hex");

    return constantTimeHexEquals(crypto, expectedSignature, calculatedSignature);
  } catch {
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
