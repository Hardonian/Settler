/**
 * Audit Trail Routes
 * UX-006: Trust anchors - Complete audit trail visibility
 * Future-forward: Immutable audit logs, compliance-ready, searchable
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";

const router = Router();

const getAuditTrailSchema = z.object({
  query: z.object({
    resourceType: z.enum(["job", "execution", "match", "exception"]).optional(),
    resourceId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    eventType: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
  }),
});

// Get audit trail
router.get(
  "/audit-trail",
  requirePermission(Permission.ADMIN_AUDIT),
  validateRequest(getAuditTrailSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const queryParams = getAuditTrailSchema.parse({ query: req.query });
      const {
        resourceType,
        resourceId,
        startDate,
        endDate,
        eventType,
        limit,
        offset,
      } = queryParams.query;

      const conditions: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramCount = 1;

      // Filter by user's tenant
      conditions.push(`user_id = $${paramCount++}`);
      values.push(userId);

      if (resourceType && resourceId) {
        conditions.push(`metadata->>'resourceType' = $${paramCount++}`);
        values.push(resourceType);
        conditions.push(`metadata->>'resourceId' = $${paramCount++}`);
        values.push(resourceId);
      }

      if (startDate) {
        conditions.push(`timestamp >= $${paramCount++}`);
        values.push(new Date(startDate));
      }

      if (endDate) {
        conditions.push(`timestamp <= $${paramCount++}`);
        values.push(new Date(endDate));
      }

      if (eventType) {
        conditions.push(`event = $${paramCount++}`);
        values.push(eventType);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const auditLogs = await query<{
        id: string;
        event: string;
        user_id: string;
        metadata: unknown;
        timestamp: Date;
        ip: string | null;
        user_agent: string | null;
      }>(
        `SELECT id, event, user_id, metadata, timestamp, ip, user_agent
         FROM audit_logs
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...values, limit, offset]
      );

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
        values
      );

      if (!countResult[0]) {
        throw new Error('Failed to get audit log count');
      }
      const total = parseInt(countResult[0].count);

      res.json({
        data: auditLogs.map(log => ({
          id: log.id,
          event: log.event,
          userId: log.user_id,
          metadata: log.metadata,
          timestamp: log.timestamp.toISOString(),
          ip: log.ip,
          userAgent: log.user_agent,
          // Trust indicators
          trustLevel: calculateTrustLevel(log),
          immutable: true, // Audit logs are immutable
        })),
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get audit trail", 500, { userId: req.userId });
    }
  }
);

// Get audit trail for specific resource
router.get(
  "/audit-trail/:resourceType/:resourceId",
  requirePermission(Permission.ADMIN_AUDIT),
  async (req: AuthRequest, res: Response) => {
    try {
      const { resourceType, resourceId } = req.params;
      const userId = req.userId!;

      if (!resourceType || !resourceId) {
        res.status(400).json({ error: 'resourceType and resourceId are required' });
        return;
      }

      const auditLogs = await query<{
        id: string;
        event: string;
        user_id: string;
        metadata: unknown;
        timestamp: Date;
      }>(
        `SELECT id, event, user_id, metadata, timestamp
         FROM audit_logs
         WHERE user_id = $1
           AND metadata->>'resourceType' = $2
           AND metadata->>'resourceId' = $3
         ORDER BY timestamp DESC`,
        [userId, resourceType, resourceId]
      );

      res.json({
        data: {
          resourceType,
          resourceId,
          events: auditLogs.map(log => ({
            id: log.id,
            event: log.event,
            userId: log.user_id,
            metadata: log.metadata,
            timestamp: log.timestamp.toISOString(),
          })),
          trustLevel: "high", // Complete audit trail
          immutable: true,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get resource audit trail", 500, { userId: req.userId });
    }
  }
);

// Export audit trail (compliance)
router.get(
  "/audit-trail/export",
  requirePermission(Permission.ADMIN_AUDIT),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { format = "csv", startDate, endDate } = req.query as {
        format?: string;
        startDate?: string;
        endDate?: string;
      };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const auditLogs = await query<{
        event: string;
        timestamp: Date;
        metadata: unknown;
      }>(
        `SELECT event, timestamp, metadata
         FROM audit_logs
         WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
         ORDER BY timestamp DESC`,
        [userId, start, end]
      );

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="audit-trail-${userId}.csv"`);

        let csv = "Event,Timestamp,Metadata\n";
        for (const log of auditLogs) {
          csv += `${log.event},${log.timestamp.toISOString()},"${JSON.stringify(log.metadata).replace(/"/g, '""')}"\n`;
        }

        res.send(csv);
        return;
      }

      res.json({
        data: auditLogs,
        format: "json",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to export audit trail", 500, { userId: req.userId });
    }
  }
);

function calculateTrustLevel(log: {
  event: string;
  metadata: unknown;
  ip: string | null;
  user_agent: string | null;
}): "high" | "medium" | "low" {
  // High trust: System events, user actions with IP/UA
  if (log.ip && log.user_agent) {
    return "high";
  }

  // Medium trust: User events without IP/UA
  if (log.event.includes("user_") || log.event.includes("api_")) {
    return "medium";
  }

  return "low";
}

export { router as auditTrailRouter };
