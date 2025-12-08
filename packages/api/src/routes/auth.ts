import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { query } from "../db";
import { verifyPassword, generateApiKey, hashApiKey } from "../utils/hash";
import { logInfo } from "../utils/logger";
import { handleRouteError } from "../utils/error-handler";
import { config } from "../config";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { rotateRefreshToken, storeRefreshToken } from "../infrastructure/security/token-rotation";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess, sendError } from "../utils/api-response";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    scopes: z.array(z.string()).optional(),
    rateLimit: z.number().int().min(1).max(10000).optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

// Login and get access + refresh tokens
router.post(
  "/login",
  validateRequest(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const users = await query<{
        id: string;
        password_hash: string;
        role: string;
      }>(
        `SELECT id, password_hash, role FROM users WHERE email = $1 AND deleted_at IS NULL`,
        [email]
      );

      if (users.length === 0 || !users[0]) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const user = users[0];
      const isValid = await verifyPassword(password, user.password_hash);

      if (!isValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      if (!config.jwt.secret) {
        throw new Error('JWT secret not configured');
      }

      const jwtSecret = config.jwt.secret as string;
      const accessTokenExpiry: string | number = typeof config.jwt.accessTokenExpiry === 'string' 
        ? config.jwt.accessTokenExpiry 
        : (typeof config.jwt.accessTokenExpiry === 'number' ? config.jwt.accessTokenExpiry : '15m');
      const refreshSecret = (config.jwt.refreshSecret || jwtSecret) as string;
      const refreshTokenExpiry: string | number = typeof config.jwt.refreshTokenExpiry === 'string'
        ? config.jwt.refreshTokenExpiry
        : (typeof config.jwt.refreshTokenExpiry === 'number' ? config.jwt.refreshTokenExpiry : '7d');

      // Generate access token (15 minutes)
      const accessToken = jwt.sign(
        { userId: user.id, type: 'access' },
        jwtSecret,
        {
          expiresIn: accessTokenExpiry,
          issuer: 'settler-api',
          audience: 'settler-client',
        } as jwt.SignOptions
      );

      // Generate refresh token with rotation support
      const refreshTokenId = uuidv4();
      const refreshToken = jwt.sign(
        { userId: user.id, tokenId: refreshTokenId, type: 'refresh' },
        refreshSecret,
        {
          expiresIn: refreshTokenExpiry,
          issuer: 'settler-api',
          audience: 'settler-client',
        } as jwt.SignOptions
      );

      // Store refresh token in database for rotation
      await storeRefreshToken(user.id, refreshTokenId, 7);

      // Log audit event
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        [
          'user_login',
          user.id,
          JSON.stringify({ ip: req.ip }),
        ]
      );

      logInfo('User logged in', { userId: user.id });

      sendSuccess(res, {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
        user: {
          id: user.id,
          email,
          role: user.role,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to login", 500);
    }
  }
);

// Refresh access token with rotation
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Rotate refresh token (invalidates old, issues new)
      const tokenPair = await rotateRefreshToken(refreshToken);

      if (!tokenPair) {
        return sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
      }

      sendSuccess(res, {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to refresh token", 401);
    }
  }
);

// Create API key
router.post(
  "/api-keys",
  requirePermission(Permission.USERS_WRITE),
  validateRequest(createApiKeySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, scopes, rateLimit, expiresAt } = req.body;
      const userId = req.userId!;

      const { key, prefix } = generateApiKey();
      const keyHash = await hashApiKey(key);

      const result = await query<{ id: string }>(
        `INSERT INTO api_keys (user_id, key_prefix, key_hash, name, scopes, rate_limit, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          userId,
          prefix,
          keyHash,
          name,
          scopes || ['jobs:read', 'jobs:write', 'reports:read'],
          rateLimit || 1000,
          expiresAt ? new Date(expiresAt) : null,
        ]
      );

      if (!result[0]) {
        throw new Error('Failed to create API key');
      }

      const apiKeyId = result[0].id;

      // Log audit event
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        [
          'api_key_created',
          userId,
          JSON.stringify({ apiKeyId, name }),
        ]
      );

      logInfo('API key created', { userId, apiKeyId });

      // Return key only once (never again)
      res.status(201).json({
        data: {
          id: apiKeyId,
          key, // Only returned on creation
          name,
          scopes: scopes || ['jobs:read', 'jobs:write', 'reports:read'],
          rateLimit: rateLimit || 1000,
          createdAt: new Date().toISOString(),
        },
        message: "API key created. Store it securely - it will not be shown again.",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create API key", 500, { userId: req.userId });
    }
  }
);

export { router as authRouter };
