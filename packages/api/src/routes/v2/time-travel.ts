/**
 * Time-Travel Forensic Financial Debugger Routes (API v2)
 *
 * REST API for timestamp-bounded historical financial state reconstruction,
 * Sparse Merkle Tree (SMT) leaf transitions, and deterministic state replay.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { timeTravelReplayService } from "../../services/ledger/time-travel-replay-service";
import { isValidTenantUuid } from "../../utils/tenant-id";
import { handleRouteError } from "../../utils/error-handler";

export const timeTravelRouter: Router = Router();

function resolveTenantId(req: Request): string | null {
  return (req as AuthRequest).tenantId ?? null;
}

/**
 * GET /api/v2/ledger/time-travel/state
 * Reconstructs ledger balance and SMT root at the recorded timestamp resolution
 */
timeTravelRouter.get(
  "/state",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      const asOf = (req.query?.asOf as string) || new Date().toISOString();
      const state = timeTravelReplayService.reconstructStateAt(tenantId, asOf);

      res.status(200).json({ success: true, data: state });
    } catch (error) {
      handleRouteError(res, error, "Failed to reconstruct historical financial state");
    }
  }
);

/**
 * POST /api/v2/ledger/time-travel/replay
 * Replays timeline window with ordered scrubber steps and state root transitions
 */
timeTravelRouter.post(
  "/replay",
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

      const { fromTimestamp, toTimestamp } = req.body ?? {};
      const replayWindow = timeTravelReplayService.replayWindow(
        tenantId,
        fromTimestamp,
        toTimestamp
      );

      res.status(200).json({ success: true, data: replayWindow });
    } catch (error) {
      handleRouteError(res, error, "Failed to execute time-travel replay window");
    }
  }
);
