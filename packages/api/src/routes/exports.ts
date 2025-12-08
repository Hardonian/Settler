/**
 * Export Routes
 *
 * Provides data export in various formats:
 * - CSV
 * - Excel (XLSX)
 * - PDF reports
 * - JSON
 */

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { logInfo, logError } from "../utils/logger";
import { PDFGenerator } from "../services/export/pdf-generator";
import { query } from "../db";
import { sendError } from "../utils/api-response";

const router = Router();
const pdfGenerator = new PDFGenerator();

/**
 * Export reconciliation data
 * POST /api/v1/exports
 */
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, format = "csv" } = req.body;

    if (!jobId) {
      return sendError(res, 400, "BAD_REQUEST", "jobId is required");
    }

    const supportedFormats = ["csv", "xlsx", "pdf", "json"];
    if (!supportedFormats.includes(format)) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        `Unsupported format. Supported formats: ${supportedFormats.join(", ")}`
      );
    }

    const userId = req.userId!;
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "User ID required");
    }

    // Verify job ownership
    const jobs = await query<{ user_id: string }>(`SELECT user_id FROM jobs WHERE id = $1`, [
      jobId,
    ]);
    if (jobs.length === 0 || !jobs[0]) {
      return sendError(res, 404, "NOT_FOUND", "Job not found");
    }
    if (jobs[0].user_id !== userId) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this job");
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logInfo("Export requested", {
      exportId,
      jobId,
      format,
      userId,
      tenantId: req.tenantId,
    });

    // Handle PDF export
    if (format === "pdf") {
      try {
        const reportData = await pdfGenerator.fetchReportData(jobId, userId);
        if (!reportData) {
          return sendError(res, 404, "NOT_FOUND", "No report data found for this job");
        }

        const pdfBuffer = await pdfGenerator.generatePDF(reportData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reconciliation_${jobId}_${Date.now()}.pdf"`
        );

        return res.send(pdfBuffer);
      } catch (error) {
        logError("PDF generation failed", error);
        return sendError(res, 500, "INTERNAL_ERROR", "Failed to generate PDF export");
      }
    }

    // Handle CSV export
    if (format === "csv") {
      try {
        // Get report data
        interface ExecutionSummary {
          matched?: number;
          unmatched?: number;
          errors?: number;
          accuracy?: number;
          totalTransactions?: number;
        }

        const executions = await query<{ summary: ExecutionSummary | null }>(
          `SELECT summary FROM executions WHERE job_id = $1 ORDER BY completed_at DESC LIMIT 1`,
          [jobId]
        );

        if (executions.length === 0 || !executions[0]) {
          return sendError(res, 404, "NOT_FOUND", "No execution data found");
        }

        // Get matches for CSV
        const matches = await query<{
          source_id: string;
          target_id: string;
          amount: number;
          currency: string;
          confidence: number;
          matched_at: Date;
        }>(
          `SELECT source_id, target_id, amount, currency, confidence, matched_at
           FROM reconciliation_graph_edges
           WHERE edge_type = 'matches'
           ORDER BY created_at DESC
           LIMIT 10000`
        );

        // Generate CSV
        const csvHeader = "Source ID,Target ID,Amount,Currency,Confidence,Matched At\n";
        const csvRows = matches
          .map(
            (m) =>
              `"${m.source_id}","${m.target_id}",${m.amount},"${m.currency}",${m.confidence},"${m.matched_at.toISOString()}"`
          )
          .join("\n");
        const csv = csvHeader + csvRows;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reconciliation_${jobId}_${Date.now()}.csv"`
        );

        return res.send(csv);
      } catch (error) {
        logError("CSV generation failed", error);
        return sendError(res, 500, "INTERNAL_ERROR", "Failed to generate CSV export");
      }
    }

    // Handle JSON export
    if (format === "json") {
      try {
        const executions = await query<{ summary: ExecutionSummary | null; completed_at: Date }>(
          `SELECT summary, completed_at FROM executions WHERE job_id = $1 ORDER BY completed_at DESC LIMIT 1`,
          [jobId]
        );

        if (executions.length === 0 || !executions[0]) {
          return sendError(res, 404, "NOT_FOUND", "No execution data found");
        }

        const reportData = {
          jobId,
          summary: executions[0].summary,
          completedAt: executions[0].completed_at,
          exportedAt: new Date().toISOString(),
        };

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="reconciliation_${jobId}_${Date.now()}.json"`
        );

        return res.json(reportData);
      } catch (error) {
        logError("JSON export failed", error);
        return sendError(res, 500, "INTERNAL_ERROR", "Failed to generate JSON export");
      }
    }

    // XLSX export (placeholder - requires exceljs implementation)
    return sendError(res, 501, "NOT_IMPLEMENTED", "XLSX export coming soon");
  } catch (error) {
    logError("Export failed", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create export",
    });
  }
});

/**
 * Download export file
 * GET /api/v1/exports/:exportId/download
 *
 * Note: For PDF/CSV/JSON, files are streamed directly in POST /exports
 * This endpoint is kept for future use with file storage
 */
router.get("/:exportId/download", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    // const { exportId } = _req.params; // Unused for now

    // Future: Fetch from file storage (S3, R2, etc.)
    // For now, exports are streamed directly in POST /exports
    return sendError(
      res,
      404,
      "NOT_FOUND",
      "Export not found. Use POST /exports to generate and download directly."
    );
  } catch (error) {
    logError("Export download failed", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to download export");
  }
});

export { router as exportsRouter };
