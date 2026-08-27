import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { queryWithTenant, transaction } from "../db";
import { generateApiKey, hashApiKey } from "../utils/hash";
import { logInfo } from "../utils/logger";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import {
  authorizeTenantActionOr403,
  requireTenantContext,
  requireUserContext,
} from "./authz-helpers";
import { enforceFreezeState } from "../middleware/governance";

const router: Router = Router();

const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    scopes: z.array(z.string()).optional(),
    rateLimit: z.number().int().min(1).max(10000).optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

const updateApiKeySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    scopes: z.array(z.string()).optional(),
    rateLimit: z.number().int().min(1).max(10000).optional(),
    revoked: z.boolean().optional(),
  }),
});

const regenerateApiKeySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// List API keys (masked)
router.get(
  "/api-keys",
  requirePermission(Permission.USERS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.api_key.read"))) return;

      const keys = await queryWithTenant<{
        id: string;
        name: string | null;
        scopes: string[];
        rate_limit: number;
        revoked_at: Date | null;
        expires_at: Date | null;
        last_used_at: Date | null;
        created_at: Date;
        key_prefix: string;
      }>(
        tenantId,
        `SELECT id, name, scopes, rate_limit, revoked_at, expires_at, last_used_at, created_at, key_prefix
         FROM api_keys
         WHERE user_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC`,
        [userId, tenantId]
      );

      const maskedKeys = keys.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: `${key.key_prefix}...`, // Masked key
        scopes: key.scopes,
        rateLimit: key.rate_limit,
        revoked: key.revoked_at !== null,
        expired: key.expires_at ? new Date(key.expires_at) < new Date() : false,
        lastUsedAt: key.last_used_at?.toISOString() || null,
        createdAt: key.created_at.toISOString(),
      }));

      res.json({
        data: maskedKeys,
        count: maskedKeys.length,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list API keys", 500, { userId: req.userId });
    }
  }
);

// Get API key details (masked)
router.get(
  "/api-keys/:id",
  requirePermission(Permission.USERS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      if (!id) {
        res.status(400).json({ error: "API key ID required" });
        return;
      }
      const userId = req.userId!;
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.api_key.read"))) return;

      const keys = await queryWithTenant<{
        id: string;
        name: string | null;
        scopes: string[];
        rate_limit: number;
        revoked_at: Date | null;
        expires_at: Date | null;
        last_used_at: Date | null;
        created_at: Date;
        key_prefix: string;
      }>(
        tenantId,
        `SELECT id, name, scopes, rate_limit, revoked_at, expires_at, last_used_at, created_at, key_prefix
         FROM api_keys
         WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [id, userId, tenantId]
      );

      if (keys.length === 0 || !keys[0]) {
        throw new NotFoundError("API key not found", "api_key", id);
      }

      const key = keys[0];

      res.json({
        data: {
          id: key.id,
          name: key.name,
          keyPrefix: `${key.key_prefix}...`, // Masked
          scopes: key.scopes,
          rateLimit: key.rate_limit,
          revoked: key.revoked_at !== null,
          expired: key.expires_at ? new Date(key.expires_at) < new Date() : false,
          lastUsedAt: key.last_used_at?.toISOString() || null,
          createdAt: key.created_at.toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get API key", 500, { userId: req.userId });
    }
  }
);

// Create API key
router.post(
  "/api-keys",
  requirePermission(Permission.USERS_WRITE),
  enforceFreezeState(),
  validateRequest(createApiKeySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, scopes, rateLimit, expiresAt } = req.body;
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.api_key.manage"))) return;

      const { key, prefix } = generateApiKey();
      const keyHash = await hashApiKey(key);

      const result = await queryWithTenant<{ id: string }>(
        tenantId,
        `INSERT INTO api_keys (user_id, tenant_id, key_prefix, key_hash, name, scopes, rate_limit, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          tenantId,
          prefix,
          keyHash,
          name,
          scopes || ["jobs:read", "jobs:write", "reports:read"],
          rateLimit || 1000,
          expiresAt ? new Date(expiresAt) : null,
        ]
      );

      // Log audit event
      await queryWithTenant(
        tenantId,
        `INSERT INTO audit_logs (event, user_id, tenant_id, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          "api_key_created",
          userId,
          tenantId,
          JSON.stringify({ apiKeyId: result[0]?.id || "", name }),
        ]
      );

      // Log business event
      await queryWithTenant(
        tenantId,
        `INSERT INTO events (user_id, event_name, properties)
         VALUES ($1, $2, $3)`,
        [
          userId,
          "APIKeyCreated",
          JSON.stringify({
            apiKeyId: result[0]?.id || "",
            keyType: "live",
            name,
          }),
        ]
      ).catch(() => {
        // Events table might not exist yet, ignore
      });

      if (!result[0]) {
        throw new Error("Failed to create API key");
      }
      logInfo("API key created", { userId, apiKeyId: result[0].id });

      // Return key only once (never again)
      res.status(201).json({
        data: {
          id: result[0]?.id || "",
          key, // Only returned on creation
          name,
          scopes: scopes || ["jobs:read", "jobs:write", "reports:read"],
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

// Update API key
router.patch(
  "/api-keys/:id",
  requirePermission(Permission.USERS_WRITE),
  enforceFreezeState(),
  validateRequest(updateApiKeySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam2 = req.params["id"];
      const id = Array.isArray(idParam2) ? (idParam2[0] ?? "") : (idParam2 ?? "");
      if (!id) {
        res.status(400).json({ error: "API key ID required" });
        return;
      }
      const { name, scopes, rateLimit, revoked } = req.body;
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.api_key.manage"))) return;

      // Verify ownership
      const existing = await queryWithTenant<{ id: string; revoked_at: Date | null }>(
        tenantId,
        `SELECT id, revoked_at FROM api_keys WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [id, userId, tenantId]
      );

      if (existing.length === 0) {
        throw new NotFoundError("API key not found", "api_key", id);
      }

      // Build update query
      const updates: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (scopes !== undefined) {
        updates.push(`scopes = $${paramCount++}`);
        values.push(scopes);
      }

      if (rateLimit !== undefined) {
        updates.push(`rate_limit = $${paramCount++}`);
        values.push(rateLimit);
      }

      if (revoked !== undefined) {
        updates.push(`revoked_at = $${paramCount++}`);
        values.push(revoked ? new Date() : null);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }

      updates.push(`updated_at = NOW()`);
      values.push(id, userId);

      values.push(tenantId);
      await queryWithTenant(
        tenantId,
        `UPDATE api_keys SET ${updates.join(", ")} WHERE id = $${paramCount++} AND user_id = $${paramCount++} AND tenant_id = $${paramCount++}`,
        values
      );

      // Log audit event
      await queryWithTenant(
        tenantId,
        `INSERT INTO audit_logs (event, user_id, tenant_id, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          "api_key_updated",
          userId,
          tenantId,
          JSON.stringify({ apiKeyId: id, updates: { name, scopes, rateLimit, revoked } }),
        ]
      );

      logInfo("API key updated", { userId, apiKeyId: id });

      res.json({
        message: "API key updated successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to update API key", 500, { userId: req.userId });
    }
  }
);

// Regenerate API key (creates new key, revokes old one)
router.post(
  "/api-keys/:id/regenerate",
  requirePermission(Permission.USERS_WRITE),
  enforceFreezeState(),
  validateRequest(regenerateApiKeySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam3 = req.params["id"];
      const id = Array.isArray(idParam3) ? (idParam3[0] ?? "") : (idParam3 ?? "");
      if (!id) {
        res.status(400).json({ error: "API key ID required" });
        return;
      }
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.api_key.manage"))) return;

      // Verify ownership
      const existing = await queryWithTenant<{
        id: string;
        name: string | null;
        scopes: string[];
        rate_limit: number;
        expires_at: Date | null;
      }>(
        tenantId,
        `SELECT id, name, scopes, rate_limit, expires_at
         FROM api_keys
         WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [id, userId, tenantId]
      );

      if (existing.length === 0 || !existing[0]) {
        throw new NotFoundError("API key not found", "api_key", id);
      }

      const oldKey = existing[0];

      await transaction(async (client) => {
        // Revoke old key
        await client.query(
          `UPDATE api_keys SET revoked_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
          [id, userId, tenantId]
        );

        // Create new key with same settings
        const { key, prefix } = generateApiKey();
        const keyHash = await hashApiKey(key);

        const result = await client.query<{ id: string }>(
          `INSERT INTO api_keys (user_id, tenant_id, key_prefix, key_hash, name, scopes, rate_limit, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            userId,
            tenantId,
            prefix,
            keyHash,
            oldKey.name,
            oldKey.scopes,
            oldKey.rate_limit,
            oldKey.expires_at,
          ]
        );

        // Log audit event
        await client.query(
          `INSERT INTO audit_logs (event, user_id, tenant_id, metadata)
           VALUES ($1, $2, $3, $4)`,
          [
            "api_key_regenerated",
            userId,
            tenantId,
            JSON.stringify({ oldApiKeyId: id, newApiKeyId: result.rows[0]?.id || "" }),
          ]
        );

        // Log business event
        await client
          .query(
            `INSERT INTO events (user_id, event_name, properties)
           VALUES ($1, $2, $3)`,
            [
              userId,
              "APIKeyRegenerated",
              JSON.stringify({
                oldApiKeyId: id,
                newApiKeyId: result.rows[0]?.id || "",
              }),
            ]
          )
          .catch(() => {
            // Events table might not exist yet, ignore
          });

        if (!result.rows[0]) {
          throw new Error("Failed to regenerate API key");
        }
        logInfo("API key regenerated", { userId, oldApiKeyId: id, newApiKeyId: result.rows[0].id });
        res.status(201).json({
          data: {
            id: result.rows[0].id,
            key, // Only returned on regeneration
            name: oldKey.name,
            scopes: oldKey.scopes,
            rateLimit: oldKey.rate_limit,
            createdAt: new Date().toISOString(),
          },
          message: "API key regenerated. Store the new key securely - it will not be shown again.",
        });
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to regenerate API key", 500, { userId: req.userId });
    }
  }
);

// Delete API key
router.delete(
  "/api-keys/:id",
  requirePermission(Permission.USERS_DELETE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam4 = req.params["id"];
      const id = Array.isArray(idParam4) ? (idParam4[0] ?? "") : (idParam4 ?? "");
      if (!id) {
        res.status(400).json({ error: "API key ID required" });
        return;
      }
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.api_key.manage"))) return;

      // Verify ownership
      const existing = await queryWithTenant<{ id: string }>(
        tenantId,
        `SELECT id FROM api_keys WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [id, userId, tenantId]
      );

      if (existing.length === 0) {
        throw new NotFoundError("API key not found", "api_key", id);
      }

      // Revoke instead of delete (soft delete)
      await queryWithTenant(
        tenantId,
        `UPDATE api_keys SET revoked_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [id, userId, tenantId]
      );

      // Log audit event
      await queryWithTenant(
        tenantId,
        `INSERT INTO audit_logs (event, user_id, tenant_id, metadata)
         VALUES ($1, $2, $3, $4)`,
        ["api_key_deleted", userId, tenantId, JSON.stringify({ apiKeyId: id })]
      );

      logInfo("API key deleted", { userId, apiKeyId: id });

      res.json({
        message: "API key revoked successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to delete API key", 500, { userId: req.userId });
    }
  }
);

export { router as apiKeysRouter };
