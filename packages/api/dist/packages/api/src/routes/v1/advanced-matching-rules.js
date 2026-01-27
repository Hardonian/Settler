"use strict";
/**
 * Advanced Matching Rules API Routes
 * Handles custom matching rules endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const advanced_matching_rules_1 = require("../../services/advanced-matching-rules");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/advanced-matching-rules
 * Create a custom matching rule
 */
router.post("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const rule = req.body;
        if (!rule.name || !rule.ruleType || !rule.ruleConfig) {
            return res.status(400).json({
                error: "Bad Request",
                message: "name, ruleType, and ruleConfig are required",
                traceId: req.traceId,
            });
        }
        const ruleId = await (0, advanced_matching_rules_1.createCustomMatchingRule)(tenantId, userId, rule);
        (0, logger_1.logInfo)("Custom matching rule created", { ruleId, tenantId, userId, traceId: req.traceId });
        return res.status(201).json({
            id: ruleId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create custom matching rule", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create custom matching rule",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/advanced-matching-rules
 * List custom matching rules
 */
router.get("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { isTemplate, isActive, limit = 100, offset = 0 } = req.query;
        const rules = await (0, advanced_matching_rules_1.listCustomMatchingRules)(tenantId, {
            isTemplate: isTemplate === "true" ? true : isTemplate === "false" ? false : undefined,
            isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        return res.json({
            data: rules,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: rules.length,
            },
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list custom matching rules", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to list custom matching rules",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/advanced-matching-rules/:ruleId
 * Get custom matching rule
 */
router.get("/:ruleId", async (req, res) => {
    try {
        const { ruleId } = req.params;
        const tenantId = req.tenantId;
        if (!ruleId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "ruleId is required",
                traceId: req.traceId,
            });
        }
        const rule = await (0, advanced_matching_rules_1.getCustomMatchingRule)(tenantId, ruleId);
        if (!rule) {
            return res.status(404).json({
                error: "Not Found",
                message: "Custom matching rule not found",
                traceId: req.traceId,
            });
        }
        return res.json({
            ...rule,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get custom matching rule", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get custom matching rule",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/advanced-matching-rules/:ruleId/test
 * Test a matching rule
 */
router.post("/:ruleId/test", async (req, res) => {
    try {
        const { ruleId } = req.params;
        const tenantId = req.tenantId;
        const { sourceData, targetData } = req.body;
        if (!ruleId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "ruleId is required",
                traceId: req.traceId,
            });
        }
        if (!sourceData || !targetData) {
            return res.status(400).json({
                error: "Bad Request",
                message: "sourceData and targetData are required",
                traceId: req.traceId,
            });
        }
        const rule = await (0, advanced_matching_rules_1.getCustomMatchingRule)(tenantId, ruleId);
        if (!rule) {
            return res.status(404).json({
                error: "Not Found",
                message: "Custom matching rule not found",
                traceId: req.traceId,
            });
        }
        const testResult = await (0, advanced_matching_rules_1.testMatchingRule)(rule, sourceData, targetData);
        return res.json({
            ...testResult,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to test matching rule", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to test matching rule",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=advanced-matching-rules.js.map