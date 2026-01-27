"use strict";
/**
 * Admin Billing Configuration Routes
 *
 * Allows administrators to configure billing tiers, add-ons, and pricing
 * without code changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBillingConfigRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authorization_1 = require("../../middleware/authorization");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const client_1 = require("../../infrastructure/supabase/client");
const logger_1 = require("../../utils/logger");
const addon_config_1 = require("../../config/addon-config");
const dynamic_billing_rules_1 = require("../../config/dynamic-billing-rules");
const router = (0, express_1.Router)();
exports.adminBillingConfigRouter = router;
/**
 * Get all add-on configurations
 * GET /api/admin/billing/addons
 */
router.get("/addons", auth_1.authMiddleware, (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (_req, res) => {
    try {
        const configs = (0, addon_config_1.getAllAddOnConfigs)();
        return res.json({ addons: configs });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get add-on configs", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get add-on configurations",
        });
    }
});
/**
 * Create add-on from configuration
 * POST /api/admin/billing/addons
 */
router.post("/addons", auth_1.authMiddleware, (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        const config = req.body;
        const validation = (0, addon_config_1.validateAddOnConfig)(config);
        if (!validation.valid) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid add-on configuration",
                errors: validation.errors,
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addOnId = await (0, addon_config_1.createAddOnFromConfig)(config, client_1.supabase);
        if (!addOnId) {
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to create add-on",
            });
        }
        (0, logger_1.logInfo)("Add-on created from config", { addOnId, integrationId: config.integration_id });
        return res.json({
            id: addOnId,
            integration_id: config.integration_id,
            message: "Add-on created successfully",
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create add-on", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create add-on",
        });
    }
});
/**
 * Get billing tier configurations
 * GET /api/admin/billing/tiers
 */
router.get("/tiers", auth_1.authMiddleware, (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (_req, res) => {
    try {
        const tiers = (0, dynamic_billing_rules_1.getAllBillingTiers)();
        return res.json({ tiers });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get billing tiers", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get billing tiers",
        });
    }
});
/**
 * Update billing tier
 * PUT /api/admin/billing/tiers/:tierId
 */
router.put("/tiers/:tierId", auth_1.authMiddleware, (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_WRITE), async (req, res) => {
    try {
        const { tierId } = req.params;
        const updates = req.body;
        if (!tierId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "tierId is required",
            });
        }
        const success = await (0, dynamic_billing_rules_1.updateBillingTier)(tierId, updates, client_1.supabase);
        if (!success) {
            return res.status(404).json({
                error: "Not Found",
                message: "Billing tier not found",
            });
        }
        (0, logger_1.logInfo)("Billing tier updated", { tierId, updates });
        return res.json({
            tier_id: tierId,
            message: "Billing tier updated successfully",
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update billing tier", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update billing tier",
        });
    }
});
/**
 * Get usage pricing rules
 * GET /api/admin/billing/pricing-rules
 */
router.get("/pricing-rules", auth_1.authMiddleware, (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    try {
        // In production, load from database
        // For now, return in-memory rules
        const eventType = req.query.event_type;
        if (eventType) {
            const rule = (0, dynamic_billing_rules_1.getUsagePricingRule)(eventType);
            if (!rule) {
                return res.status(404).json({
                    error: "Not Found",
                    message: "Pricing rule not found",
                });
            }
            return res.json({ rule });
        }
        // Return all rules (would load from database in production)
        return res.json({
            rules: [
                {
                    event_type: "reconciliation_job",
                    base_limit: 10000,
                    overage_price_per_unit: 0.05,
                    unit: "job",
                },
                // ... other rules
            ],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get pricing rules", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get pricing rules",
        });
    }
});
//# sourceMappingURL=billing-config.js.map