"use strict";
/**
 * PDF Export Service
 * Generates PDF reports for reconciliation data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const db_1 = require("../../db");
class PDFGenerator {
    /**
     * Generate PDF report
     */
    async generatePDF(reportData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: "LETTER",
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                });
                const buffers = [];
                doc.on("data", (chunk) => buffers.push(chunk));
                doc.on("end", () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
                doc.on("error", reject);
                // Header
                doc
                    .fontSize(24)
                    .font("Helvetica-Bold")
                    .text("Reconciliation Report", { align: "center" })
                    .moveDown();
                // Job Information
                doc
                    .fontSize(14)
                    .font("Helvetica-Bold")
                    .text("Job Information", { underline: true })
                    .moveDown(0.5)
                    .fontSize(12)
                    .font("Helvetica")
                    .text(`Job Name: ${reportData.jobName}`, { indent: 20 })
                    .text(`Job ID: ${reportData.jobId}`, { indent: 20 })
                    .text(`Date Range: ${reportData.dateRange.start.toLocaleDateString()} - ${reportData.dateRange.end.toLocaleDateString()}`, { indent: 20 })
                    .text(`Generated: ${new Date().toLocaleString()}`, { indent: 20 })
                    .moveDown();
                // Summary Section
                doc
                    .fontSize(14)
                    .font("Helvetica-Bold")
                    .text("Summary", { underline: true })
                    .moveDown(0.5)
                    .fontSize(12)
                    .font("Helvetica");
                const summary = reportData.summary;
                doc
                    .text(`Total Transactions: ${summary.totalTransactions}`, { indent: 20 })
                    .text(`Matched: ${summary.matched}`, { indent: 20 })
                    .text(`Unmatched: ${summary.unmatched}`, { indent: 20 })
                    .text(`Errors: ${summary.errors}`, { indent: 20 })
                    .text(`Accuracy: ${summary.accuracy.toFixed(2)}%`, { indent: 20 })
                    .moveDown();
                // Matched Transactions
                if (reportData.matches.length > 0) {
                    doc
                        .fontSize(14)
                        .font("Helvetica-Bold")
                        .text("Matched Transactions", { underline: true })
                        .moveDown(0.5)
                        .fontSize(10)
                        .font("Helvetica");
                    // Table header
                    const tableTop = doc.y;
                    doc
                        .font("Helvetica-Bold")
                        .text("Source ID", 50, tableTop)
                        .text("Target ID", 150, tableTop)
                        .text("Amount", 250, tableTop)
                        .text("Currency", 320, tableTop)
                        .text("Confidence", 400, tableTop)
                        .moveDown(0.3);
                    // Table rows
                    let y = doc.y;
                    reportData.matches.slice(0, 50).forEach((match) => {
                        // Limit to 50 matches per page to avoid overflow
                        if (y > 700) {
                            doc.addPage();
                            y = 50;
                        }
                        doc
                            .font("Helvetica")
                            .fontSize(9)
                            .text(match.sourceId.substring(0, 20), 50, y)
                            .text(match.targetId.substring(0, 20), 150, y)
                            .text(match.amount.toFixed(2), 250, y)
                            .text(match.currency, 320, y)
                            .text((match.confidence * 100).toFixed(1) + "%", 400, y);
                        y += 15;
                    });
                    if (reportData.matches.length > 50) {
                        doc
                            .fontSize(10)
                            .font("Helvetica")
                            .text(`... and ${reportData.matches.length - 50} more matches`, { indent: 20 });
                    }
                    doc.moveDown();
                }
                // Unmatched Transactions
                if (reportData.unmatched.length > 0) {
                    doc.addPage();
                    doc
                        .fontSize(14)
                        .font("Helvetica-Bold")
                        .text("Unmatched Transactions", { underline: true })
                        .moveDown(0.5)
                        .fontSize(10)
                        .font("Helvetica");
                    const tableTop = doc.y;
                    doc
                        .font("Helvetica-Bold")
                        .text("Source ID", 50, tableTop)
                        .text("Target ID", 150, tableTop)
                        .text("Amount", 250, tableTop)
                        .text("Currency", 320, tableTop)
                        .text("Reason", 400, tableTop)
                        .moveDown(0.3);
                    let y = doc.y;
                    reportData.unmatched.slice(0, 50).forEach((unmatched) => {
                        if (y > 700) {
                            doc.addPage();
                            y = 50;
                        }
                        doc
                            .font("Helvetica")
                            .fontSize(9)
                            .text(unmatched.sourceId?.substring(0, 20) || "N/A", 50, y)
                            .text(unmatched.targetId?.substring(0, 20) || "N/A", 150, y)
                            .text(unmatched.amount.toFixed(2), 250, y)
                            .text(unmatched.currency, 320, y)
                            .text(unmatched.reason.substring(0, 30), 400, y);
                        y += 15;
                    });
                    if (reportData.unmatched.length > 50) {
                        doc
                            .fontSize(10)
                            .font("Helvetica")
                            .text(`... and ${reportData.unmatched.length - 50} more unmatched`, { indent: 20 });
                    }
                    doc.moveDown();
                }
                // Errors
                if (reportData.errors.length > 0) {
                    doc.addPage();
                    doc
                        .fontSize(14)
                        .font("Helvetica-Bold")
                        .text("Errors", { underline: true })
                        .moveDown(0.5)
                        .fontSize(10)
                        .font("Helvetica");
                    reportData.errors.forEach((error) => {
                        doc
                            .text(`[${error.timestamp.toLocaleString()}] ${error.message}`, { indent: 20 })
                            .moveDown(0.3);
                    });
                }
                // Footer
                doc
                    .fontSize(8)
                    .font("Helvetica")
                    .text(`Generated by Settler.dev - ${new Date().toLocaleString()}`, { align: "center" });
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Fetch reconciliation data for PDF generation
     */
    async fetchReportData(jobId, userId, startDate, endDate) {
        // Get job info
        const jobs = await (0, db_1.query)(`SELECT id, name, user_id FROM jobs WHERE id = $1`, [jobId]);
        if (jobs.length === 0 || !jobs[0] || jobs[0].user_id !== userId) {
            return null;
        }
        const job = jobs[0];
        const dateStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dateEnd = endDate || new Date();
        // Get latest execution
        const executions = await (0, db_1.query)(`SELECT id, summary, completed_at
       FROM executions
       WHERE job_id = $1 AND completed_at BETWEEN $2 AND $3
       ORDER BY completed_at DESC
       LIMIT 1`, [jobId, dateStart, dateEnd]);
        if (executions.length === 0 || !executions[0]) {
            return null;
        }
        const execution = executions[0];
        const summary = execution.summary || {
            matched: 0,
            unmatched: 0,
            errors: 0,
            accuracy: 0,
            totalTransactions: 0,
        };
        // Get matches
        const matches = await (0, db_1.query)(`SELECT id, source_id, target_id, amount, currency, confidence, matched_at
       FROM reconciliation_graph_edges
       WHERE edge_type = 'matches'
       AND created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC
       LIMIT 1000`, [dateStart, dateEnd]);
        // Get unmatched
        const unmatched = await (0, db_1.query)(`SELECT id, source_id, target_id, amount, currency, metadata->>'reason' as reason
       FROM reconciliation_graph_nodes
       WHERE node_type = 'unmatched'
       AND created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC
       LIMIT 1000`, [dateStart, dateEnd]);
        // Get errors
        const errors = await (0, db_1.query)(`SELECT id, metadata->>'error' as message, created_at as timestamp
       FROM reconciliation_graph_nodes
       WHERE node_type = 'error'
       AND created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC
       LIMIT 100`, [dateStart, dateEnd]);
        return {
            jobId: job.id,
            jobName: job.name,
            summary: {
                matched: summary.matched || 0,
                unmatched: summary.unmatched || 0,
                errors: summary.errors || 0,
                accuracy: summary.accuracy || 0,
                totalTransactions: summary.totalTransactions || 0,
            },
            matches: matches.map((m) => ({
                id: m.id,
                sourceId: m.source_id,
                targetId: m.target_id,
                amount: Number(m.amount),
                currency: m.currency,
                confidence: Number(m.confidence),
                matchedAt: m.matched_at,
            })),
            unmatched: unmatched.map((u) => {
                const result = {
                    id: u.id,
                    amount: Number(u.amount),
                    currency: u.currency,
                    reason: u.reason || "Unknown",
                };
                if (u.source_id)
                    result.sourceId = u.source_id;
                if (u.target_id)
                    result.targetId = u.target_id;
                return result;
            }),
            errors: errors.map((e) => ({
                id: e.id,
                message: (e.message) || "Unknown error",
                timestamp: e.timestamp,
            })),
            dateRange: {
                start: dateStart,
                end: dateEnd,
            },
        };
    }
}
exports.PDFGenerator = PDFGenerator;
//# sourceMappingURL=pdf-generator.js.map