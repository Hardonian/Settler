/**
 * Network Effects API Routes
 *
 * REST API for network effects features (cross-customer intelligence, performance pools)
 */

import { Router, Response } from "express";
import { crossCustomerIntelligence } from "../../services/network-effects/cross-customer-intelligence";
import { performanceTuningPools } from "../../services/network-effects/performance-pools";
import { handleRouteError } from "../../utils/error-handler";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { authorizeTenantActionOr403, requireTenantContext } from "../authz-helpers";
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";

const router: Router = Router();
const NETWORK_EFFECTS_SURFACE = {
  key: "network_effects_v2",
  unavailableReason:
    "Network effects v2 is disabled until opt-in state, shared intelligence, and performance pools are tenant-scoped and durably persisted.",
  previewReason:
    "Network effects v2 is running in local-only preview mode without tenant-scoped durable storage.",
};
const PATTERN_TYPES = new Set(["fraud", "anomaly", "performance", "error"]);

/**
 * POST /api/v2/network-effects/intelligence/opt-in
 * Opt-in to cross-customer intelligence
 */
router.post(
  "/intelligence/opt-in",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects control is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/intelligence/opt-in",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;

      crossCustomerIntelligence.optIn(tenantId);

      res.json({
        data: {
          customerId: tenantId,
          optedIn: true,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Successfully opted in to cross-customer intelligence",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to opt in", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/network-effects/intelligence/opt-out
 * Opt-out of cross-customer intelligence
 */
router.post(
  "/intelligence/opt-out",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects control is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/intelligence/opt-out",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;

      crossCustomerIntelligence.optOut(tenantId);

      res.json({
        data: {
          customerId: tenantId,
          optedIn: false,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Successfully opted out of cross-customer intelligence",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to opt out", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/network-effects/intelligence/check-pattern
 * Check if a pattern matches known patterns
 */
router.post(
  "/intelligence/check-pattern",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects read is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/intelligence/check-pattern",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;
      const { type, data } = req.body;

      if (!type || !PATTERN_TYPES.has(type) || !data || typeof data !== "object") {
        return res.status(400).json({
          error: "Missing required fields",
          message: "type must be a supported pattern type and data must be an object",
        });
      }

      const match = crossCustomerIntelligence.checkPattern({ type, data });

      res.json({
        data: match,
        matched: match !== null,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to check pattern", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/network-effects/intelligence/insights
 * Get network insights (anonymized)
 */
router.get(
  "/intelligence/insights",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects read is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/intelligence/insights",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;
      const insights = crossCustomerIntelligence.getNetworkInsights();

      res.json({
        data: insights,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get insights", 500);
      return;
    }
  }
);

/**
 * POST /api/v2/network-effects/performance/opt-in
 * Opt-in to performance tuning pools
 */
router.post(
  "/performance/opt-in",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects control is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/performance/opt-in",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;

      performanceTuningPools.optIn(tenantId);

      res.json({
        data: {
          customerId: tenantId,
          optedIn: true,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Successfully opted in to performance tuning pools",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to opt in", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/network-effects/performance/submit
 * Submit performance metrics
 */
router.post(
  "/performance/submit",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects control is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/performance/submit",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;
      const { jobId, adapter, ruleType, accuracy, latency, throughput } = req.body;

      if (!jobId || !adapter || !ruleType) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "jobId, adapter, and ruleType are required",
        });
      }

      const submission = performanceTuningPools.submitMetrics(tenantId, {
        jobId,
        adapter,
        ruleType,
        accuracy: accuracy || 0,
        latency: latency || 0,
        throughput: throughput || 0,
      });

      if (!submission.accepted) {
        return res.status(409).json({
          error: "PERFORMANCE_POOL_OPT_IN_REQUIRED",
          message: submission.reason,
          capability,
          metadata: buildStrategicSurfaceMetadata(req, capability),
        });
      }

      res.json({
        data: {
          submitted: true,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Performance metrics submitted successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to submit metrics", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/network-effects/performance/insights
 * Get performance insights
 */
router.get(
  "/performance/insights",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects read is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/performance/insights",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;
      const { adapter, ruleType } = req.query;

      if (!adapter) {
        return res.status(400).json({
          error: "Missing adapter parameter",
        });
      }

      const insights = performanceTuningPools.getInsights(
        adapter as string,
        ruleType as string | undefined
      );

      res.json({
        data: insights,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get insights", 500);
      return;
    }
  }
);

/**
 * GET /api/v2/network-effects/performance/recommendations
 * Get recommended rules
 */
router.get(
  "/performance/recommendations",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects read is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/performance/recommendations",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;
      const { adapter, useCase } = req.query;

      if (!adapter) {
        return res.status(400).json({
          error: "Missing adapter parameter",
        });
      }

      const recommendations = performanceTuningPools.getRecommendedRules(
        adapter as string,
        (useCase as string) || "default"
      );

      res.json({
        data: recommendations,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get recommendations", 500);
      return;
    }
  }
);

/**
 * GET /api/v2/network-effects/stats
 * Get network effects statistics
 */
router.get(
  "/stats",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "Network effects read is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/network-effects/stats",
        NETWORK_EFFECTS_SURFACE
      );
      if (!capability) return;
      const intelligenceInsights = crossCustomerIntelligence.getNetworkInsights();
      const performanceStats = performanceTuningPools.getStats();

      res.json({
        data: {
          intelligence: intelligenceInsights,
          performance: performanceStats,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get stats", 500);
      return;
    }
  }
);

export default router;
