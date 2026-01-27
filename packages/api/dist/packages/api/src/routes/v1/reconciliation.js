"use strict";
/**
 * Reconciliation API Routes
 * Handles reconciliation runs and matches
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const reconciliation_matcher_1 = require("../../services/ingestion/reconciliation-matcher");
const db_1 = require("../../db");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/reconciliation/run
 * Run reconciliation for an ingestion
 */
router.post("/run", async (req, res) => {
    try {
        const { ingestionId, config } = req.body;
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!ingestionId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "ingestionId is required",
                traceId: req.traceId,
            });
        }
        const reconciliationConfig = {
            dateWindowDays: config?.dateWindowDays || 7,
            amountTolerance: config?.amountTolerance || 0.01,
            fuzzyDescriptionThreshold: config?.fuzzyDescriptionThreshold || 0.8,
            requireExactAmount: config?.requireExactAmount || false,
        };
        const runId = await (0, reconciliation_matcher_1.runReconciliation)(ingestionId, tenantId, userId, reconciliationConfig);
        (0, logger_1.logInfo)("Reconciliation run started", { runId, ingestionId, traceId: req.traceId });
        return res.status(201).json({
            runId,
            ingestionId,
            status: "running",
            config: reconciliationConfig,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to run reconciliation", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to run reconciliation",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/reconciliation/runs/:runId
 * Get reconciliation run details
 */
router.get("/runs/:runId", async (req, res) => {
    try {
        const { runId } = req.params;
        const tenantId = req.tenantId;
        const results = await (0, db_1.query)(`SELECT 
        id, ingestion_id, status, started_at, completed_at,
        source_count, target_count, matched_count,
        unmatched_source_count, unmatched_target_count,
        confidence_avg, error_message, trace_id, metadata
      FROM reconciliation_runs
      WHERE id = $1 AND tenant_id = $2`, [runId || "", tenantId]);
        if (results.length === 0) {
            return res.status(404).json({
                error: "Not Found",
                message: "Reconciliation run not found",
                traceId: req.traceId,
            });
        }
        const run = results[0];
        return res.json({
            id: run.id,
            ingestionId: run.ingestion_id,
            status: run.status,
            startedAt: run.started_at,
            completedAt: run.completed_at,
            sourceCount: run.source_count,
            targetCount: run.target_count,
            matchedCount: run.matched_count,
            unmatchedSourceCount: run.unmatched_source_count,
            unmatchedTargetCount: run.unmatched_target_count,
            confidenceAvg: run.confidence_avg,
            errorMessage: run.error_message,
            traceId: run.trace_id,
            metadata: typeof run.metadata === "string"
                ? JSON.parse(run.metadata)
                : run.metadata,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get reconciliation run", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get reconciliation run",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/reconciliation/runs/:runId/matches
 * Get reconciliation matches
 */
router.get("/runs/:runId/matches", async (req, res) => {
    try {
        const { runId } = req.params;
        const tenantId = req.tenantId;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const matchType = req.query.matchType;
        const reviewed = req.query.reviewed;
        let queryStr = `SELECT 
      rm.id, rm.match_type, rm.confidence, rm.match_reason,
      rm.amount_diff, rm.date_diff, rm.reviewed, rm.reviewed_at,
      st.id as source_id, st.amount as source_amount, st.currency as source_currency,
      st.date as source_date, st.description as source_description,
      st.external_id as source_external_id,
      tt.id as target_id, tt.amount as target_amount, tt.currency as target_currency,
      tt.date as target_date, tt.description as target_description,
      tt.external_id as target_external_id
    FROM reconciliation_matches rm
    JOIN normalized_transactions st ON st.id = rm.source_transaction_id
    LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
    WHERE rm.run_id = $1 AND rm.tenant_id = $2`;
        const params = [runId, tenantId];
        if (matchType) {
            queryStr += ` AND rm.match_type = $${params.length + 1}`;
            params.push(matchType);
        }
        if (reviewed !== undefined) {
            queryStr += ` AND rm.reviewed = $${params.length + 1}`;
            params.push(reviewed === "true");
        }
        queryStr += ` ORDER BY rm.confidence DESC, st.date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit.toString(), offset.toString());
        const matches = await (0, db_1.query)(queryStr, params);
        const totalResults = await (0, db_1.query)(`SELECT COUNT(*) as count
      FROM reconciliation_matches
      WHERE run_id = $1 AND tenant_id = $2`, [runId || "", tenantId]);
        const total = totalResults[0].count;
        return res.json({
            matches: matches.map((m) => ({
                id: m.id,
                matchType: m.match_type,
                confidence: m.confidence,
                matchReason: m.match_reason,
                amountDiff: m.amount_diff,
                dateDiff: m.date_diff,
                reviewed: m.reviewed,
                reviewedAt: m.reviewed_at,
                source: {
                    id: m.source_id,
                    amount: m.source_amount,
                    currency: m.source_currency,
                    date: m.source_date,
                    description: m.source_description,
                    externalId: m.source_external_id,
                },
                target: m.target_id
                    ? {
                        id: m.target_id,
                        amount: m.target_amount,
                        currency: m.target_currency,
                        date: m.target_date,
                        description: m.target_description,
                        externalId: m.target_external_id,
                    }
                    : null,
            })),
            pagination: {
                limit,
                offset,
                total: parseInt(total),
            },
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get reconciliation matches", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get reconciliation matches",
            traceId: req.traceId,
        });
    }
});
/**
 * PATCH /api/v1/reconciliation/matches/:matchId
 * Update match (e.g., mark as reviewed)
 */
router.patch("/matches/:matchId", async (req, res) => {
    try {
        const { matchId } = req.params;
        const { reviewed } = req.body;
        const tenantId = req.tenantId;
        const userId = req.userId;
        await (0, db_1.query)(`UPDATE reconciliation_matches SET
        reviewed = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4`, [reviewed === true, userId || "", matchId || "", tenantId]);
        return res.json({
            id: matchId,
            reviewed: reviewed === true,
            reviewedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update match", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update match",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=reconciliation.js.map