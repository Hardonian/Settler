"use strict";
/**
 * Feedback Routes
 * VOC: Feedback collection and aggregation system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const event_tracker_1 = require("../utils/event-tracker");
const router = (0, express_1.Router)();
exports.feedbackRouter = router;
const createFeedbackSchema = zod_1.z.object({
    body: zod_1.z.object({
        source: zod_1.z.enum(["sales_call", "user_interview", "support_ticket", "github_issue", "community", "survey"]),
        persona: zod_1.z.enum(["cto", "cfo", "finance_ops", "developer"]).optional(),
        company: zod_1.z.string().max(255).optional(),
        context: zod_1.z.object({
            stage: zod_1.z.enum(["evaluating", "onboarding", "active", "churned"]).optional(),
            useCase: zod_1.z.string().optional(),
            transactionVolume: zod_1.z.string().optional(),
        }).optional(),
        pain: zod_1.z.object({
            description: zod_1.z.string().min(1),
            severity: zod_1.z.enum(["high", "medium", "low"]),
            frequency: zod_1.z.enum(["daily", "weekly", "monthly", "one-time"]),
        }),
        desiredOutcome: zod_1.z.object({
            description: zod_1.z.string().min(1),
            successMetric: zod_1.z.string().optional(),
        }),
        workaround: zod_1.z.object({
            description: zod_1.z.string(),
            painPoints: zod_1.z.array(zod_1.z.string()),
        }).optional(),
        quotes: zod_1.z.array(zod_1.z.string()).optional(),
        featureRequests: zod_1.z.array(zod_1.z.object({
            feature: zod_1.z.string(),
            priority: zod_1.z.enum(["high", "medium", "low"]),
            rationale: zod_1.z.string(),
        })).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const listFeedbackSchema = zod_1.z.object({
    query: zod_1.z.object({
        persona: zod_1.z.enum(["cto", "cfo", "finance_ops", "developer"]).optional(),
        source: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
        offset: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
    }),
});
// Create feedback
router.post("/feedback", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), (0, validation_1.validateRequest)(createFeedbackSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const feedback = req.body;
        const result = await (0, db_1.query)(`INSERT INTO feedback (
           user_id, source, persona, company, context,
           pain, desired_outcome, workaround, quotes, feature_requests, tags
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`, [
            userId,
            feedback.source,
            feedback.persona || null,
            feedback.company || null,
            JSON.stringify(feedback.context || {}),
            JSON.stringify(feedback.pain),
            JSON.stringify(feedback.desiredOutcome),
            feedback.workaround ? JSON.stringify(feedback.workaround) : null,
            feedback.quotes || [],
            feedback.featureRequests ? JSON.stringify(feedback.featureRequests) : null,
            feedback.tags || [],
        ]);
        if (!result[0]) {
            throw new Error('Failed to create feedback');
        }
        // Track event
        (0, event_tracker_1.trackEventAsync)(userId, 'FeedbackCreated', {
            feedbackId: result[0].id,
            source: feedback.source,
            persona: feedback.persona,
        });
        res.status(201).json({
            data: {
                id: result[0].id,
            },
            message: "Feedback created successfully",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to create feedback", 500, { userId: req.userId });
    }
});
// List feedback
router.get("/feedback", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_READ), (0, validation_1.validateRequest)(listFeedbackSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const queryParams = listFeedbackSchema.parse({ query: req.query });
        const { persona, source, startDate, endDate, limit, offset } = queryParams.query;
        const conditions = [];
        const values = [];
        let paramCount = 1;
        // Only show feedback for user's organization (or all if admin)
        conditions.push(`user_id = $${paramCount++}`);
        values.push(userId);
        if (persona) {
            conditions.push(`persona = $${paramCount++}`);
            values.push(persona);
        }
        if (source) {
            conditions.push(`source = $${paramCount++}`);
            values.push(source);
        }
        if (startDate) {
            conditions.push(`created_at >= $${paramCount++}`);
            values.push(new Date(startDate));
        }
        if (endDate) {
            conditions.push(`created_at <= $${paramCount++}`);
            values.push(new Date(endDate));
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const feedback = await (0, db_1.query)(`SELECT id, source, persona, company, context,
                pain, desired_outcome, workaround, quotes, feature_requests, tags,
                created_at
         FROM feedback
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`, [...values, limit, offset]);
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM feedback ${whereClause}`, values);
        if (!countResult[0]) {
            throw new Error('Failed to get feedback count');
        }
        const total = parseInt(countResult[0].count);
        res.json({
            data: feedback.map((f) => {
                if (!f)
                    return null;
                return {
                    id: f.id,
                    source: f.source,
                    persona: f.persona,
                    company: f.company,
                    context: f.context,
                    pain: f.pain,
                    desiredOutcome: f.desired_outcome,
                    workaround: f.workaround,
                    quotes: f.quotes,
                    featureRequests: f.feature_requests,
                    tags: f.tags,
                    createdAt: f.created_at.toISOString(),
                };
            }).filter((f) => f !== null),
            pagination: {
                limit,
                offset,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to list feedback", 500, { userId: req.userId });
    }
});
// Get feedback insights
router.get("/feedback/insights", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        // Top pains by frequency
        const topPains = await (0, db_1.query)(`SELECT 
           pain->>'description' as pain_description,
           COUNT(*) as count,
           AVG(CASE 
             WHEN pain->>'severity' = 'high' THEN 3
             WHEN pain->>'severity' = 'medium' THEN 2
             WHEN pain->>'severity' = 'low' THEN 1
           END) as avg_severity
         FROM feedback
         WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
         GROUP BY pain_description
         ORDER BY count DESC, avg_severity DESC
         LIMIT 10`, [userId, start, end]);
        // Feature requests by frequency
        const topFeatureRequests = await (0, db_1.query)(`SELECT 
           feature_request->>'feature' as feature,
           COUNT(*) as count,
           AVG(CASE 
             WHEN feature_request->>'priority' = 'high' THEN 3
             WHEN feature_request->>'priority' = 'medium' THEN 2
             WHEN feature_request->>'priority' = 'low' THEN 1
           END) as avg_priority
         FROM feedback,
         LATERAL jsonb_array_elements(feature_requests) AS feature_request
         WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
         GROUP BY feature
         ORDER BY count DESC, avg_priority DESC
         LIMIT 10`, [userId, start, end]);
        res.json({
            data: {
                topPains: topPains.map(p => ({
                    description: p.pain_description,
                    count: parseInt(p.count),
                    avgSeverity: parseFloat(p.avg_severity),
                })),
                topFeatureRequests: topFeatureRequests.map(f => ({
                    feature: f.feature,
                    count: parseInt(f.count),
                    avgPriority: parseFloat(f.avg_priority),
                })),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get feedback insights", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=feedback.js.map