"use strict";
/**
 * Alert Routes
 * E4-S3: Alert rules, channels, and runbook
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const router = (0, express_1.Router)();
exports.alertsRouter = router;
const createAlertRuleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        metric: zod_1.z.string(), // e.g., "reconciliation.accuracy", "reconciliation.error_rate"
        threshold: zod_1.z.number(),
        operator: zod_1.z.enum(["gt", "gte", "lt", "lte", "eq", "neq"]),
        channels: zod_1.z.array(zod_1.z.enum(["email", "slack", "pagerduty"])),
        enabled: zod_1.z.boolean().default(true),
    }),
});
// List alert rules
router.get("/alerts/rules", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const rules = await (0, db_1.query)(`SELECT id, name, metric, threshold, operator, channels, enabled, created_at
         FROM alert_rules
         WHERE user_id = $1
         ORDER BY created_at DESC`, [userId]);
        res.json({
            data: rules.map(r => ({
                id: r.id,
                name: r.name,
                metric: r.metric,
                threshold: r.threshold,
                operator: r.operator,
                channels: r.channels,
                enabled: r.enabled,
                createdAt: r.created_at.toISOString(),
            })),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to list alert rules", 500, { userId: req.userId });
    }
});
// Create alert rule
router.post("/alerts/rules", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), (0, validation_1.validateRequest)(createAlertRuleSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const { name, metric, threshold, operator, channels, enabled } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO alert_rules (user_id, name, metric, threshold, operator, channels, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`, [userId, name, metric, threshold, operator, channels, enabled]);
        if (!result[0]) {
            throw new Error('Failed to create alert rule');
        }
        res.status(201).json({
            data: {
                id: result[0].id,
            },
            message: "Alert rule created successfully",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to create alert rule", 500, { userId: req.userId });
    }
});
// Get alert history
router.get("/alerts/history", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;
        const alerts = await (0, db_1.query)(`SELECT a.id, a.rule_id, a.metric, a.value, a.threshold, a.triggered_at, a.resolved_at
         FROM alert_history a
         JOIN alert_rules r ON a.rule_id = r.id
         WHERE r.user_id = $1
         ORDER BY a.triggered_at DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        res.json({
            data: alerts.map(a => ({
                id: a.id,
                ruleId: a.rule_id,
                metric: a.metric,
                value: a.value,
                threshold: a.threshold,
                triggeredAt: a.triggered_at.toISOString(),
                resolvedAt: a.resolved_at?.toISOString() || null,
            })),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get alert history", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=alerts.js.map