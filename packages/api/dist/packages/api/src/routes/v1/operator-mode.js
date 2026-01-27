"use strict";
/**
 * Operator Mode API Routes
 * Endpoints for daily intelligence, alerts, cost controls, kill switches, and backups
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorModeRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../../middleware/validation");
const authorization_1 = require("../../middleware/authorization");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const error_handler_1 = require("../../utils/error-handler");
const daily_intelligence_1 = require("../../services/operator-mode/daily-intelligence");
const alerting_1 = require("../../services/operator-mode/alerting");
const cost_controls_1 = require("../../services/operator-mode/cost-controls");
const kill_switches_1 = require("../../services/operator-mode/kill-switches");
const backups_1 = require("../../services/operator-mode/backups");
const router = (0, express_1.Router)();
exports.operatorModeRouter = router;
// ============================================================================
// DAILY INTELLIGENCE
// ============================================================================
router.get('/operator/daily-intelligence', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const dateParam = req.query.date;
        const date = dateParam ? new Date(dateParam) : new Date();
        const intelligence = await (0, daily_intelligence_1.generateDailyIntelligence)(date);
        res.json({ data: intelligence });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get daily intelligence', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/error-rate', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const dateParam = req.query.date;
        const date = dateParam ? new Date(dateParam) : new Date();
        const errorRate = await (0, daily_intelligence_1.getErrorRateSummary)(date);
        res.json({ data: errorRate });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get error rate', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/slow-endpoints', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const dateParam = req.query.date;
        const date = dateParam ? new Date(dateParam) : new Date();
        const slowEndpoints = await (0, daily_intelligence_1.getSlowEndpoints)(date);
        res.json({ data: slowEndpoints });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get slow endpoints', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/failed-ingestions', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const dateParam = req.query.date;
        const date = dateParam ? new Date(dateParam) : new Date();
        const failedIngestions = await (0, daily_intelligence_1.getFailedIngestions)(date);
        res.json({ data: failedIngestions });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get failed ingestions', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/billing-anomalies', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const dateParam = req.query.date;
        const date = dateParam ? new Date(dateParam) : new Date();
        const anomalies = await (0, daily_intelligence_1.getBillingAnomalies)(date);
        res.json({ data: anomalies });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get billing anomalies', 500, {
            userId: req.userId,
        });
    }
});
// ============================================================================
// ALERTING
// ============================================================================
router.post('/operator/alerts/check', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const alerts = await (0, alerting_1.checkAlertThresholds)();
        res.json({
            data: alerts,
            message: `Checked thresholds, triggered ${alerts.length} alerts`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to check alert thresholds', 500, {
            userId: req.userId,
        });
    }
});
const createAlertThresholdSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        metric: zod_1.z.enum(['error_rate', 'slow_endpoint', 'failed_ingestion', 'billing_anomaly', 'usage_limit']),
        threshold: zod_1.z.number(),
        operator: zod_1.z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq']),
        severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        channels: zod_1.z.array(zod_1.z.enum(['email', 'slack', 'webhook'])).default([]),
        enabled: zod_1.z.boolean().default(true),
    }),
});
router.post('/operator/alerts/thresholds', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), (0, validation_1.validateRequest)(createAlertThresholdSchema), async (req, res) => {
    try {
        const userId = req.userId;
        const threshold = req.body;
        const thresholdId = await (0, alerting_1.upsertAlertThreshold)(userId, threshold);
        res.status(201).json({
            data: { id: thresholdId },
            message: 'Alert threshold created',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to create alert threshold', 500, {
            userId: req.userId,
        });
    }
});
// ============================================================================
// COST CONTROLS
// ============================================================================
const setUsageCeilingSchema = zod_1.z.object({
    body: zod_1.z.object({
        tenantId: zod_1.z.string().uuid(),
        billingAccountId: zod_1.z.string().uuid(),
        usageType: zod_1.z.enum(['ingestions', 'reconciliations', 'api_requests', 'storage']),
        monthlyLimit: zod_1.z.number().positive(),
    }),
});
router.post('/operator/cost-controls/usage-ceilings', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), (0, validation_1.validateRequest)(setUsageCeilingSchema), async (req, res) => {
    try {
        const { tenantId, billingAccountId, usageType, monthlyLimit } = req.body;
        await (0, cost_controls_1.setTenantUsageCeiling)(tenantId, billingAccountId, usageType, monthlyLimit);
        res.status(201).json({
            message: 'Usage ceiling set',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to set usage ceiling', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/cost-controls/usage-ceilings', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const ceilings = await (0, cost_controls_1.getAllUsageCeilings)();
        res.json({ data: ceilings });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get usage ceilings', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/cost-controls/usage-ceilings/:tenantId/:usageType', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const { tenantId, usageType } = req.params;
        if (!tenantId || !usageType) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'tenantId and usageType are required',
            });
            return;
        }
        const check = await (0, cost_controls_1.checkUsageCeiling)(tenantId, usageType);
        res.json({ data: check });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to check usage ceiling', 500, {
            userId: req.userId,
        });
    }
});
const setJobLimitSchema = zod_1.z.object({
    body: zod_1.z.object({
        jobType: zod_1.z.enum(['ingestion', 'reconciliation', 'webhook', 'export']),
        maxConcurrent: zod_1.z.number().positive(),
        maxPerTenant: zod_1.z.number().positive(),
    }),
});
router.post('/operator/cost-controls/job-limits', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), (0, validation_1.validateRequest)(setJobLimitSchema), async (req, res) => {
    try {
        const { jobType, maxConcurrent, maxPerTenant } = req.body;
        await (0, cost_controls_1.setBackgroundJobLimit)(jobType, maxConcurrent, maxPerTenant);
        res.status(201).json({
            message: 'Background job limit set',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to set job limit', 500, {
            userId: req.userId,
        });
    }
});
// ============================================================================
// KILL SWITCHES
// ============================================================================
router.get('/operator/kill-switches', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const switches = await (0, kill_switches_1.getAllKillSwitches)();
        res.json({ data: switches });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get kill switches', 500, {
            userId: req.userId,
        });
    }
});
const setKillSwitchSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        type: zod_1.z.enum(['connector', 'background_job', 'feature', 'endpoint']),
        target: zod_1.z.string().min(1),
        enabled: zod_1.z.boolean(),
        reason: zod_1.z.string().optional(),
    }),
});
router.post('/operator/kill-switches', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), (0, validation_1.validateRequest)(setKillSwitchSchema), async (req, res) => {
    try {
        const { name, type, target, enabled, reason } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found',
            });
            return;
        }
        const switchId = await (0, kill_switches_1.setKillSwitch)(name, type, target, enabled, reason, userId);
        res.status(201).json({
            data: { id: switchId },
            message: `Kill switch ${enabled ? 'enabled' : 'disabled'}`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to set kill switch', 500, {
            userId: req.userId,
        });
    }
});
router.post('/operator/kill-switches/connectors/:connectorType/disable', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const { connectorType } = req.params;
        if (!connectorType) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'connectorType is required',
            });
            return;
        }
        const reason = req.body.reason || 'Manually disabled';
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found',
            });
            return;
        }
        await (0, kill_switches_1.disableConnector)(connectorType, reason, userId);
        res.json({
            message: `Connector ${connectorType} disabled`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to disable connector', 500, {
            userId: req.userId,
        });
    }
});
router.post('/operator/kill-switches/connectors/:connectorType/enable', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const { connectorType } = req.params;
        if (!connectorType) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'connectorType is required',
            });
            return;
        }
        await (0, kill_switches_1.enableConnector)(connectorType);
        res.json({
            message: `Connector ${connectorType} enabled`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to enable connector', 500, {
            userId: req.userId,
        });
    }
});
router.post('/operator/kill-switches/jobs/:jobType/pause', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const { jobType } = req.params;
        if (!jobType) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'jobType is required',
            });
            return;
        }
        const reason = req.body.reason || 'Manually paused';
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found',
            });
            return;
        }
        await (0, kill_switches_1.pauseBackgroundJob)(jobType, reason, userId);
        res.json({
            message: `Background job ${jobType} paused`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to pause background job', 500, {
            userId: req.userId,
        });
    }
});
router.post('/operator/kill-switches/jobs/:jobType/resume', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const { jobType } = req.params;
        if (!jobType) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'jobType is required',
            });
            return;
        }
        await (0, kill_switches_1.resumeBackgroundJob)(jobType);
        res.json({
            message: `Background job ${jobType} resumed`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to resume background job', 500, {
            userId: req.userId,
        });
    }
});
// ============================================================================
// BACKUPS
// ============================================================================
router.post('/operator/backups/create', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const backup = await (0, backups_1.createBackup)();
        res.status(201).json({
            data: backup,
            message: 'Backup created',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to create backup', 500, {
            userId: req.userId,
        });
    }
});
router.post('/operator/backups/:backupId/verify', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const { backupId } = req.params;
        if (!backupId) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'backupId is required',
            });
            return;
        }
        const verified = await (0, backups_1.verifyBackup)(backupId);
        res.json({
            data: { verified },
            message: verified ? 'Backup verified' : 'Backup verification failed',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to verify backup', 500, {
            userId: req.userId,
        });
    }
});
router.get('/operator/backups', (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '10', 10);
        const backups = await (0, backups_1.listBackups)(limit);
        res.json({ data: backups });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to list backups', 500, {
            userId: req.userId,
        });
    }
});
//# sourceMappingURL=operator-mode.js.map