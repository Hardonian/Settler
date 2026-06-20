/**
 * NPS Survey Routes
 * POST /api/nps/submit - Submit NPS survey response
 * GET  /api/nps/stats    - Get NPS statistics
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { queryWithTenant } from "../db";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

const submitNPSSchema = z.object({
  body: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string().optional(),
    category: z.enum(["product", "support", "pricing", "features", "other"]).default("product"),
  }),
});

const getStatsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

router.post(
  "/submit",
  validateRequest(submitNPSSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;
      const { score, feedback, category } = req.body;

      // Determine promoter/detractor/passive
      let npsType: "promoter" | "passive" | "detractor" = "passive";
      if (req.body.score >= 9) npsType = "promoter";
      else if (req.body.score <= 6) npsType = "detractor";

      await queryWithTenant(
        tenantId,
        `INSERT INTO nps_responses (
          user_id, tenant_id, score, feedback, category, nps_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, req.body.score, feedback || "", category, npsType]
      );

      // Track event for analytics
      trackEventAsync("nps_submitted", {
        userId,
        tenantId: tenantId!,
        score: req.body.score,
        npsType,
        category,
      });

      res.status(201).json({
        ok: true,
        status: "success",
        message: "NPS survey submitted successfully",
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to submit NPS survey", 500, { userId: req.userId });
    }
  }
);

router.get(
  "/stats",
  requirePermission(Permission.USERS_READ),
  validateRequest(getStatsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { startDate, endDate } = req.query;

      let dateFilter = "";
      const params: (string | Date)[] = [tenantId];

      if (startDate || endDate) {
        dateFilter = "AND created_at BETWEEN $2 AND $3";
        params.push(startDate || new Date("1970-01-01"), endDate || new Date());
      }

      // Get NPS stats
      const stats = await queryWithTenant<{
        total: number;
        promoters: number;
        passives: number;
        detractors: number;
        npsScore: number;
        avgScore: number;
      }>(
        tenantId,
        `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE nps_type = 'promoter') as promoters,
          COUNT(*) FILTER (WHERE nps_type = 'passive') as passives,
          COUNT(*) FILTER (WHERE nps_type = 'detractor') as detractors,
          CASE 
            WHEN COUNT(*) > 0 THEN
              ROUND((COUNT(*) FILTER (WHERE nps_type = 'promoter') * 100.0 / COUNT(*)) - 
                    (COUNT(*) FILTER (WHERE nps_type = 'detractor') * 100.0 / COUNT(*)), 1)
            ELSE 0
          END as npsScore,
          AVG(score) as avgScore
        FROM nps_responses
        WHERE tenant_id = $1 ${dateFilter}
      `,
        params
      );

      // Get trend data
      const trend = await queryWithTenant<{
        date: Date;
        npsScore: number;
        count: number;
      }>(
        tenantId,
        `
        SELECT
          DATE_TRUNC('day', created_at) as date,
          ROUND((COUNT(*) FILTER (WHERE nps_type = 'promoter') * 100.0 / COUNT(*)) - 
                (COUNT(*) FILTER (WHERE nps_type = 'detractor') * 100.0 / COUNT(*))) as npsScore,
          COUNT(*) as count
        FROM nps_responses
        WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `,
        [tenantId]
      );

      // Get category breakdown
      const categories = await queryWithTenant<{
        category: string;
        count: number;
        avgScore: number;
      }>(
        tenantId,
        `
        SELECT
          category,
          COUNT(*) as count,
          ROUND(AVG(score)::numeric, 1) as avgScore
        FROM nps_responses
        WHERE tenant_id = $1 ${dateFilter}
        GROUP BY category
        ORDER BY count DESC
      `,
        params
      );

      res.json({
        ok: true,
        status: "success",
        data: {
          ...stats.rows[0],
          trend: trend.rows,
          categories: categories.rows,
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to fetch NPS stats", 500, { userId: req.userId });
    }
  }
);

export { router as npsRouter };
