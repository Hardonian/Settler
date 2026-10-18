/**
 * Interchange++ Forensic Margin Recovery Routes (API v2)
 *
 * REST API for deconstructing multi-party processor fees, detecting card
 * scheme downgrades (Level 2/3 data omission, EIRF delays, Durbin regulated caps),
 * and generating automated dispute claims in Revenue OS.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { interchangeRecoveryService } from "../../services/recovery/interchange-recovery-service";
import { isValidTenantUuid } from "../../utils/tenant-id";
import { handleRouteError } from "../../utils/error-handler";

export const interchangeRouter: Router = Router();

function resolveTenantId(req: Request): string | null {
  return (req as AuthRequest).tenantId ?? null;
}

/**
 * POST /api/v2/recovery/interchange/analyze
 * Analyzes single transaction for interchange downgrade leakage and optionally generates a claim
 */
interchangeRouter.post(
  "/analyze",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      if (req.body?.tenantId && req.body.tenantId !== tenantId) {
        res.status(403).json({ error: "Tenant mismatch" });
        return;
      }

      const transaction = req.body?.transaction ?? req.body;
      if (!transaction || typeof transaction.amountCents !== "number") {
        res.status(400).json({ error: "Valid transaction payload with amountCents is required" });
        return;
      }

      const result = await interchangeRecoveryService.analyzeTransaction(tenantId, transaction);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleRouteError(res, error, "Failed to analyze interchange fee");
    }
  }
);

/**
 * POST /api/v2/recovery/interchange/batch
 * Evaluates a batch of transactions and optionally generates Revenue OS recovery claims
 */
interchangeRouter.post(
  "/batch",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      if (req.body?.tenantId && req.body.tenantId !== tenantId) {
        res.status(403).json({ error: "Tenant mismatch" });
        return;
      }

      const transactions = req.body?.transactions;
      if (!Array.isArray(transactions) || transactions.length === 0) {
        res.status(400).json({ error: "transactions array is required" });
        return;
      }

      const autoFileClaims = req.body?.autoFileClaims ?? true;
      const result = await interchangeRecoveryService.processPortfolioBatch(
        tenantId,
        transactions,
        {
          autoFileClaims,
        }
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleRouteError(res, error, "Failed to process interchange batch");
    }
  }
);

/**
 * GET /api/v2/recovery/interchange/report
 * Retrieves latest portfolio margin recovery report for the tenant
 */
interchangeRouter.get(
  "/report",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      const report = interchangeRecoveryService.getTenantReport(tenantId);
      if (!report) {
        res.status(404).json({ error: "No interchange report found for tenant" });
        return;
      }

      res.status(200).json({ success: true, data: report });
    } catch (error) {
      handleRouteError(res, error, "Failed to retrieve interchange report");
    }
  }
);
