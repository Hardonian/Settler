/**
 * Autonomous Settlement Daemon Routes (API v2)
 *
 * REST API for executing continuous autonomous settlement cycles,
 * triggering automated discrepancy recovery, and fetching engine telemetry.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { autoSettlementDaemon } from "../../services/engine/auto-settlement-daemon";
import { handleRouteError } from "../../utils/error-handler";

export const daemonRouter: Router = Router();

/**
 * POST /api/v2/daemon/tick
 * Execute an autonomous settlement cycle for the tenant
 */
daemonRouter.post(
  "/tick",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.tenantId ?? (authReq.user as any)?.tenantId ?? req.body?.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: "Tenant context is required",
        });
        return;
      }

      // Cross-tenant guard
      if (authReq.tenantId && req.body?.tenantId && req.body.tenantId !== authReq.tenantId) {
        res.status(403).json({
          success: false,
          error: "Tenant mismatch",
        });
        return;
      }

      const { orders = [], captures = [], sweeps = [], adjudicationHistory = [] } = req.body;

      const result = await autoSettlementDaemon.executeCycle({
        tenantId,
        orders,
        captures,
        sweeps,
        adjudicationHistory,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to execute daemon cycle");
    }
  }
);

/**
 * GET /api/v2/daemon/metrics
 * Retrieve operational status and telemetry for autonomous settlement
 */
daemonRouter.get(
  "/metrics",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tenantId =
        authReq.tenantId ?? (authReq.user as any)?.tenantId ?? (req.query?.tenantId as string);

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: "Tenant context is required",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          tenantId,
          status: "ONLINE",
          engine: "triangular_v2",
          pipeline: "autonomous_revenue_os_recovery",
          governance: "policy_token_enforced",
          capabilities: [
            "3_way_triangular_matching",
            "adjudication_pattern_mining",
            "autonomous_dispute_packaging",
            "epoch_merkle_provenance",
          ],
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to get daemon metrics");
    }
  }
);
