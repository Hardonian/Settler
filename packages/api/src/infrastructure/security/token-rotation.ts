/**
 * Token Rotation Service
 * Implements refresh token rotation to prevent token reuse attacks
 * 
 * When a refresh token is used, it's invalidated and a new one is issued.
 * This prevents attackers from using stolen refresh tokens multiple times.
 */

import jwt from 'jsonwebtoken';
import { query } from '../../db';
import { config } from '../../config';
import { logWarn, logError } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

/**
 * Rotate refresh token: invalidate old token and issue new one
 * 
 * @param oldRefreshToken - The refresh token to rotate
 * @returns New token pair (access + refresh) or null if invalid
 */
export async function rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair | null> {
  try {
    // Verify and decode the old refresh token
    const decoded = jwt.verify(
      oldRefreshToken,
      config.jwt.refreshSecret || config.jwt.secret!,
      {
        issuer: 'settler-api',
        audience: 'settler-client',
      }
    ) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      logWarn('Invalid token type for rotation', { type: decoded.type });
      return null;
    }

    // Check if token exists and is valid in database
    const tokens = await query<{
      id: string;
      user_id: string;
      revoked_at: Date | null;
      expires_at: Date;
    }>(
      `SELECT id, user_id, revoked_at, expires_at
       FROM refresh_tokens
       WHERE id = $1 AND user_id = $2`,
      [decoded.tokenId, decoded.userId]
    );

    if (tokens.length === 0) {
      logWarn('Refresh token not found in database', { tokenId: decoded.tokenId });
      return null;
    }

    if (!tokens[0]) {
      return null;
    }
    const tokenRecord = tokens[0];

    // Check if token is revoked
    if (tokenRecord.revoked_at) {
      logWarn('Attempted use of revoked refresh token', { tokenId: decoded.tokenId });
      return null;
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      logWarn('Attempted use of expired refresh token', { tokenId: decoded.tokenId });
      return null;
    }

    // Revoke the old token
    await query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE id = $1`,
      [decoded.tokenId]
    );

    // Generate new token pair
    const newRefreshTokenId = uuidv4();
    if (!config.jwt.secret) {
      throw new Error('JWT secret not configured');
    }
    
    const jwtSecret = config.jwt.secret as string;
    const accessTokenExpiry: string | number = typeof config.jwt.accessTokenExpiry === 'string' 
      ? config.jwt.accessTokenExpiry 
      : (typeof config.jwt.accessTokenExpiry === 'number' ? config.jwt.accessTokenExpiry : '15m');
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, type: 'access' },
      jwtSecret,
      {
        expiresIn: accessTokenExpiry,
        issuer: 'settler-api',
        audience: 'settler-client',
      } as jwt.SignOptions
    );

    const refreshSecret = (config.jwt.refreshSecret || jwtSecret) as string;
    const refreshTokenExpiry: string | number = typeof config.jwt.refreshTokenExpiry === 'string'
      ? config.jwt.refreshTokenExpiry
      : (typeof config.jwt.refreshTokenExpiry === 'number' ? config.jwt.refreshTokenExpiry : '7d');
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, tokenId: newRefreshTokenId, type: 'refresh' },
      refreshSecret,
      {
        expiresIn: refreshTokenExpiry,
        issuer: 'settler-api',
        audience: 'settler-client',
      } as jwt.SignOptions
    );

    // Store new refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await query(
      `INSERT INTO refresh_tokens (id, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [newRefreshTokenId, decoded.userId, expiresAt]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_logs (event, user_id, metadata)
       VALUES ($1, $2, $3)`,
      [
        'token_rotated',
        decoded.userId,
        JSON.stringify({ oldTokenId: decoded.tokenId, newTokenId: newRefreshTokenId }),
      ]
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      refreshTokenId: newRefreshTokenId,
    };
  } catch (error: unknown) {
    logError('Token rotation failed', error);
    return null;
  }
}

/**
 * Store refresh token in database
 * 
 * @param userId - User ID
 * @param refreshTokenId - Token ID (UUID)
 * @param expiresInDays - Expiration in days (default: 7)
 */
export async function storeRefreshToken(
  userId: string,
  refreshTokenId: string,
  expiresInDays: number = 7
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await query(
    `INSERT INTO refresh_tokens (id, user_id, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [refreshTokenId, userId, expiresAt]
  );
}

/**
 * Revoke refresh token
 * 
 * @param refreshTokenId - Token ID to revoke
 * @param userId - User ID (for security)
 */
export async function revokeRefreshToken(refreshTokenId: string, userId: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
     RETURNING id`,
    [refreshTokenId, userId]
  );

  return result.length > 0;
}

/**
 * Revoke all refresh tokens for a user
 * 
 * @param userId - User ID
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}
