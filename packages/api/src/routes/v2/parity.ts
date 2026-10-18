/**
 * TigerBeetle Dual-Ledger Parity Invariant Routes (API v2)
 *
 * REST API for executing real-time double-entry and cross-ledger parity verification,
 * obtaining cryptographically signed attestation proofs, and monitoring drift telemetry.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { tigerBeetleParityMonitor } from "../../services/ledger/tigerbeetle-parity-monitor";
import { handleRouteError } from "../../utils/error-handler";
import { isValidTenantUuid } from "../../utils/tenant-id";

export const parityRouter: Router = Router();

/**
 * POST /api/v2/ledger/parity/verify
 * Executes dual-ledger invariant evaluation and returns a signed cryptographic parity proof
 */
parityRouter.post(
  "/verify",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const headerTenant = req.headers["x-tenant-id"] as string | undefined;
      const callerTenant = authReq.tenantId ?? headerTenant;
      const tenantId = callerTenant ?? (authReq.user as any)?.tenantId ?? req.body?.tenantId;

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({
          success: false,
          error: "Tenant context is required",
        });
        return;
      }

      // Invariant: Cross-tenant save is rejected at entity level with 403
      if (callerTenant && req.body?.tenantId && req.body.tenantId !== callerTenant) {
        res.status(403).json({
          success: false,
          error: "Tenant mismatch",
        });
        return;
      }

      const relationalMatchedVolumeCents = req.body?.relationalMatchedVolumeCents
        ? BigInt(req.body.relationalMatchedVolumeCents)
        : undefined;

      const proof = await tigerBeetleParityMonitor.evaluateTenantInvariants(tenantId, {
        relationalMatchedVolumeCents,
      });

      res.status(200).json({
        success: true,
        data: proof,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to evaluate dual-ledger invariants");
    }
  }
);

/**
 * GET /api/v2/ledger/parity/status
 * Returns current parity telemetry and historical proofs for the tenant
 */
parityRouter.get(
  "/status",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const headerTenant = req.headers["x-tenant-id"] as string | undefined;
      const callerTenant = authReq.tenantId ?? headerTenant;
      const queryTenant = typeof req.query?.tenantId === "string" ? req.query.tenantId : undefined;
      const tenantId = callerTenant ?? (authReq.user as any)?.tenantId ?? queryTenant;

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({
          success: false,
          error: "Tenant context is required",
        });
        return;
      }

      if (callerTenant && queryTenant && queryTenant !== callerTenant) {
        res.status(403).json({
          success: false,
          error: "Tenant mismatch",
        });
        return;
      }

      const status = tigerBeetleParityMonitor.getParityStatus(tenantId);
      const proofs = tigerBeetleParityMonitor.getTenantProofs(tenantId);

      res.status(200).json({
        success: true,
        data: {
          ...status,
          historicalProofs: proofs.slice(0, 10),
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to fetch dual-ledger parity status");
    }
  }
);
