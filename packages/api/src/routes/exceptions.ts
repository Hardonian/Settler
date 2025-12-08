/**
 * Exception Queue Routes
 * UX-008: Exception queue UI for reviewing and resolving unmatched transactions
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query, transaction } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError, ValidationError } from "../utils/typed-errors";
import { trackEventAsync } from "../utils/event-tracker";

const router = Router();

const listExceptionsSchema = z.object({
  query: z.object({
    jobId: z.string().uuid().optional(),
        resolution_status: z.enum(['open', 'in_progress', 'resolved', 'dismissed']).optional(),
        category: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
  }),
});

const resolveExceptionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    resolution: z.enum(['matched', 'manual', 'ignored']),
    notes: z.string().max(1000).optional(),
  }),
});

const bulkResolveSchema = z.object({
  body: z.object({
    exceptionIds: z.array(z.string().uuid()).min(1).max(100),
    resolution: z.enum(['matched', 'manual', 'ignored']),
    notes: z.string().max(1000).optional(),
  }),
});

// List exceptions (unmatched transactions)
router.get(
  "/exceptions",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(listExceptionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const queryParams = listExceptionsSchema.parse({ query: req.query });
      const {
        jobId,
        resolution_status = 'open',
        category,
        startDate,
        endDate,
        limit,
        offset,
      } = queryParams.query;

      // Build query
      const conditions: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramCount = 1;

      // Join with jobs to ensure user ownership
      conditions.push(`j.user_id = $${paramCount++}`);
      values.push(userId);

      if (jobId) {
        conditions.push(`e.job_id = $${paramCount++}`);
        values.push(jobId);
      }

      if (resolution_status) {
        conditions.push(`e.resolution_status = $${paramCount++}`);
        values.push(resolution_status);
      }

      if (category) {
        conditions.push(`e.category = $${paramCount++}`);
        values.push(category);
      }

      if (startDate) {
        conditions.push(`e.created_at >= $${paramCount++}`);
        values.push(new Date(startDate));
      }

      if (endDate) {
        conditions.push(`e.created_at <= $${paramCount++}`);
        values.push(new Date(endDate));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get exceptions
      const exceptions = await query<{
        id: string;
        job_id: string;
        execution_id: string | null;
        category: string;
        severity: string;
        description: string;
        resolution_status: string;
        resolved_at: Date | null;
        resolved_by: string | null;
        resolution_notes: string | null;
        created_at: Date;
      }>(
        `SELECT e.id, e.job_id, e.execution_id, e.category, e.severity,
                e.description, e.resolution_status,
                e.resolved_at, e.resolved_by, e.resolution_notes,
                e.created_at
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...values, limit, offset]
      );

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         ${whereClause}`,
        values
      );

      if (!countResult[0]) {
        throw new Error('Failed to get exception count');
      }
      const total = parseInt(countResult[0].count);

      res.json({
        data: exceptions.map((e) => {
          if (!e) return null;
          return {
            id: e.id,
            jobId: e.job_id,
            executionId: e.execution_id,
            category: e.category,
            severity: e.severity,
            description: e.description,
            status: e.resolution_status,
            resolvedAt: e.resolved_at?.toISOString() || null,
            resolvedBy: e.resolved_by || null,
            notes: e.resolution_notes || null,
            createdAt: e.created_at.toISOString(),
          };
        }).filter((e) => e !== null),
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list exceptions", 500, { userId: req.userId });
    }
  }
);

// Get exception details
router.get(
  "/exceptions/:id",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      if (!id || !userId) {
        throw new NotFoundError("Exception ID and User ID are required", "exception", id || "unknown");
      }

      const exceptions = await query<{
        id: string;
        job_id: string;
        execution_id: string | null;
        category: string;
        severity: string;
        description: string;
        resolution_status: string;
        resolved_at: Date | null;
        resolved_by: string | null;
        resolution_notes: string | null;
        created_at: Date;
      }>(
        `SELECT e.id, e.job_id, e.execution_id, e.category, e.severity,
                e.description, e.resolution_status,
                e.resolved_at, e.resolved_by, e.resolution_notes,
                e.created_at
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE e.id = $1 AND j.user_id = $2`,
        [id, userId]
      );

      if (exceptions.length === 0 || !exceptions[0]) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      const e = exceptions[0];

      res.json({
        data: {
          id: e.id,
          jobId: e.job_id,
          executionId: e.execution_id,
          category: e.category,
          severity: e.severity,
          description: e.description,
          status: e.resolution_status,
          resolvedAt: e.resolved_at?.toISOString() || null,
          resolvedBy: e.resolved_by || null,
          notes: e.resolution_notes || null,
          createdAt: e.created_at.toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get exception", 500, { userId: req.userId });
    }
  }
);

// Resolve exception
router.post(
  "/exceptions/:id/resolve",
  requirePermission(Permission.REPORTS_EXPORT),
  validateRequest(resolveExceptionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { resolution, notes } = req.body;
      const userId = req.userId!;

      if (!id || !userId) {
        throw new NotFoundError("Exception ID and User ID are required", "exception", id || "unknown");
      }

      // Verify ownership
      const existing = await query<{ id: string; status: string }>(
        `SELECT e.id, e.status
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE e.id = $1 AND j.user_id = $2`,
        [id, userId]
      );

      if (existing.length === 0 || !existing[0]) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      const existingException = existing[0];
      if (existingException.status !== 'pending') {
        throw new ValidationError(
          "Exception is already resolved",
          'status',
          [{
            field: 'status',
            message: `Exception is already ${existingException.status}`,
            code: 'ALREADY_RESOLVED',
          }]
        );
      }

      await transaction(async (client) => {
        // Update exception
        await client.query(
          `UPDATE exceptions
           SET status = 'resolved',
               resolution = $1,
               notes = $2,
               resolved_at = NOW(),
               resolved_by = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [resolution, notes || null, userId, id]
        );

        // Log audit event
        await client.query(
          `INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`,
          [
            'exception_resolved',
            userId,
            JSON.stringify({ exceptionId: id, resolution, notes }),
          ]
        );
      });

      // Track event
      trackEventAsync(userId, 'ExceptionResolved', {
        exceptionId: id,
        resolution,
      });

      res.json({
        message: "Exception resolved successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to resolve exception", 500, { userId: req.userId });
    }
  }
);

// Bulk resolve exceptions
router.post(
  "/exceptions/bulk-resolve",
  requirePermission(Permission.REPORTS_EXPORT),
  validateRequest(bulkResolveSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { exceptionIds, resolution, notes } = req.body;
      const userId = req.userId!;

      await transaction(async (client) => {
        // Verify all exceptions belong to user
        const ownedResult = await client.query<{ id: string }>(
          `SELECT e.id
           FROM exceptions e
           JOIN jobs j ON e.job_id = j.id
           WHERE e.id = ANY($1) AND j.user_id = $2 AND e.status = 'pending'`,
          [exceptionIds, userId]
        );

        const owned = ownedResult.rows || [];
        if (owned.length !== exceptionIds.length) {
          throw new ValidationError(
            "Some exceptions not found or already resolved",
            'exceptionIds',
            [{
              field: 'exceptionIds',
              message: `Only ${owned.length} of ${exceptionIds.length} exceptions can be resolved`,
              code: 'INVALID_EXCEPTIONS',
            }]
          );
        }

        // Bulk update
        await client.query(
          `UPDATE exceptions
           SET resolution_status = 'resolved',
               resolution_notes = $1,
               resolved_at = NOW(),
               resolved_by = $2,
               updated_at = NOW()
           WHERE id = ANY($3)`,
          [notes || null, userId, exceptionIds]
        );

        // Log audit event
        await client.query(
          `INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`,
          [
            'exceptions_bulk_resolved',
            userId,
            JSON.stringify({ exceptionIds, resolution, count: exceptionIds.length }),
          ]
        );
      });

      // Track events
      for (const exceptionId of exceptionIds) {
        trackEventAsync(userId, 'ExceptionResolved', {
          exceptionId,
          resolution,
          bulk: true,
        });
      }

      res.json({
        message: `Resolved ${exceptionIds.length} exceptions successfully`,
        count: exceptionIds.length,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to bulk resolve exceptions", 500, { userId: req.userId });
    }
  }
);

// Get exception statistics
router.get(
  "/exceptions/stats",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { jobId } = req.query as { jobId?: string };

      const conditions: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramCount = 1;

      conditions.push(`j.user_id = $${paramCount++}`);
      values.push(userId);

      if (jobId) {
        conditions.push(`e.job_id = $${paramCount++}`);
        values.push(jobId);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const stats = await query<{
        total: string;
        open: string;
        in_progress: string;
        resolved: string;
        dismissed: string;
        by_category: unknown;
      }>(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE e.resolution_status = 'open') as open,
           COUNT(*) FILTER (WHERE e.resolution_status = 'in_progress') as in_progress,
           COUNT(*) FILTER (WHERE e.resolution_status = 'resolved') as resolved,
           COUNT(*) FILTER (WHERE e.resolution_status = 'dismissed') as dismissed,
           json_object_agg(e.category, COUNT(*)) FILTER (WHERE e.category IS NOT NULL) as by_category
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         ${whereClause}
         GROUP BY e.category`,
        values
      );

      // Aggregate stats
      const aggregated = {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        dismissed: 0,
        byCategory: {} as Record<string, number>,
      };

      for (const stat of stats) {
        aggregated.total += parseInt(stat.total);
        aggregated.open += parseInt(stat.open);
        aggregated.inProgress += parseInt(stat.in_progress);
        aggregated.resolved += parseInt(stat.resolved);
        aggregated.dismissed += parseInt(stat.dismissed);
        if (stat.by_category && typeof stat.by_category === 'object') {
          Object.assign(aggregated.byCategory, stat.by_category);
        }
      }

      res.json({
        data: aggregated,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get exception statistics", 500, { userId: req.userId });
    }
  }
);

export { router as exceptionsRouter };
