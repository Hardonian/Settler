import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";

const router = Router();

const getReportSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    format: z.enum(["json", "csv"]).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
  }),
});

const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
  }),
});

// Get reconciliation report with pagination
router.get(
  "/:jobId",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getReportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = req.userId!;
      const queryParams = getReportSchema.parse({ params: req.params, query: req.query });
      const { startDate, endDate, format = "json", page, limit } = queryParams.query;

      if (!jobId || !userId) {
        return res.status(400).json({ error: "Job ID and User ID are required" });
      }

      // Check job ownership
      const jobs = await query<{ user_id: string }>(
        `SELECT user_id FROM jobs WHERE id = $1`,
        [jobId]
      );

      if (jobs.length === 0 || !jobs[0]) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (jobs[0].user_id !== userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have access to this job",
        });
      }

      const dateStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateEnd = endDate || new Date().toISOString();

      // Get execution summary
      const executions = await query<{
        id: string;
        summary: any;
        completed_at: Date;
      }>(
        `SELECT id, summary, completed_at
         FROM executions
         WHERE job_id = $1 AND completed_at BETWEEN $2 AND $3
         ORDER BY completed_at DESC
         LIMIT 1`,
        [jobId, dateStart, dateEnd]
      );

      if (executions.length === 0 || !executions[0]) {
        return res.status(404).json({ error: "No reports found for this job" });
      }

      const execution = executions[0];
      const executionId = execution.id;

      // Get matches with pagination (fix N+1 query)
      const offset = (page - 1) * limit;
      const [matches, unmatched, errors, totalMatches] = await Promise.all([
        query<{
          id: string;
          source_id: string;
          target_id: string;
          amount: number;
          currency: string;
          confidence: number;
          matched_at: Date;
        }>(
          `SELECT id, source_id, target_id, amount, currency, confidence, matched_at
           FROM matches
           WHERE execution_id = $1
           ORDER BY matched_at DESC
           LIMIT $2 OFFSET $3`,
          [executionId, limit, offset]
        ),
        query<{
          id: string;
          source_id: string;
          target_id: string;
          amount: number;
          currency: string;
          reason: string;
        }>(
          `SELECT id, source_id, target_id, amount, currency, reason
           FROM unmatched
           WHERE execution_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [executionId, limit, offset]
        ),
        query<{ id: string; error: string }>(
          `SELECT id, error FROM executions WHERE id = $1 AND error IS NOT NULL`,
          [executionId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM matches WHERE execution_id = $1`,
          [executionId]
        ),
      ]);

      if (!totalMatches[0]) {
        throw new Error('Failed to get match count');
      }
      const total = parseInt(totalMatches[0].count);
      const summary = execution.summary || {
        matched: matches.length,
        unmatched: unmatched.length,
        errors: errors.length,
        accuracy: matches.length / (matches.length + unmatched.length) * 100,
        totalTransactions: matches.length + unmatched.length,
      };

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="report-${jobId}.csv"`);
        
        let csv = "id,sourceId,targetId,amount,currency,status\n";
        matches.forEach(m => {
          csv += `${m.id},${m.source_id},${m.target_id},${m.amount},${m.currency},matched\n`;
        });
        unmatched.forEach(u => {
          csv += `${u.id},${u.source_id || ''},${u.target_id || ''},${u.amount || ''},${u.currency || ''},unmatched\n`;
        });
        
        res.send(csv);
        return;
      } else {
        res.json({
          data: {
            jobId,
            executionId,
            dateRange: {
              start: dateStart,
              end: dateEnd,
            },
            summary,
            matches: matches.map(m => ({
              id: m.id,
              sourceId: m.source_id,
              targetId: m.target_id,
              amount: m.amount,
              currency: m.currency,
              matchedAt: m.matched_at.toISOString(),
              confidence: m.confidence,
            })),
            unmatched: unmatched.map(u => ({
              id: u.id,
              sourceId: u.source_id,
              targetId: u.target_id,
              amount: u.amount,
              currency: u.currency,
              reason: u.reason,
            })),
            errors: errors.map(e => ({
              id: e.id,
              message: e.error,
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
            generatedAt: new Date().toISOString(),
          },
        });
        return;
      }
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate report", 500, { userId: req.userId, jobId: req.params.jobId });
      return;
    }
  }
);

// Get report history with pagination
router.get(
  "/",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const queryParams = paginationSchema.parse({ query: req.query });
      const page = queryParams.query.page;
      const limit = Math.min(queryParams.query.limit, 1000);
      const offset = (page - 1) * limit;

      const [reports, totalResult] = await Promise.all([
        query<{
          id: string;
          job_id: string;
          summary: Record<string, unknown>;
          generated_at: Date;
        }>(
          `SELECT r.id, r.job_id, r.summary, r.generated_at
           FROM reports r
           JOIN jobs j ON r.job_id = j.id
           WHERE j.user_id = $1
           ORDER BY r.generated_at DESC
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count
           FROM reports r
           JOIN jobs j ON r.job_id = j.id
           WHERE j.user_id = $1`,
          [userId]
        ),
      ]);

      if (!totalResult[0]) {
        throw new Error('Failed to get report count');
      }
      const total = parseInt(totalResult[0].count);

      res.json({
        data: reports.map(r => ({
          id: r.id,
          jobId: r.job_id,
          summary: r.summary,
          generatedAt: r.generated_at.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch reports", 500, { userId: req.userId });
    }
  }
);

export { router as reportsRouter };
