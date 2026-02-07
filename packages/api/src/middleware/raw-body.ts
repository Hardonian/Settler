/**
 * Raw Body Middleware for Webhook Signature Verification
 *
 * Essential for correctly verifying webhook signatures from providers like Stripe,
 * which require the raw request body to be used for signature calculation.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Extended Request interface with raw body storage
 */
export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
  rawBodyString?: string;
}

/**
 * Options for raw body middleware
 */
export interface RawBodyMiddlewareOptions {
  /**
   * Encoding to use for raw body (default: 'utf8')
   */
  encoding?: BufferEncoding;

  /**
   * Maximum request body size (default: '1mb')
   */
  limit?: string | number;

  /**
   * Content types to process (default: only JSON for webhooks)
   */
  contentTypes?: string[];

  /**
   * Verify that content type matches (default: true)
   */
  strict?: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<RawBodyMiddlewareOptions> = {
  encoding: "utf8",
  limit: "1mb",
  contentTypes: ["application/json"],
  strict: true,
};

/**
 * Create raw body middleware for webhook endpoints
 *
 * This middleware captures the raw request body for signature verification
 * while still allowing normal JSON parsing for request handling.
 *
 * Usage:
 *   app.use('/webhooks', createRawBodyMiddleware());
 *   app.post('/webhooks/stripe', webhookHandler);
 *
 * @param options Configuration options
 * @returns Express middleware function
 */
export function createRawBodyMiddleware(options: RawBodyMiddlewareOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return function rawBodyMiddleware(req: RawBodyRequest, res: Response, next: NextFunction): void {
    // Skip for non-webhook content types
    const contentType = req.get("content-type") || "";
    const isWebhookContent = opts.contentTypes.some((ct) => contentType.includes(ct));

    if (!isWebhookContent) {
      return next();
    }

    // Collect raw body
    const chunks: Buffer[] = [];
    let totalLength = 0;

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      totalLength += chunk.length;

      // Check size limit
      const maxBytes = typeof opts.limit === "string" ? parseSize(opts.limit) : opts.limit;

      if (totalLength > maxBytes) {
        return next(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      try {
        const rawBody = Buffer.concat(chunks, totalLength);

        // Store raw body on request
        req.rawBody = rawBody;
        req.rawBodyString = rawBody.toString(opts.encoding);

        // Continue with JSON parsing if needed
        if (contentType.includes("application/json")) {
          try {
            (req as unknown as { body: unknown }).body = JSON.parse(req.rawBodyString);
          } catch {
            // If JSON parsing fails, still allow request to proceed
            // Validation middleware will handle errors
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    });

    req.on("error", (error) => {
      next(error);
    });
  };
}

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb|tb)?$/);
  if (!match || !match[1]) {
    return 1024 * 1024; // Default 1MB
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] || "b") as keyof typeof units;
  return value * (units[unit] || 1);
}

/**
 * Alternative: Express raw body parser using body-parser
 *
 * This provides more robust parsing but requires body-parser as dependency.
 * Use this if you need better error handling and streaming support.
 *
 * @param options Configuration options
 * @returns Express middleware function
 */
export function createRawBodyParser(options: RawBodyMiddlewareOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async function rawBodyParser(
    req: RawBodyRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const chunks: Buffer[] = [];
      let totalLength = 0;

      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          totalLength += chunk.length;

          const maxBytes = typeof opts.limit === "string" ? parseSize(opts.limit) : opts.limit;

          if (totalLength > maxBytes) {
            reject(new Error("Request body too large"));
          }
        });

        req.on("end", resolve);
        req.on("error", reject);
      });

      const rawBody = Buffer.concat(chunks, totalLength);
      req.rawBody = rawBody;
      req.rawBodyString = rawBody.toString(opts.encoding);

      // Parse JSON if applicable
      if (req.get("content-type")?.includes("application/json")) {
        try {
          (req as unknown as { body: unknown }).body = JSON.parse(req.rawBodyString);
        } catch {
          // JSON parsing errors will be handled by validation
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get raw body for signature verification
 *
 * Utility function to get the raw body in a format suitable for
 * HMAC signature calculation.
 *
 * @param req Express request
 * @returns Raw body as string, or undefined if not available
 */
export function getRawBodyForSignature(req: RawBodyRequest): string | undefined {
  // Prefer rawBodyString if available
  if (req.rawBodyString) {
    return req.rawBodyString;
  }

  // Fallback to rawBody buffer
  if (req.rawBody) {
    return req.rawBody.toString("utf8");
  }

  // Last resort: reconstruct from parsed body (NOT RECOMMENDED)
  if ((req as unknown as { body: unknown }).body) {
    return JSON.stringify((req as unknown as { body: unknown }).body);
  }

  return undefined;
}

/**
 * Verify webhook signature using raw body
 *
 * @param req Express request
 * @param signature Expected signature
 * @param secret Webhook secret
 * @param algorithm Hash algorithm (default: sha256)
 * @returns True if signature matches
 */
export async function verifyWebhookSignatureWithRawBody(
  req: RawBodyRequest,
  signature: string,
  secret: string,
  algorithm: string = "sha256"
): Promise<boolean> {
  const rawBody = getRawBodyForSignature(req);

  if (!rawBody) {
    throw new Error("No raw body available for signature verification");
  }

  const crypto = await import("crypto");
  const expectedSignature = crypto.createHmac(algorithm, secret).update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Stripe-specific signature verification
 *
 * Handles Stripe's signature format: t={timestamp},v1={signature}
 *
 * @param req Express request
 * @param signature Stripe signature header
 * @param secret Stripe webhook secret
 * @param tolerance Timestamp tolerance in seconds (default: 300)
 * @returns True if signature is valid
 */
export async function verifyStripeSignature(
  req: RawBodyRequest,
  signature: string,
  secret: string,
  tolerance: number = 300
): Promise<boolean> {
  const rawBody = getRawBodyForSignature(req);

  if (!rawBody) {
    throw new Error("No raw body available for Stripe signature verification");
  }

  // Parse Stripe signature format
  const elements = signature.split(",");
  const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
  const signatures = elements.filter((e) => e.startsWith("v1=")).map((e) => e.split("=")[1]);

  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Stripe signature format");
  }

  // Check timestamp
  const requestTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - requestTime);

  if (timeDiff > tolerance) {
    throw new Error(`Webhook timestamp too old: ${timeDiff}s`);
  }

  // Create signed payload
  const signedPayload = `${timestamp}.${rawBody}`;
  const crypto = await import("crypto");

  // Verify each signature
  const isValid = signatures.some((sig) => {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (!sig || !expectedSignature) {
      return false;
    }

    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  });

  return isValid;
}

/**
 * Shopify-specific signature verification
 *
 * Shopify uses HMAC-SHA256 with base64 encoding.
 *
 * @param req Express request
 * @param signature Shopify HMAC header
 * @param secret Shopify webhook secret
 * @returns True if signature matches
 */
export async function verifyShopifySignature(
  req: RawBodyRequest,
  signature: string,
  secret: string
): Promise<boolean> {
  const rawBody = getRawBodyForSignature(req);

  if (!rawBody) {
    throw new Error("No raw body available for Shopify signature verification");
  }

  const crypto = await import("crypto");
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
