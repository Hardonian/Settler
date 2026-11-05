/**
 * ETag Middleware
 * Implements RFC 7232 HTTP ETags with SHA-256 for deterministic cache validation on GET/HEAD requests
 */

import { Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";

export interface ETagRequest extends Request {
  etag?: string;
}

/**
 * Normalizes an ETag by stripping weak validator prefix 'W/' and outer quotes
 */
export function normalizeETag(tag: string): string {
  let cleaned = tag.trim();
  if (cleaned.startsWith("W/") || cleaned.startsWith("w/")) {
    cleaned = cleaned.substring(2).trim();
  }
  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
}

/**
 * Evaluates whether an incoming HTTP header matches the resource's current ETag according to RFC 7232
 */
export function isETagMatch(
  headerValue: string | string[] | undefined,
  currentETag: string
): boolean {
  if (!headerValue) return false;
  const headerStr = Array.isArray(headerValue) ? headerValue.join(",") : headerValue;
  const normalizedCurrent = normalizeETag(currentETag);

  const candidates = headerStr.split(",").map((c) => c.trim());
  for (const candidate of candidates) {
    if (candidate === "*") return true;
    if (normalizeETag(candidate) === normalizedCurrent) return true;
  }
  return false;
}

/**
 * Generate cryptographically sound, collision-resistant ETag using SHA-256
 */
export function generateETag(body: string | Buffer): string {
  const digest = createHash("sha256").update("settler:etag:v1\0").update(body).digest("hex");
  return `"${digest.substring(0, 32)}"`;
}

/**
 * ETag middleware for GET and HEAD requests
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to GET/HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send
  res.send = function (body: unknown) {
    const bodyContent =
      typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    const etag = generateETag(bodyContent);

    res.setHeader("ETag", etag);

    const ifNoneMatch = req.headers["if-none-match"];
    if (isETagMatch(ifNoneMatch, etag)) {
      res.status(304).end();
      return res;
    }

    return originalSend.call(this, body);
  };

  // Override res.json
  res.json = function (body: unknown) {
    const bodyString = JSON.stringify(body);
    const etag = generateETag(bodyString);

    res.setHeader("ETag", etag);

    const ifNoneMatch = req.headers["if-none-match"];
    if (isETagMatch(ifNoneMatch, etag)) {
      res.status(304).end();
      return res;
    }

    return originalJson.call(this, body);
  };

  next();
}

/**
 * Generate ETag from data object (for manual ETag generation)
 */
export function generateETagFromData(data: unknown): string {
  return generateETag(JSON.stringify(data));
}
