"use strict";
/**
 * Confidence Score Routes
 * UX-006: Trust anchors - Confidence scores explained
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.confidenceRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const typed_errors_1 = require("../utils/typed-errors");
const confidence_scoring_1 = require("../services/confidence-scoring");
const router = (0, express_1.Router)();
exports.confidenceRouter = router;
const getConfidenceScoreSchema = zod_1.z.object({
    params: zod_1.z.object({
        matchId: zod_1.z.string().uuid(),
    }),
});
// Get confidence score for a match
router.get("/matches/:matchId/confidence", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getConfidenceScoreSchema), async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.userId;
        if (!matchId || !userId) {
            throw new typed_errors_1.NotFoundError("Match ID and User ID are required", "match", matchId || "unknown");
        }
        // Get match details
        const matches = await (0, db_1.query)(`SELECT m.id, m.job_id, m.source_id, m.target_id, m.confidence,
                m.source_data, m.target_data
         FROM matches m
         JOIN jobs j ON m.job_id = j.id
         WHERE m.id = $1 AND j.user_id = $2`, [matchId, userId]);
        if (matches.length === 0 || !matches[0]) {
            throw new typed_errors_1.NotFoundError("Match not found", "match", matchId);
        }
        const match = matches[0];
        // Get job rules
        const jobs = await (0, db_1.query)(`SELECT rules FROM jobs WHERE id = $1`, [match.job_id]);
        if (jobs.length === 0 || !jobs[0]) {
            throw new typed_errors_1.NotFoundError("Job not found", "job", match.job_id);
        }
        const rules = jobs[0].rules.matching || [];
        // Calculate detailed confidence score
        const confidence = (0, confidence_scoring_1.calculateConfidenceScore)({
            sourceId: match.source_id,
            targetId: match.target_id,
            sourceData: match.source_data || {},
            targetData: match.target_data || {},
            rules: rules,
        }, rules);
        // Explain confidence score
        const explanation = (0, confidence_scoring_1.explainConfidenceScore)(confidence);
        res.json({
            data: {
                matchId: match.id,
                confidence: {
                    score: confidence.score,
                    percentage: (confidence.score * 100).toFixed(1),
                    explanation,
                    breakdown: confidence.breakdown,
                    factors: confidence.factors,
                },
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get confidence score", 500, { userId: req.userId });
    }
});
// Get accuracy metrics for a job
router.get("/jobs/:jobId/accuracy", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;
        if (!jobId) {
            throw new typed_errors_1.NotFoundError("Job ID is required", "job", "unknown");
        }
        // Verify job ownership
        const jobs = await (0, db_1.query)(`SELECT id FROM jobs WHERE id = $1 AND user_id = $2`, [jobId, userId]);
        if (jobs.length === 0) {
            throw new typed_errors_1.NotFoundError("Job not found", "job", jobId);
        }
        // Get accuracy metrics
        const metrics = await (0, db_1.query)(`SELECT 
           COUNT(*) as total_matches,
           COUNT(*) FILTER (WHERE confidence >= 0.95) as high_confidence,
           COUNT(*) FILTER (WHERE confidence >= 0.80 AND confidence < 0.95) as medium_confidence,
           COUNT(*) FILTER (WHERE confidence < 0.80) as low_confidence,
           AVG(confidence) as avg_confidence,
           (COUNT(*) FILTER (WHERE confidence >= 0.95)::float / NULLIF(COUNT(*), 0)) * 100 as accuracy
         FROM matches
         WHERE job_id = $1`, [jobId]);
        const m = metrics[0] || {
            total_matches: 0,
            high_confidence: 0,
            medium_confidence: 0,
            low_confidence: 0,
            avg_confidence: 0,
            accuracy: 0,
        };
        res.json({
            data: {
                jobId,
                accuracy: {
                    totalMatches: parseInt(String(m.total_matches || "0")),
                    highConfidence: parseInt(String(m.high_confidence || "0")),
                    mediumConfidence: parseInt(String(m.medium_confidence || "0")),
                    lowConfidence: parseInt(String(m.low_confidence || "0")),
                    averageConfidence: m.avg_confidence || 0,
                    accuracyPercentage: m.accuracy || 0,
                    badge: m.accuracy >= 95 ? "high" : m.accuracy >= 80 ? "medium" : "low",
                },
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get accuracy metrics", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=confidence.js.map