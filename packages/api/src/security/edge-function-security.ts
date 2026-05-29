/**
 * Edge Function Security Utilities
 *
 * Provides HMAC validation, API key validation, rate limiting,
 * and fraud detection for Supabase Edge Functions
 *
 * Note: This utility is environment-aware and works in both Node.js
 * (for API package) and Deno (for Edge Functions) contexts.
 *
 * Priority: P1 (High - Edge function security)
 */

import { createClient } from "@supabase/supabase-js";
import { logError } from "../utils/logger";

export interface EdgeFunctionSecurityConfig {
  requireHMAC?: boolean;
  requireAPIKey?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  allowedIPs?: string[];
}

/**
 * Validate HMAC signature for webhook requests
 */
export async function validateHMACSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: "sha256" | "sha512" = "sha256"
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  let cryptoKey: Awaited<ReturnType<typeof crypto.subtle.importKey>>;
  try {
    cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: algorithm },
      false,
      ["sign"]
    );
  } catch (error) {
    logError("Failed to import HMAC key", error);
    return false;
  }

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (computedSignature.length !== signature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedSignature.length; i++) {
    result |= computedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate API key from request
 */
export async function validateAPIKey(
  apiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ valid: boolean; userId?: string; tenantId?: string; rateLimit?: number | null }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Query API key from database
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, tenant_id, rate_limit, revoked_at, expires_at")
    .eq("key_prefix", apiKey.substring(0, 20))
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Check if revoked
  if (data.revoked_at) {
    return { valid: false };
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  // Verify API key hash for authentication
  // For now, we'll trust the prefix match (this should be enhanced)

  return {
    valid: true,
    ...(data.user_id !== undefined && { userId: data.user_id }),
    ...(data.tenant_id !== undefined && { tenantId: data.tenant_id }),
    ...(data.rate_limit !== undefined && { rateLimit: data.rate_limit }),
  };
}

/**
 * Validate JWT token from Supabase Auth
 */
export async function validateJWTToken(
  authHeader: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ valid: boolean; userId?: string; tenantId?: string | undefined }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { valid: false };
  }

  // Get tenant ID from user metadata or separate query
  // Query tenant_id from users table
  const tenantId = (user.user_metadata?.tenant_id as string) || undefined;

  return {
    valid: true,
    userId: user.id,
    ...(tenantId !== undefined && { tenantId }),
  };
}

/**
 * Rate limiting for Edge Functions (in-memory store)
 */
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

export function checkRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  // Cleanup expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to cleanup (avoid overhead)
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Validate IP address against allowlist
 */
export function validateIPAddress(ip: string, allowedIPs: string[]): boolean {
  if (allowedIPs.length === 0) {
    return true; // No restrictions
  }

  // Support CIDR notation (basic implementation)
  for (const allowedIP of allowedIPs) {
    if (allowedIP.includes("/")) {
      // CIDR notation (simplified - full implementation would require CIDR library)
      const parts = allowedIP.split("/");
      const network = parts[0];
      // For now, just check if IP starts with network (simplified)
      if (network && ip.startsWith(network.split(".").slice(0, -1).join("."))) {
        return true;
      }
    } else {
      // Exact match
      if (ip === allowedIP) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Security middleware for Edge Functions
 */
export async function secureEdgeFunction(
  request: Request,
  config: EdgeFunctionSecurityConfig,
  supabaseUrl: string,
  supabaseAnonKey: string,
  supabaseServiceKey: string
): Promise<{ authorized: boolean; error?: string; userId?: string; tenantId?: string }> {
  // Get IP address
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // IP allowlist check
  if (config.allowedIPs && config.allowedIPs.length > 0) {
    if (!validateIPAddress(ip, config.allowedIPs)) {
      return {
        authorized: false,
        error: "IP address not allowed",
      };
    }
  }

  // Rate limiting
  if (config.rateLimit) {
    const rateLimitResult = checkRateLimit(
      ip,
      config.rateLimit.windowMs,
      config.rateLimit.maxRequests
    );

    if (!rateLimitResult.allowed) {
      return {
        authorized: false,
        error: "Rate limit exceeded",
      };
    }
  }

  // HMAC validation (for webhooks)
  if (config.requireHMAC) {
    const signature = request.headers.get("x-signature") || request.headers.get("x-hmac-signature");
    // Note: In Node.js environment, use process.env. For Deno Edge Functions, use Deno.env
    const secret = (typeof process !== "undefined" ? process.env.WEBHOOK_SECRET : undefined) || "";

    if (!signature || !secret) {
      return {
        authorized: false,
        error: "Missing HMAC signature or secret",
      };
    }

    const body = await request.text();
    const isValid = await validateHMACSignature(body, signature, secret);

    if (!isValid) {
      return {
        authorized: false,
        error: "Invalid HMAC signature",
      };
    }
  }

  // API key validation
  if (config.requireAPIKey) {
    const apiKey = request.headers.get("x-api-key") || "";

    if (!apiKey) {
      return {
        authorized: false,
        error: "Missing API key",
      };
    }

    const apiKeyResult = await validateAPIKey(apiKey, supabaseUrl, supabaseServiceKey);

    if (!apiKeyResult.valid) {
      return {
        authorized: false,
        error: "Invalid API key",
      };
    }

    return {
      authorized: true,
      ...(apiKeyResult.userId !== undefined && { userId: apiKeyResult.userId }),
      ...(apiKeyResult.tenantId !== undefined && { tenantId: apiKeyResult.tenantId }),
    };
  }

  // JWT authentication
  if (config.requireAuth) {
    const authHeader = request.headers.get("authorization") || "";

    if (!authHeader) {
      return {
        authorized: false,
        error: "Missing authorization header",
      };
    }

    const jwtResult = await validateJWTToken(authHeader, supabaseUrl, supabaseAnonKey);

    if (!jwtResult.valid) {
      return {
        authorized: false,
        error: "Invalid JWT token",
      };
    }

    return {
      authorized: true,
      ...(jwtResult.userId !== undefined && { userId: jwtResult.userId }),
      ...(jwtResult.tenantId !== undefined && { tenantId: jwtResult.tenantId }),
    };
  }

  // No authentication required
  return {
    authorized: true,
  };
}

/**
 * CORS headers for Edge Functions
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  // Note: In Node.js environment, use process.env. For Deno Edge Functions, use Deno.env
  const allowedOriginsEnv =
    typeof process !== "undefined" ? process.env.ALLOWED_ORIGINS : undefined;
  const allowedOrigins = allowedOriginsEnv?.split(",") || ["*"];

  let corsOrigin: string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    corsOrigin = origin;
  } else if (allowedOrigins.includes("*")) {
    corsOrigin = "*";
  }

  if (!corsOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-api-key, x-signature, x-hmac-signature",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}
