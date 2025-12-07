/**
 * Admin Billing Configuration Routes
 *
 * Allows administrators to configure billing tiers, add-ons, and pricing
 * without code changes.
 */

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { supabase } from "../../infrastructure/supabase/client";
import { logError, logInfo } from "../../utils/logger";
import {
  getAllAddOnConfigs,
  createAddOnFromConfig,
  validateAddOnConfig,
} from "../../config/addon-config";
import {
  getAllBillingTiers,
  updateBillingTier,
  getUsagePricingRule,
} from "../../config/dynamic-billing-rules";

const router = Router();

/**
 * Get all add-on configurations
 * GET /api/admin/billing/addons
 */
router.get(
  "/addons",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      const configs = getAllAddOnConfigs();
      return res.json({ addons: configs });
    } catch (error) {
      logError("Failed to get add-on configs", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get add-on configurations",
      });
    }
  }
);

/**
 * Create add-on from configuration
 * POST /api/admin/billing/addons
 */
router.post(
  "/addons",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const config = req.body;
      const validation = validateAddOnConfig(config);

      if (!validation.valid) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid add-on configuration",
          errors: validation.errors,
        });
      }

      const addOnId = await createAddOnFromConfig(config, supabase);

      if (!addOnId) {
        return res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to create add-on",
        });
      }

      logInfo("Add-on created from config", { addOnId, integrationId: config.integration_id });

      return res.json({
        id: addOnId,
        integration_id: config.integration_id,
        message: "Add-on created successfully",
      });
    } catch (error) {
      logError("Failed to create add-on", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create add-on",
      });
    }
  }
);

/**
 * Get billing tier configurations
 * GET /api/admin/billing/tiers
 */
router.get(
  "/tiers",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      const tiers = getAllBillingTiers();
      return res.json({ tiers });
    } catch (error) {
      logError("Failed to get billing tiers", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get billing tiers",
      });
    }
  }
);

/**
 * Update billing tier
 * PUT /api/admin/billing/tiers/:tierId
 */
router.put(
  "/tiers/:tierId",
  authMiddleware,
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tierId } = req.params;
      const updates = req.body;

      const success = await updateBillingTier(tierId, updates, supabase);

      if (!success) {
        return res.status(404).json({
          error: "Not Found",
          message: "Billing tier not found",
        });
      }

      logInfo("Billing tier updated", { tierId, updates });

      return res.json({
        tier_id: tierId,
        message: "Billing tier updated successfully",
      });
    } catch (error) {
      logError("Failed to update billing tier", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update billing tier",
      });
    }
  }
);

/**
 * Get usage pricing rules
 * GET /api/admin/billing/pricing-rules
 */
router.get(
  "/pricing-rules",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      // In production, load from database
      // For now, return in-memory rules
      const eventType = req.query.event_type as string | undefined;
      
      if (eventType) {
        const rule = getUsagePricingRule(eventType);
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

    } catch (error) {
      logError("Failed to get pricing rules", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get pricing rules",
      });
    }
  }
);

export { router as adminBillingConfigRouter };
