"use strict";
/**
 * Dashboard Routes
 * E4-S2: Dashboards for activation, usage, revenue, and support metrics
 * Part of Operator-in-a-Box blueprint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const router = (0, express_1.Router)();
exports.dashboardsRouter = router;
const dashboardQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
// Activation Dashboard
router.get("/dashboards/activation", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(dashboardQuerySchema), async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        // Signup funnel
        const signupFunnel = await (0, db_1.query)(`SELECT 
           COUNT(*) FILTER (WHERE event_name = 'SignupStarted') as signup_started,
           COUNT(*) FILTER (WHERE event_name = 'SignupCompleted') as signup_completed,
           COUNT(*) FILTER (WHERE event_name = 'EmailVerified') as email_verified,
           COUNT(*) FILTER (WHERE event_name = 'APIKeyCreated') as api_key_created,
           COUNT(*) FILTER (WHERE event_name = 'JobCreated') as job_created,
           COUNT(*) FILTER (WHERE event_name = 'ReconciliationSuccess') as reconciliation_success
         FROM events
         WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3`, [userId, start, end]);
        // Time to first value
        const timeToFirstValue = await (0, db_1.query)(`WITH user_events AS (
           SELECT 
             user_id,
             MIN(timestamp) FILTER (WHERE event_name = 'SignupCompleted') as signup_time,
             MIN(timestamp) FILTER (WHERE event_name = 'ReconciliationSuccess') as first_success_time
           FROM events
           WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
           GROUP BY user_id
           HAVING MIN(timestamp) FILTER (WHERE event_name = 'ReconciliationSuccess') IS NOT NULL
         )
         SELECT 
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as median_hours,
           PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as p25_hours,
           PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as p75_hours,
           PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as p95_hours
         FROM user_events`, [userId, start, end]);
        // Activation rate by channel (if tracking source)
        const activationByChannel = await (0, db_1.query)(`SELECT 
           COALESCE(properties->>'source', 'unknown') as channel,
           COUNT(*) FILTER (WHERE event_name = 'SignupCompleted') as signups,
           COUNT(*) FILTER (WHERE event_name = 'JobCreated') as activated,
           CASE 
             WHEN COUNT(*) FILTER (WHERE event_name = 'SignupCompleted') > 0
             THEN COUNT(*) FILTER (WHERE event_name = 'JobCreated')::float / COUNT(*) FILTER (WHERE event_name = 'SignupCompleted')
             ELSE 0
           END as activation_rate
         FROM events
         WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
         GROUP BY channel`, [userId, start, end]);
        res.json({
            data: {
                signupFunnel: signupFunnel[0] || {
                    signup_started: 0,
                    signup_completed: 0,
                    email_verified: 0,
                    api_key_created: 0,
                    job_created: 0,
                    reconciliation_success: 0,
                },
                timeToFirstValue: timeToFirstValue[0] || {
                    median_hours: 0,
                    p25_hours: 0,
                    p75_hours: 0,
                    p95_hours: 0,
                },
                activationByChannel: activationByChannel.map(c => ({
                    channel: c.channel,
                    signups: parseInt(c.signups),
                    activated: parseInt(c.activated),
                    activationRate: c.activation_rate,
                })),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get activation dashboard", 500, { userId: req.userId });
    }
});
// Usage Dashboard
router.get("/dashboards/usage", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(dashboardQuerySchema), async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        // Reconciliation volume
        const reconciliationVolume = await (0, db_1.query)(`SELECT 
           DATE(timestamp) as date,
           COUNT(*) as count,
           properties->>'sourceAdapter' || '-' || properties->>'targetAdapter' as adapter_combination
         FROM events
         WHERE user_id = $1 
           AND event_name = 'ReconciliationSuccess'
           AND timestamp >= $2 AND timestamp <= $3
         GROUP BY date, adapter_combination
         ORDER BY date`, [userId, start, end]);
        // Accuracy trends
        const accuracyTrends = await (0, db_1.query)(`SELECT 
           DATE(timestamp) as date,
           AVG((properties->>'accuracy')::float) as avg_accuracy,
           properties->>'sourceAdapter' || '-' || properties->>'targetAdapter' as job_type
         FROM events
         WHERE user_id = $1 
           AND event_name = 'ReconciliationSuccess'
           AND timestamp >= $2 AND timestamp <= $3
         GROUP BY date, job_type
         ORDER BY date`, [userId, start, end]);
        // Error rate
        const errorRate = await (0, db_1.query)(`SELECT 
           properties->>'errorType' as error_type,
           COUNT(*) as count,
           COUNT(*)::float / (SELECT COUNT(*) FROM events WHERE user_id = $1 AND event_name IN ('ReconciliationSuccess', 'ReconciliationError') AND timestamp >= $2 AND timestamp <= $3) * 100 as percentage
         FROM events
         WHERE user_id = $1 
           AND event_name = 'ReconciliationError'
           AND timestamp >= $2 AND timestamp <= $3
         GROUP BY error_type`, [userId, start, end]);
        // Exception rate
        const exceptionRate = await (0, db_1.query)(`SELECT 
           reason,
           COUNT(*) as count,
           COUNT(*)::float / (SELECT COUNT(*) FROM exceptions e JOIN jobs j ON e.job_id = j.id WHERE j.user_id = $1 AND e.created_at >= $2 AND e.created_at <= $3) * 100 as percentage
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE j.user_id = $1 AND e.created_at >= $2 AND e.created_at <= $3
         GROUP BY reason`, [userId, start, end]);
        res.json({
            data: {
                reconciliationVolume: reconciliationVolume.map(v => ({
                    date: v.date.toISOString().split('T')[0],
                    count: parseInt(v.count),
                    adapterCombination: v.adapter_combination,
                })),
                accuracyTrends: accuracyTrends.map(t => ({
                    date: t.date.toISOString().split('T')[0],
                    avgAccuracy: t.avg_accuracy,
                    jobType: t.job_type,
                })),
                errorRate: errorRate.map(e => ({
                    errorType: e.error_type,
                    count: parseInt(e.count),
                    percentage: e.percentage,
                })),
                exceptionRate: exceptionRate.map(e => ({
                    reason: e.reason,
                    count: parseInt(e.count),
                    percentage: e.percentage,
                })),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get usage dashboard", 500, { userId: req.userId });
    }
});
// Revenue Dashboard (placeholder - requires billing integration)
router.get("/dashboards/revenue", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(dashboardQuerySchema), async (req, res) => {
    try {
        // Reserved for future billing/plan tracking: req.userId, startDate, endDate
        const _ = {
            userId: req.userId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        };
        void _;
        // Placeholder - requires billing/plan tracking
        res.json({
            data: {
                mrr: 0,
                arpu: 0,
                customerCount: 0,
                churnRate: 0,
                expansionRevenue: 0,
                message: "Revenue dashboard requires billing integration",
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get revenue dashboard", 500, { userId: req.userId });
    }
});
// Support Dashboard
router.get("/dashboards/support", (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(dashboardQuerySchema), async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        // Support ticket volume (if tracking)
        const ticketVolume = await (0, db_1.query)(`SELECT 
           DATE(timestamp) as date,
           properties->>'category' as category,
           COUNT(*) as count
         FROM events
         WHERE user_id = $1 
           AND event_name = 'SupportTicketCreated'
           AND timestamp >= $2 AND timestamp <= $3
         GROUP BY date, category
         ORDER BY date`, [userId, start, end]);
        // Exception resolution time
        const resolutionTime = await (0, db_1.query)(`SELECT 
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as median_hours,
           PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as p95_hours
         FROM exceptions e
         JOIN jobs j ON e.job_id = j.id
         WHERE j.user_id = $1 
           AND e.status = 'resolved'
           AND e.resolved_at >= $2 AND e.resolved_at <= $3`, [userId, start, end]);
        res.json({
            data: {
                ticketVolume: ticketVolume.map(t => ({
                    date: t.date.toISOString().split('T')[0],
                    category: t.category,
                    count: parseInt(t.count),
                })),
                resolutionTime: resolutionTime[0] || {
                    median_hours: 0,
                    p95_hours: 0,
                },
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get support dashboard", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=dashboards.js.map