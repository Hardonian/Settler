"use strict";
/**
 * Custom Integrations API Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const custom_integrations_1 = require("../../services/custom-integrations");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { integrationName, integrationType, adapterConfig, whiteLabelConfig } = req.body;
        if (!integrationName || !integrationType || !adapterConfig) {
            return res.status(400).json({
                error: "Bad Request",
                message: "integrationName, integrationType, and adapterConfig are required",
                traceId: req.traceId,
            });
        }
        const integrationId = await (0, custom_integrations_1.createCustomIntegration)(tenantId, integrationName, integrationType, adapterConfig, whiteLabelConfig);
        return res.status(201).json({ id: integrationId, traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create custom integration", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create custom integration",
            traceId: req.traceId,
        });
    }
});
router.get("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { isActive, integrationType } = req.query;
        const integrations = await (0, custom_integrations_1.listCustomIntegrations)(tenantId, {
            isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            integrationType: integrationType,
        });
        return res.json({ data: integrations, traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list custom integrations", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to list custom integrations",
            traceId: req.traceId,
        });
    }
});
router.get("/:integrationId", async (req, res) => {
    try {
        const { integrationId } = req.params;
        const tenantId = req.tenantId;
        if (!integrationId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "integrationId is required",
                traceId: req.traceId,
            });
        }
        const integration = await (0, custom_integrations_1.getCustomIntegration)(tenantId, integrationId);
        if (!integration) {
            return res.status(404).json({
                error: "Not Found",
                message: "Custom integration not found",
                traceId: req.traceId,
            });
        }
        return res.json({ ...integration, traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get custom integration", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get custom integration",
            traceId: req.traceId,
        });
    }
});
router.patch("/:integrationId", async (req, res) => {
    try {
        const { integrationId } = req.params;
        const tenantId = req.tenantId;
        const updates = req.body;
        if (!integrationId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "integrationId is required",
                traceId: req.traceId,
            });
        }
        await (0, custom_integrations_1.updateCustomIntegration)(tenantId, integrationId, updates);
        return res.json({ message: "Integration updated", traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update custom integration", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update custom integration",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=custom-integrations.js.map