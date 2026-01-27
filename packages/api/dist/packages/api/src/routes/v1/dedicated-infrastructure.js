"use strict";
/**
 * Dedicated Infrastructure API Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const dedicated_infrastructure_1 = require("../../services/dedicated-infrastructure");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { infrastructureType, resourceConfig, isolationLevel, dataRetentionDays, securityConfig } = req.body;
        if (!infrastructureType || !resourceConfig) {
            return res.status(400).json({
                error: "Bad Request",
                message: "infrastructureType and resourceConfig are required",
                traceId: req.traceId,
            });
        }
        const infrastructureId = await (0, dedicated_infrastructure_1.provisionDedicatedInfrastructure)(tenantId, infrastructureType, resourceConfig, {
            isolationLevel,
            dataRetentionDays,
            securityConfig,
        });
        return res.status(201).json({ id: infrastructureId, traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to provision dedicated infrastructure", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to provision dedicated infrastructure",
            traceId: req.traceId,
        });
    }
});
router.get("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { isActive, infrastructureType } = req.query;
        const infrastructure = await (0, dedicated_infrastructure_1.listDedicatedInfrastructure)(tenantId, {
            isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            infrastructureType: infrastructureType,
        });
        return res.json({ data: infrastructure, traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list dedicated infrastructure", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to list dedicated infrastructure",
            traceId: req.traceId,
        });
    }
});
router.get("/:infrastructureId", async (req, res) => {
    try {
        const { infrastructureId } = req.params;
        const tenantId = req.tenantId;
        if (!infrastructureId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "infrastructureId is required",
                traceId: req.traceId,
            });
        }
        const infrastructure = await (0, dedicated_infrastructure_1.getDedicatedInfrastructure)(tenantId, infrastructureId);
        if (!infrastructure) {
            return res.status(404).json({
                error: "Not Found",
                message: "Dedicated infrastructure not found",
                traceId: req.traceId,
            });
        }
        return res.json({ ...infrastructure, traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get dedicated infrastructure", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get dedicated infrastructure",
            traceId: req.traceId,
        });
    }
});
router.delete("/:infrastructureId", async (req, res) => {
    try {
        const { infrastructureId } = req.params;
        const tenantId = req.tenantId;
        if (!infrastructureId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "infrastructureId is required",
                traceId: req.traceId,
            });
        }
        await (0, dedicated_infrastructure_1.deprovisionDedicatedInfrastructure)(tenantId, infrastructureId);
        return res.json({ message: "Infrastructure deprovisioned", traceId: req.traceId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to deprovision dedicated infrastructure", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to deprovision dedicated infrastructure",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=dedicated-infrastructure.js.map