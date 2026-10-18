/**
 * Dual-Ledger & TigerBeetle CDC API Routes (v2)
 *
 * REST API for dual-ledger synchronization, relational balance snapshots,
 * and double-entry parity verification.
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { tigerBeetleCDCService } from "../../services/ledger/tigerbeetle-cdc-service";
import { handleRouteError } from "../../utils/error-handler";
import { authorizeTenantActionOr403, requireTenantContext } from "../authz-helpers";
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";

const router: Router = Router();
const LEDGER_SURFACE = {
  key: "ledger_cdc_v2",
  unavailableReason:
    "Dual-ledger CDC sync is disabled until cluster configuration is tenant-scoped.",
  previewReason: "Dual-ledger CDC sync running in preview mode.",
};

/**
 * POST /api/v2/ledger/sync
 * Execute a CDC sync pass across uncommitted transfers
 */
router.post(
  "/sync",
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
          "Ledger CDC sync is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ledger/sync",
        LEDGER_SURFACE
      );
      if (!capability) return;

      const batchSize = Number(req.body?.batchSize) || 1000;
      const result = await tigerBeetleCDCService.syncTenantBalances(tenantId, batchSize);

      res.json({
        data: result,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Dual-ledger CDC sync completed successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to execute ledger CDC sync", 500);
      return;
    }
  }
);

/**
 * GET /api/v2/ledger/balances
 * List all projected account balance snapshots for the tenant
 */
router.get(
  "/balances",
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
          "Ledger balance inspection is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ledger/balances",
        LEDGER_SURFACE
      );
      if (!capability) return;

      const snapshots = tigerBeetleCDCService.listSnapshots(tenantId);
      const parity = tigerBeetleCDCService.verifyBalanceParity(tenantId);

      res.json({
        data: snapshots,
        parityReport: parity,
        count: snapshots.length,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list ledger balances", 500);
      return;
    }
  }
);

/**
 * GET /api/v2/ledger/parity
 * Returns double-entry parity report and epoch root hash
 */
router.get(
  "/parity",
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
          "Ledger parity inspection is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ledger/parity",
        LEDGER_SURFACE
      );
      if (!capability) return;

      const parity = tigerBeetleCDCService.verifyBalanceParity(tenantId);

      res.json({
        data: parity,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to verify ledger parity", 500);
      return;
    }
  }
);

/**
 * POST /api/v2/ledger/transfers
 * Record transfer into dual-ledger stream
 */
router.post(
  "/transfers",
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
          "Ledger transfer recording is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ledger/transfers",
        LEDGER_SURFACE
      );
      if (!capability) return;

      const { id, debitAccountId, creditAccountId, amount, currency, flags } = req.body;
      if (!id || !debitAccountId || !creditAccountId || amount === undefined) {
        return res
          .status(400)
          .json({ error: "id, debitAccountId, creditAccountId, and amount are required" });
      }

      const transfer = tigerBeetleCDCService.recordTransfer(tenantId, {
        id: String(id),
        debitAccountId: String(debitAccountId),
        creditAccountId: String(creditAccountId),
        amount: BigInt(amount),
        currency: currency || "USD",
        flags,
      });

      res.json({
        data: {
          ...transfer,
          amount: transfer.amount.toString(),
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to record ledger transfer", 400);
      return;
    }
  }
);

export default router;
