/**
 * Tolerance Settings API
 *
 * Allows operators to configure reconciliation tolerances at the template level.
 * These tolerances directly affect matching behavior in reconciliation jobs.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";
import { query } from "../db";
import { logInfo, logError } from "../utils/logger";

const router: Router = Router();

// Validation schemas
const updateToleranceSchema = z.object({
  body: z.object({
    amountTolerance: z.number().min(0).max(100).optional(),
    dateToleranceDays: z.number().min(0).max(365).optional(),
  }),
});

const getToleranceSchema = z.object({
  params: z.object({
    templateId: z.string().uuid(),
  }),
});

type QueryParam = string | number;

/**
 * GET /api/v1/tolerance/:templateId
 * Get tolerance settings for a template
 */
router.get(
  "/:templateId",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getToleranceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Tenant ID is required",
        });
      }

      const result = await query<{
        id: string;
        name: string;
        amount_tolerance: number | null;
        date_tolerance_days: number | null;
        metadata: string;
      }>(
        `SELECT id, name, amount_tolerance, date_tolerance_days, metadata
         FROM recon_templates 
         WHERE id = $1 AND (tenant_id = $2 OR is_public = true)
         AND deleted_at IS NULL
         LIMIT 1`,
        [templateId as QueryParam, tenantId as QueryParam]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: "Template not found",
        });
      }

      const template = result[0];
      if (!template) {
        return res.status(404).json({
          error: "Not Found",
          message: "Template not found",
        });
      }

      const metadata =
        typeof template.metadata === "string" ? JSON.parse(template.metadata) : template.metadata;

      // Return explicit fields, falling back to metadata values
      res.json({
        data: {
          templateId: template.id,
          templateName: template.name,
          amountTolerance: template.amount_tolerance ?? metadata?.tolerances?.amount ?? 0.01,
          dateToleranceDays: template.date_tolerance_days ?? metadata?.tolerances?.days ?? 3,
          source: template.amount_tolerance ? "explicit" : "metadata",
        },
      });
    } catch (error) {
      logError("Failed to get tolerance settings", error, { templateId: req.params.templateId });
      return handleRouteError(res, error, "Failed to get tolerance settings");
    }
  }
);

/**
 * PUT /api/v1/tolerance/:templateId
 * Update tolerance settings for a template
 */
router.put(
  "/:templateId",
  requirePermission(Permission.JOBS_WRITE),
  validateRequest(updateToleranceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const { amountTolerance, dateToleranceDays } = req.body as Record<string, unknown>;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Tenant ID is required",
        });
      }

      // Verify template exists and belongs to tenant
      const existing = await query<{ id: string }>(
        `SELECT id FROM recon_templates 
         WHERE id = $1 AND (tenant_id = $2 OR is_public = true)
         AND deleted_at IS NULL
         LIMIT 1`,
        [templateId as QueryParam, tenantId as QueryParam]
      );

      if (!existing || existing.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: "Template not found or access denied",
        });
      }

      // Build update query
      const updates: string[] = [];
      const values: QueryParam[] = [];
      let paramIndex = 1;

      if (amountTolerance !== undefined) {
        updates.push(`amount_tolerance = $${paramIndex++}`);
        values.push(amountTolerance as number);
      }

      if (dateToleranceDays !== undefined) {
        updates.push(`date_tolerance_days = $${paramIndex++}`);
        values.push(dateToleranceDays as number);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "Bad Request",
          message: "No fields to update",
        });
      }

      // Add config version update
      updates.push(`config_version = $${paramIndex++}`);
      values.push(`v-${Date.now()}`);

      // Add updated timestamp
      updates.push(`updated_at = now()`);

      values.push(templateId as QueryParam);
      values.push(tenantId as QueryParam);

      const sql = `
        UPDATE recon_templates 
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
      `;

      await query(sql, values);

      logInfo("Updated tolerance settings", {
        templateId,
        tenantId,
        amountTolerance,
        dateToleranceDays,
        userId: req.userId,
      });

      res.json({
        data: {
          templateId,
          amountTolerance,
          dateToleranceDays,
          message: "Tolerance settings updated successfully",
        },
      });
    } catch (error) {
      logError("Failed to update tolerance settings", error, {
        templateId: req.params.templateId,
        body: req.body,
      });
      return handleRouteError(res, error, "Failed to update tolerance settings");
    }
  }
);

/**
 * GET /api/v1/tolerance/:templateId/effect
 * Preview the effect of tolerance changes without applying them
 */
router.post(
  "/:templateId/effect",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const { amountTolerance, dateToleranceDays } = req.body as Record<string, unknown>;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Tenant ID is required",
        });
      }

      // Get current tolerance settings
      const current = await query<{
        amount_tolerance: number | null;
        date_tolerance_days: number | null;
      }>(
        `SELECT amount_tolerance, date_tolerance_days 
         FROM recon_templates WHERE id = $1 AND tenant_id = $2
         AND deleted_at IS NULL`,
        [templateId as QueryParam, tenantId as QueryParam]
      );

      const currentAmount = current?.[0]?.amount_tolerance ?? 0.01;
      const currentDays = current?.[0]?.date_tolerance_days ?? 3;

      const newAmount = (amountTolerance as number | undefined) ?? currentAmount;
      const newDays = (dateToleranceDays as number | undefined) ?? currentDays;

      // Calculate the impact
      const amountChanged = newAmount !== currentAmount;
      const daysChanged = newDays !== currentDays;

      res.json({
        data: {
          templateId,
          current: {
            amountTolerance: currentAmount,
            dateToleranceDays: currentDays,
          },
          preview: {
            amountTolerance: newAmount,
            dateToleranceDays: newDays,
          },
          changed: {
            amount: amountChanged,
            date: daysChanged,
          },
          impact: {
            description: amountChanged
              ? `Amount tolerance changed from ${currentAmount} to ${newAmount}`
              : "Amount tolerance unchanged",
            dateImpact: daysChanged
              ? `Date tolerance changed from ${currentDays} to ${newDays} days`
              : "Date tolerance unchanged",
          },
        },
      });
    } catch (error) {
      logError("Failed to preview tolerance effect", error, {
        templateId: req.params.templateId,
        body: req.body,
      });
      return handleRouteError(res, error, "Failed to preview tolerance effect");
    }
  }
);

export default router;
