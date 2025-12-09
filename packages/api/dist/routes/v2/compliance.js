"use strict";
/**
 * Compliance API Routes
 *
 * REST API for compliance exports and edge agent management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const export_system_1 = require("../../services/compliance/export-system");
const edge_agent_1 = require("../../services/privacy-preserving/edge-agent");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
/**
 * POST /api/v2/compliance/exports
 * Create a compliance export
 */
router.post('/exports', async (req, res) => {
    try {
        const customerId = req.userId || req.body.customerId;
        const { jurisdiction, format } = req.body;
        if (!customerId || !jurisdiction) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'customerId and jurisdiction are required',
            });
        }
        const export_ = await export_system_1.complianceExportSystem.createExport(customerId, jurisdiction, format || 'json');
        res.status(201).json({
            data: export_,
            message: 'Export created successfully',
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to create export', 400);
        return;
    }
});
/**
 * GET /api/v2/compliance/exports
 * List exports for customer
 */
router.get('/exports', async (req, res) => {
    try {
        const customerId = req.user?.id || req.query.customerId;
        if (!customerId) {
            return res.status(400).json({
                error: 'Missing customer ID',
            });
        }
        const exports = export_system_1.complianceExportSystem.listExports(customerId);
        res.json({
            data: exports,
            count: exports.length,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to list exports', 500);
        return;
    }
});
/**
 * GET /api/v2/compliance/exports/:id
 * Get export by ID
 */
router.get('/exports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Export ID is required' });
        }
        const export_ = export_system_1.complianceExportSystem.getExport(id);
        if (!export_) {
            return res.status(404).json({
                error: 'Export not found',
                message: `Export ${id} not found`,
            });
        }
        res.json({
            data: export_,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get export', 500);
        return;
    }
});
/**
 * GET /api/v2/compliance/templates
 * Get available export templates
 */
router.get('/templates', async (_req, res) => {
    try {
        const templates = export_system_1.complianceExportSystem.getTemplates();
        res.json({
            data: templates,
            count: templates.length,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get templates', 500);
        return;
    }
});
/**
 * POST /api/v2/compliance/edge/initialize
 * Initialize edge agent
 */
router.post('/edge/initialize', async (req, res) => {
    try {
        const customerId = req.userId || req.body.customerId;
        const { apiKey, cloudEndpoint, reconciliationRules, encryptionKey } = req.body;
        if (!customerId || !apiKey || !cloudEndpoint || !reconciliationRules) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'customerId, apiKey, cloudEndpoint, and reconciliationRules are required',
            });
        }
        const edgeAgent = new edge_agent_1.EdgeAgent({
            customerId,
            apiKey,
            cloudEndpoint: cloudEndpoint || 'https://api.settler.io',
            reconciliationRules,
            encryptionKey,
        });
        await edgeAgent.initialize();
        res.json({
            data: {
                customerId,
                initialized: true,
            },
            message: 'Edge agent initialized successfully',
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to initialize edge agent', 400);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=compliance.js.map