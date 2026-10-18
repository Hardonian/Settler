/**
 * Revenue OS Autonomous Recovery API Routes (v2)
 *
 * REST API for generating, inspecting, and exporting payment processor
 * dispute packages and fee recovery claims with strict tenant isolation.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  revenueOsRecoveryService,
  DiscrepancyInputItem,
} from "../../services/recovery/revenue-os-recovery-service";

export const recoveryRouter: Router = Router();

/**
 * POST /api/v2/recovery/claims/generate
 * Generates ready-to-file dispute packages from reconciled discrepancy items
 */
recoveryRouter.post(
  "/claims/generate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const body = req.body as { tenantId?: string; items?: DiscrepancyInputItem[] };
      const tenantId = authReq.tenantId ?? (authReq.user as any)?.tenantId ?? body.tenantId;

      if (!tenantId) {
        res.status(400).json({ error: "Tenant context is required" });
        return;
      }

      const items = Array.isArray(body.items) ? body.items : [];
      const claims = revenueOsRecoveryService.generateClaimsFromDiscrepancies(tenantId, items);

      res.status(200).json({
        success: true,
        tenantId,
        generatedClaimsCount: claims.length,
        claims,
      });
    } catch (err: any) {
      next(err);
    }
  }
);

/**
 * GET /api/v2/recovery/claims
 * Lists all active recovery claims for the tenant
 */
recoveryRouter.get(
  "/claims",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tenantId =
        authReq.tenantId ?? (authReq.user as any)?.tenantId ?? (req.query.tenantId as string);

      if (!tenantId) {
        res.status(400).json({ error: "Tenant context is required" });
        return;
      }

      const claims = revenueOsRecoveryService.listClaims(tenantId);

      res.status(200).json({
        success: true,
        tenantId,
        claimsCount: claims.length,
        claims,
      });
    } catch (err: any) {
      next(err);
    }
  }
);

/**
 * POST /api/v2/recovery/claims/:claimId/export
 * Exports self-contained dispute evidence package with CSV line items
 */
recoveryRouter.post(
  "/claims/:claimId/export",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const claimId = String(req.params.claimId ?? "");
      const tenantId =
        authReq.tenantId ?? (authReq.user as any)?.tenantId ?? (req.query.tenantId as string);

      if (!tenantId) {
        res.status(400).json({ error: "Tenant context is required" });
        return;
      }

      const bundle = revenueOsRecoveryService.exportFilingBundle(tenantId, claimId);

      if (!bundle) {
        res.status(404).json({ error: `Recovery claim '${claimId}' not found for tenant` });
        return;
      }

      res.status(200).json({
        success: true,
        bundle,
      });
    } catch (err: any) {
      next(err);
    }
  }
);
