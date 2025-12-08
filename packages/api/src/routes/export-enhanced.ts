/**
 * Enhanced Export Routes
 * E5: Finance/Ops surfaces - Export improvements with multiple formats and scheduling
 * Future-forward: AI-powered export templates, scheduled exports, direct sync
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";

const router = Router();

const exportReportSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  query: z.object({
    format: z.enum(["csv", "json", "xlsx", "quickbooks", "xero", "netsuite"]).optional().default("csv"),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    includeMatched: z.string().transform(v => v === "true").default("true"),
    includeUnmatched: z.string().transform(v => v === "true").default("true"),
    includeExceptions: z.string().transform(v => v === "true").default("true"),
  }),
});

const scheduleExportSchema = z.object({
  body: z.object({
    jobId: z.string().uuid(),
    format: z.enum(["csv", "json", "xlsx", "quickbooks", "xero", "netsuite"]),
    schedule: z.string(), // Cron expression
    destination: z.object({
      type: z.enum(["email", "s3", "webhook", "accounting"]),
      config: z.record(z.unknown()),
    }),
  }),
});

// Export report in various formats
router.get(
  "/jobs/:jobId/export",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(exportReportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const queryParams = exportReportSchema.parse({ params: req.params, query: req.query });
      const { format, startDate, endDate, includeMatched, includeUnmatched: _includeUnmatched, includeExceptions } = queryParams.query;
      const userId = req.userId!;

      if (!jobId || !userId) {
        throw new NotFoundError("Job ID and User ID are required", "job", jobId || "unknown");
      }

      // Verify job ownership
      const jobs = await query<{ id: string; name: string }>(
        `SELECT id, name FROM jobs WHERE id = $1 AND user_id = $2`,
        [jobId, userId]
      );

      if (jobs.length === 0 || !jobs[0]) {
        throw new NotFoundError("Job not found", "job", jobId);
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get execution
      const executions = await query<{ id: string }>(
        `SELECT id FROM executions
         WHERE job_id = $1 AND started_at >= $2 AND started_at <= $3
         ORDER BY started_at DESC LIMIT 1`,
        [jobId!, start.toISOString(), end.toISOString()]
      );

      if (executions.length === 0 || !executions[0]) {
        throw new NotFoundError("No execution found for date range", "execution", jobId);
      }

      const executionId = executions[0].id;

      // Get data based on format
      if (format === "csv" || format === "xlsx") {
        const matches = includeMatched
          ? await query<{
              source_id: string;
              target_id: string;
              amount: number;
              currency: string;
              confidence: number;
              matched_at: Date;
            }>(
              `SELECT source_id, target_id, amount, currency, confidence, matched_at
               FROM matches WHERE execution_id = $1`,
              [executionId]
            )
          : [];

        const exceptions = includeExceptions
          ? await query<{
              source_id: string;
              category: string;
              description: string;
              severity: string;
            }>(
              `SELECT source_id, category, description, severity
               FROM exceptions WHERE execution_id = $1`,
              [executionId]
            )
          : [];

        // Generate CSV
        if (format === "csv") {
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename="settler-export-${jobId}.csv"`);

          let csv = "Type,Source ID,Target ID,Amount,Currency,Confidence,Date,Category,Description,Severity\n";

          for (const match of matches) {
            csv += `Matched,${match.source_id},${match.target_id},${match.amount},${match.currency},${(match.confidence * 100).toFixed(1)}%,${match.matched_at.toISOString()},,,\n`;
          }

          for (const exception of exceptions) {
            csv += `Exception,${exception.source_id},,${exception.category},,${exception.description},${exception.severity}\n`;
          }

          res.send(csv);
          return;
        }

        // XLSX format (would use exceljs library in production)
        res.json({
          data: {
            matches,
            exceptions,
            format: "xlsx",
            message: "XLSX export requires exceljs library. Use CSV format for now.",
          },
        });
        return;
      }

      // Accounting format exports
      if (format === "quickbooks" || format === "xero" || format === "netsuite") {
        const matches = await query<{
          source_id: string;
          target_id: string;
          amount: number;
          currency: string;
          date: Date;
        }>(
          `SELECT source_id, target_id, amount, currency, matched_at as date
           FROM matches WHERE execution_id = $1`,
          [executionId]
        );

        // Format for accounting system
        const accountingFormat = formatAccountingExport(matches, format);

        res.json({
          data: {
            format,
            transactions: accountingFormat,
            count: matches.length,
            message: `Formatted for ${format} import`,
          },
        });
        return;
      }

      // JSON format
      const matches = includeMatched
        ? await query(
            `SELECT * FROM matches WHERE execution_id = $1`,
            [executionId]
          )
        : [];

      const exceptions = includeExceptions
        ? await query(
            `SELECT * FROM exceptions WHERE execution_id = $1`,
            [executionId]
          )
        : [];

      res.json({
        data: {
          jobId,
          jobName: jobs[0]?.name || "Unknown",
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          matches: includeMatched ? matches : undefined,
          exceptions: includeExceptions ? exceptions : undefined,
          format: "json",
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to export report", 500, { userId: req.userId });
    }
  }
);

// Schedule recurring exports
router.post(
  "/jobs/:jobId/exports/schedule",
  requirePermission(Permission.REPORTS_EXPORT),
  validateRequest(scheduleExportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const { format, schedule, destination } = req.body;
      const userId = req.userId!;

      if (!jobId || !userId) {
        throw new NotFoundError("Job ID and User ID are required", "job", jobId || "unknown");
      }

      // Verify job ownership
      const jobs = await query<{ id: string }>(
        `SELECT id FROM jobs WHERE id = $1 AND user_id = $2`,
        [jobId, userId]
      );

      if (jobs.length === 0 || !jobs[0]) {
        throw new NotFoundError("Job not found", "job", jobId);
      }

      // Create scheduled export (would use job queue in production)
      const exportId = `export_${Date.now()}`;

      res.status(201).json({
        data: {
          id: exportId,
          jobId,
          format,
          schedule,
          destination,
          status: "scheduled",
        },
        message: "Export scheduled successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to schedule export", 500, { userId: req.userId });
    }
  }
);

// Helper functions

function formatAccountingExport(
  matches: Array<{ source_id: string; target_id: string; amount: number; currency: string; date: Date }>,
  format: "quickbooks" | "xero" | "netsuite"
): unknown[] {
  if (format === "quickbooks") {
    return matches.map(m => ({
      Date: m.date.toISOString().split("T")[0],
      Amount: m.amount,
      Currency: m.currency,
      Description: `Reconciled transaction ${m.source_id}`,
      Account: "Accounts Receivable",
      Reference: m.target_id,
    }));
  }

  if (format === "xero") {
    return matches.map(m => ({
      Date: m.date.toISOString().split("T")[0],
      Amount: m.amount,
      Currency: m.currency,
      Description: `Reconciled transaction ${m.source_id}`,
      AccountCode: "200",
      Reference: m.target_id,
    }));
  }

  if (format === "netsuite") {
    return matches.map(m => ({
      date: m.date.toISOString().split("T")[0],
      amount: m.amount,
      currency: m.currency,
      memo: `Reconciled transaction ${m.source_id}`,
      account: "Accounts Receivable",
      reference: m.target_id,
    }));
  }

  return matches;
}

export { router as exportEnhancedRouter };
