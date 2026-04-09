/**
 * Receipt Matching API Routes
 * Handles receipt auto-matching endpoints
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { logError, logInfo } from "../../utils/logger";
import {
  matchReceiptsToTransactions,
  verifyReceiptLink,
  getReceiptMatches,
} from "../../services/receipt-matching";

const router: Router = Router();

/**
 * POST /api/v1/receipt-matching/match
 * Match receipts to transactions
 */
router.post(
  "/match",
  enforceFreezeState(),
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { reconciliationRunId, receipts, transactions } = req.body;

      if (!reconciliationRunId || !receipts || !transactions) {
        return res.status(400).json({
          error: "Bad Request",
          message: "reconciliationRunId, receipts, and transactions are required",
          traceId: req.traceId,
        });
      }

      const matches = await matchReceiptsToTransactions(
        tenantId,
        reconciliationRunId,
        receipts,
        transactions
      );

      logInfo("Receipts matched", {
        tenantId,
        reconciliationRunId,
        matchCount: matches.length,
        traceId: req.traceId,
      });

      return res.status(200).json({
        matches,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to match receipts", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to match receipts",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/receipt-matching/matches/:reconciliationRunId
 * Get receipt matches for a reconciliation run
 */
router.get(
  "/matches/:reconciliationRunId",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const reconciliationRunIdParam = req.params["reconciliationRunId"];
      const reconciliationRunId = Array.isArray(reconciliationRunIdParam)
        ? (reconciliationRunIdParam[0] ?? "")
        : (reconciliationRunIdParam ?? "");
      const tenantId = req.tenantId!;

      if (!reconciliationRunId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "reconciliationRunId is required",
          traceId: req.traceId,
        });
      }

      const matches = await getReceiptMatches(tenantId, reconciliationRunId);

      return res.json({
        data: matches,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to get receipt matches", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get receipt matches",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/receipt-matching/links/:linkId/verify
 * Verify a receipt-transaction link
 */
router.post(
  "/links/:linkId/verify",
  enforceFreezeState(),
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const linkIdParam = req.params["linkId"];
      const linkId = Array.isArray(linkIdParam) ? (linkIdParam[0] ?? "") : (linkIdParam ?? "");
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      if (!linkId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "linkId is required",
          traceId: req.traceId,
        });
      }

      await verifyReceiptLink(tenantId, linkId, userId);

      logInfo("Receipt link verified", { linkId, tenantId, userId, traceId: req.traceId });

      return res.status(200).json({
        message: "Link verified",
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to verify receipt link", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify receipt link",
        traceId: req.traceId,
      });
    }
  }
);

export default router;
