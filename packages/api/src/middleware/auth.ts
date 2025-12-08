import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db";
import { verifyApiKey } from "../utils/hash";
import { logWarn, logError } from "../utils/logger";
import { config } from "../config";

export interface AuthRequest extends Request {
  userId?: string;
  apiKeyId?: string;
  apiKey?: string;
  traceId?: string;
  tenantId?: string;
}

/**
 * Express middleware for API key or JWT token authentication.
 * 
 * Supports two authentication methods:
 * 1. API Key: `X-API-Key` header with `rk_` prefix
 * 2. JWT Token: `Authorization: Bearer <token>` header
 * 
 * On success, attaches `userId` and `apiKeyId` (if API key) to `req`.
 * On failure, returns 401 Unauthorized.
 * 
 * @example
 * ```typescript
 * app.use("/api/v1", authMiddleware, protectedRouter);
 * ```
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for API key in header
    const apiKey = req.headers["x-api-key"] as string;
    if (apiKey) {
      try {
        await validateApiKey(req, apiKey);
        return next();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Invalid API key";
        logWarn('API key validation failed', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          error: message,
        });
        res.status(401).json({
          error: "Unauthorized",
          message,
        });
        return;
      }
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        await validateJWT(req, authHeader.substring(7));
        return next();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "The provided token is invalid or expired";
        logWarn('JWT validation failed', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          error: message,
        });
        res.status(401).json({
          error: "Invalid Token",
          message,
        });
        return;
      }
    }

    // No auth provided
    res.status(401).json({
      error: "Unauthorized",
      message: "API key or Bearer token required",
    });
  } catch (error) {
    logError('Auth middleware error', error);
    next(error);
  }
};

async function validateApiKey(req: AuthRequest, apiKey: string): Promise<void> {
  if (!apiKey.startsWith("rk_")) {
    throw new Error("Invalid API key format");
  }

  // Extract prefix for database lookup
  const prefix = apiKey.substring(0, 12);
  
  // Lookup API key in database
  const keys = await query<{
    id: string;
    user_id: string;
    key_hash: string;
    scopes: string[];
    rate_limit: number;
    revoked_at: Date | null;
    expires_at: Date | null;
  }>(
    `SELECT id, user_id, key_hash, scopes, rate_limit, revoked_at, expires_at
     FROM api_keys
     WHERE key_prefix = $1`,
    [prefix]
  );

  if (keys.length === 0) {
    // Log failed attempt for security monitoring
    await query(
      `INSERT INTO audit_logs (event, ip, user_agent, path, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'api_key_auth_failed',
        req.ip || null,
        req.headers['user-agent'] || null,
        req.path,
        JSON.stringify({ keyPrefix: prefix }),
      ]
    );
    throw new Error("Invalid API key");
  }

  if (!keys[0]) {
    throw new Error("Invalid API key");
  }
  const keyRecord = keys[0];

  // Verify full key against hash
  const isValid = await verifyApiKey(apiKey, keyRecord.key_hash);
  if (!isValid) {
    // Log failed attempt
    await query(
      `INSERT INTO audit_logs (event, api_key_id, ip, user_agent, path, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'api_key_auth_failed',
        keyRecord.id,
        req.ip || null,
        req.headers['user-agent'] || null,
        req.path,
        JSON.stringify({ keyPrefix: prefix }),
      ]
    );
    throw new Error("Invalid API key");
  }

  // Check if key is revoked or expired
  if (keyRecord.revoked_at) {
    throw new Error("API key has been revoked");
  }

  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    throw new Error("API key has expired");
  }

  // Update last used timestamp
  await query(
    `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
    [keyRecord.id]
  );

  // Set request properties
  req.userId = keyRecord.user_id;
  req.apiKeyId = keyRecord.id;
  req.apiKey = apiKey;
}

async function validateJWT(req: AuthRequest, token: string): Promise<void> {
  if (!config.jwt.secret || config.jwt.secret === 'your-secret-key-change-in-production') {
    throw new Error("JWT authentication not configured");
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'settler-api',
      audience: 'settler-client',
    }) as { userId: string; type?: string };

    // Check token type (access vs refresh)
    if (decoded.type === 'refresh') {
      throw new Error("Refresh tokens cannot be used for API access");
    }

    req.userId = decoded.userId;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error("Token has expired");
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error("Invalid token");
      }
    }
    throw error;
  }
}
