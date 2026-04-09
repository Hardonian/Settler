/**
 * Zero Trust Authentication
 * Implements Zero Trust principles: Never trust, always verify
 */

import jwt from "jsonwebtoken";
import { config } from "../../config";
import { User, UserRole } from "../../domain/entities/User";
import { verifyApiKey } from "../../utils/hash";
import { query } from "../../db";
// Logger imports removed - not used in this file

export interface TokenPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  scopes: string[];
  type: "access" | "refresh";
  jti: string; // JWT ID for revocation tracking
  iat: number;
  exp: number;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  scopes: string[];
  apiKeyId?: string;
  ipAddress: string;
  userAgent: string;
}

export class ZeroTrustAuth {
  private static readonly ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
  private static readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
  private static readonly JWT_ALGORITHM = "HS256";

  /**
   * Generate short-lived access token (15 minutes)
   */
  static generateAccessToken(user: User, scopes: string[]): string {
    if (!config.jwt.secret) {
      throw new Error("JWT_SECRET not configured");
    }

    const jti = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      scopes,
      type: "access",
      jti,
      iat: now,
      exp: now + this.ACCESS_TOKEN_TTL,
    };

    return jwt.sign(payload, config.jwt.secret, {
      algorithm: this.JWT_ALGORITHM,
      issuer: "settler-api",
      audience: "settler-client",
    });
  }

  /**
   * Generate refresh token (7 days)
   */
  static generateRefreshToken(user: User): string {
    if (!config.jwt.refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET not configured");
    }

    const jti = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      scopes: [], // Refresh tokens don't have scopes
      type: "refresh",
      jti,
      iat: now,
      exp: now + this.REFRESH_TOKEN_TTL,
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      algorithm: this.JWT_ALGORITHM,
      issuer: "settler-api",
      audience: "settler-client",
    });
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    if (!config.jwt.secret) {
      throw new Error("JWT_SECRET not configured");
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: "settler-api",
        audience: "settler-client",
      }) as TokenPayload;

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      // Check if token is revoked (in production, check Redis/DB)
      // For now, we'll implement revocation checking separately

      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Access token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid access token");
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    if (!config.jwt.refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET not configured");
    }

    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: "settler-api",
        audience: "settler-client",
      }) as TokenPayload;

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid refresh token");
      }
      throw error;
    }
  }

  /**
   * Validate API key with Zero Trust principles
   */
  static async validateApiKey(
    apiKey: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthContext> {
    // Never trust - always verify
    if (!apiKey.startsWith("rk_")) {
      throw new Error("Invalid API key format");
    }

    const prefix = apiKey.substring(0, 12);

    // Lookup API key
    const keys = await query<{
      id: string;
      user_id: string;
      tenant_id: string;
      key_hash: string;
      scopes: string[];
      rate_limit: number;
      ip_whitelist: string[] | null;
      revoked_at: Date | null;
      expires_at: Date | null;
      role: UserRole;
    }>(
      `SELECT 
        ak.id, ak.user_id, ak.tenant_id, ak.key_hash, ak.scopes, ak.rate_limit,
        ak.ip_whitelist, ak.revoked_at, ak.expires_at, u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_prefix = $1 AND ak.deleted_at IS NULL`,
      [prefix]
    );

    if (keys.length === 0) {
      // Log failed attempt
      await query(
        `INSERT INTO audit_logs (event, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4)`,
        ["api_key_auth_failed", ipAddress, userAgent, JSON.stringify({ prefix })]
      );
      throw new Error("Invalid API key");
    }

    if (!keys[0]) {
      throw new Error("API key not found");
    }
    const keyRecord = keys[0];

    // Verify key hash
    const isValid = await verifyApiKey(apiKey, keyRecord.key_hash);
    if (!isValid) {
      await query(
        `INSERT INTO audit_logs (event, api_key_id, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        ["api_key_auth_failed", keyRecord.id, ipAddress, userAgent, JSON.stringify({ prefix })]
      );
      throw new Error("Invalid API key");
    }

    // Check revocation
    if (keyRecord.revoked_at) {
      throw new Error("API key revoked");
    }

    // Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      throw new Error("API key expired");
    }

    // Check IP whitelist (least privilege)
    if (keyRecord.ip_whitelist && keyRecord.ip_whitelist.length > 0) {
      if (!keyRecord.ip_whitelist.includes(ipAddress)) {
        await query(
          `INSERT INTO audit_logs (event, api_key_id, ip, user_agent, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          ["api_key_ip_blocked", keyRecord.id, ipAddress, userAgent, JSON.stringify({ ipAddress })]
        );
        throw new Error("IP address not whitelisted");
      }
    }

    // Update last used
    await query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyRecord.id]);

    return {
      userId: keyRecord.user_id,
      tenantId: keyRecord.tenant_id,
      role: keyRecord.role,
      scopes: keyRecord.scopes,
      apiKeyId: keyRecord.id,
      ipAddress,
      userAgent,
    };
  }

  /**
   * Revoke token (for logout or security incidents)
   */
  static async revokeToken(jti: string, reason: string): Promise<void> {
    // Store revoked token ID in Redis with TTL matching token expiration
    // For now, we'll use a database table
    await query(
      `INSERT INTO revoked_tokens (jti, revoked_at, reason, expires_at)
       VALUES ($1, NOW(), $2, NOW() + INTERVAL '7 days')
       ON CONFLICT (jti) DO NOTHING`,
      [jti, reason]
    );
  }

  /**
   * Check if token is revoked
   */
  static async isTokenRevoked(jti: string): Promise<boolean> {
    const result = await query<{ count: number }>(
      `SELECT COUNT(*)::INTEGER as count
       FROM revoked_tokens
       WHERE jti = $1 AND expires_at > NOW()`,
      [jti]
    );
    return (result[0]?.count ?? 0) > 0;
  }
}
