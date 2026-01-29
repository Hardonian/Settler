"use strict";
/**
 * Enhanced Reports Routes
 * UX-005: Report format improvements with visual summaries and drill-down
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsEnhancedRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const typed_errors_1 = require("../utils/typed-errors");
const router = (0, express_1.Router)();
exports.reportsEnhancedRouter = router;
const getEnhancedReportSchema = zod_1.z.object({
    params: zod_1.z.object({
        jobId: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        format: zod_1.z.enum(["json", "csv", "summary"]).optional().default("summary"),
    }),
});
// Get enhanced report with visual summaries
router.get("/reports/:jobId/enhanced", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getEnhancedReportSchema), async (req, res) => {
    try {
        const { jobId } = req.params;
        const { startDate, endDate, format } = req.query;
        const userId = req.userId;
        if (!jobId || !userId) {
            throw new typed_errors_1.NotFoundError("Job ID and User ID are required", "job", jobId || "unknown");
        }
        // Verify job ownership
        const jobs = await (0, db_1.query)(`SELECT user_id, name FROM jobs WHERE id = $1`, [jobId]);
        if (jobs.length === 0 || !jobs[0] || jobs[0].user_id !== userId) {
            throw new typed_errors_1.NotFoundError("Job not found", "job", jobId);
        }
        const start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        // Get summary statistics
        const summary = await (0, db_1.query)(`SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed' AND (summary->>'matched')::int > 0) as matched,
           COUNT(*) FILTER (WHERE status = 'completed' AND (summary->>'unmatched')::int > 0) as unmatched,
           COUNT(*) FILTER (WHERE status = 'failed') as errors,
           AVG((summary->>'accuracy')::float) as avg_accuracy,
           SUM((summary->>'totalAmount')::decimal) as total_amount,
           SUM((summary->>'matchedAmount')::decimal) as matched_amount,
           SUM((summary->>'unmatchedAmount')::decimal) as unmatched_amount
         FROM executions
         WHERE job_id = $1 AND started_at >= $2 AND started_at <= $3`, [jobId, start.toISOString(), end.toISOString()]);
        const stats = summary[0] || {
            total: 0,
            matched: 0,
            unmatched: 0,
            errors: 0,
            avg_accuracy: 0,
            total_amount: 0,
            matched_amount: 0,
            unmatched_amount: 0,
        };
        // Get recent executions
        const recentExecutions = await (0, db_1.query)(`SELECT id, status, started_at, completed_at, summary
         FROM executions
         WHERE job_id = $1 AND started_at >= $2 AND started_at <= $3
         ORDER BY started_at DESC
         LIMIT 10`, [jobId, start.toISOString(), end.toISOString()]);
        // Get exception count
        const exceptionCount = await (0, db_1.query)(`SELECT COUNT(*) as count
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE j.id = $1 AND e.created_at >= $2 AND e.created_at <= $3 AND e.resolution_status = 'open'`, [jobId, start.toISOString(), end.toISOString()]);
        // Format response based on format type
        if (format === "summary") {
            // Visual summary format (UX-005)
            res.json({
                data: {
                    jobId,
                    jobName: jobs[0]?.name || "Unknown",
                    dateRange: {
                        start: start.toISOString(),
                        end: end.toISOString(),
                    },
                    summary: {
                        totalReconciliations: parseInt(String(stats.total || "0")),
                        matched: parseInt(String(stats.matched || "0")),
                        unmatched: parseInt(String(stats.unmatched || "0")),
                        errors: parseInt(String(stats.errors || "0")),
                        accuracy: stats.avg_accuracy || 0,
                        totalAmount: parseFloat(stats.total_amount?.toString() || "0"),
                        matchedAmount: parseFloat(stats.matched_amount?.toString() || "0"),
                        unmatchedAmount: parseFloat(stats.unmatched_amount?.toString() || "0"),
                        openExceptions: parseInt(exceptionCount[0]?.count || "0"),
                    },
                    recentExecutions: recentExecutions.map((e) => ({
                        id: e.id,
                        status: e.status,
                        startedAt: e.started_at.toISOString(),
                        completedAt: e.completed_at?.toISOString() || null,
                        summary: e.summary,
                    })),
                    // Visual summary cards (UX-005)
                    cards: [
                        {
                            title: "Total Reconciliations",
                            value: parseInt(String(stats.total || "0")),
                            trend: "up", // Would calculate from previous period
                        },
                        {
                            title: "Accuracy",
                            value: `${(stats.avg_accuracy || 0).toFixed(1)}%`,
                            trend: stats.avg_accuracy >= 95 ? "good" : "warning",
                        },
                        {
                            title: "Open Exceptions",
                            value: parseInt(exceptionCount[0]?.count || "0"),
                            trend: parseInt(exceptionCount[0]?.count || "0") > 10 ? "warning" : "good",
                        },
                        {
                            title: "Total Amount",
                            value: `$${parseFloat(stats.total_amount?.toString() || "0").toLocaleString()}`,
                            trend: "neutral",
                        },
                    ],
                },
            });
        }
        else {
            // JSON or CSV format (existing behavior)
            // Return standard report format
            const report = await (0, db_1.query)(`SELECT id, summary, generated_at
           FROM reports
           WHERE job_id = $1 AND generated_at >= $2 AND generated_at <= $3
           ORDER BY generated_at DESC
           LIMIT 1`, [jobId, start, end]);
            if (report.length === 0) {
                throw new typed_errors_1.NotFoundError("Report not found", "report", jobId);
            }
            res.json({
                data: {
                    jobId,
                    summary: report[0]?.summary || {},
                    generatedAt: report[0]?.generated_at?.toISOString() || new Date().toISOString(),
                },
            });
        }
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get enhanced report", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=reports-enhanced.js.map