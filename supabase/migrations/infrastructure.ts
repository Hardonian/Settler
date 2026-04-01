import { Router, Response } from "express";
import * as crypto from "crypto";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { ConnectionManager } from "../../infrastructure/database/connection-manager";
import { query } from "../../db";
import { cache } from "../../infrastructure/redis/client";

const router = Router();
const dbManager = new ConnectionManager();

// GET /api/v1/operator/infrastructure/pool-stats
// Visibility: Proves to the operator what PgBouncer/Postgres is actually doing
router.get(
  "/pool-stats",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const [stats, settings] = await Promise.all([
        // PERF: Cache the expensive stats query for 2s to batch requests
        cache.get("infra:pool_stats").then(async (cachedStats) => {
          if (cachedStats) return cachedStats;
          const freshStats = await dbManager.executeConstrainedQuery(
            `SELECT * FROM public.vw_connection_pool_stats`
          );
          await cache.set("infra:pool_stats", freshStats, 2);
          return freshStats;
        }),

        // PERF: Cache settings for 60s as they are semi-static
        cache.get("infra:settings").then(async (cachedSettings) => {
          if (cachedSettings) return cachedSettings;
          const freshSettings = await dbManager.executeConstrainedQuery(
            `SELECT * FROM public.operator_infrastructure_settings WHERE id = 'global'`
          );
          const settings = freshSettings[0];
          await cache.set("infra:settings", settings, 60);
          return settings;
        }),
      ]);

      // ETag generation and checking
      const etag = crypto
        .createHash("sha1")
        .update(JSON.stringify({ stats, settings }))
        .digest("hex");
      if (req.headers["if-none-match"] === etag) {
        return res.status(304).send();
      }

      res.setHeader("ETag", etag);
      res.json({ stats, settings });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch infrastructure stats" });
    }
  }
);

// PUT /api/v1/operator/infrastructure/settings
// Consequence: Updates the setting AND invalidates the cache so the next execution uses the new timeout
router.put(
  "/settings",
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { max_statement_timeout_ms, max_worker_concurrency } = req.body;
      const userId = req.userId!;

      await query(
        `UPDATE public.operator_infrastructure_settings
       SET max_statement_timeout_ms = $1, max_worker_concurrency = $2, updated_at = NOW(), updated_by = $3
       WHERE id = 'global'`,
        [max_statement_timeout_ms, max_worker_concurrency, userId]
      );

      // Immediate Consequence: Bust the cache to enforce the new constraint globally
      await cache.delete("infra:statement_timeout_ms");

      await query(
        `INSERT INTO public.audit_logs (tenant_id, actor_id, action, details)
       VALUES ('system', $1, 'INFRASTRUCTURE_SETTINGS_CHANGED', 'Operator adjusted DB timeouts and worker concurrency.')`,
        [userId]
      );

      res.json({ success: true, message: "Infrastructure constraints enforced successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to update infrastructure settings" });
    }
  }
);

export { router as infrastructureRouter };
