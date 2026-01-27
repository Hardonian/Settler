"use strict";
/**
 * Receipt Matching API Routes
 * Handles receipt auto-matching endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const receipt_matching_1 = require("../../services/receipt-matching");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/receipt-matching/match
 * Match receipts to transactions
 */
router.post("/match", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { reconciliationRunId, receipts, transactions } = req.body;
        if (!reconciliationRunId || !receipts || !transactions) {
            return res.status(400).json({
                error: "Bad Request",
                message: "reconciliationRunId, receipts, and transactions are required",
                traceId: req.traceId,
            });
        }
        const matches = await (0, receipt_matching_1.matchReceiptsToTransactions)(tenantId, reconciliationRunId, receipts, transactions);
        (0, logger_1.logInfo)("Receipts matched", {
            tenantId,
            reconciliationRunId,
            matchCount: matches.length,
            traceId: req.traceId,
        });
        return res.status(200).json({
            matches,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to match receipts", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to match receipts",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/receipt-matching/matches/:reconciliationRunId
 * Get receipt matches for a reconciliation run
 */
router.get("/matches/:reconciliationRunId", async (req, res) => {
    try {
        const { reconciliationRunId } = req.params;
        const tenantId = req.tenantId;
        if (!reconciliationRunId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "reconciliationRunId is required",
                traceId: req.traceId,
            });
        }
        const matches = await (0, receipt_matching_1.getReceiptMatches)(tenantId, reconciliationRunId);
        return res.json({
            data: matches,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get receipt matches", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get receipt matches",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/receipt-matching/links/:linkId/verify
 * Verify a receipt-transaction link
 */
router.post("/links/:linkId/verify", async (req, res) => {
    try {
        const { linkId } = req.params;
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!linkId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "linkId is required",
                traceId: req.traceId,
            });
        }
        await (0, receipt_matching_1.verifyReceiptLink)(tenantId, linkId, userId);
        (0, logger_1.logInfo)("Receipt link verified", { linkId, tenantId, userId, traceId: req.traceId });
        return res.status(200).json({
            message: "Link verified",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to verify receipt link", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to verify receipt link",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=receipt-matching.js.map