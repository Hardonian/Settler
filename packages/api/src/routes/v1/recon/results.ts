/**
 * Recon Results API Routes
 *
 * REST API for accessing reconciliation results
 * Part of Phase I: Recon Core Foundation
 */

import { Router, Response } from "express";
import { ReconCoreEngine } from "../../../services/recon-core";

import type { PrismaClient } from "@prisma/client";
import { handleRouteError } from "../../../utils/error-handler";
import { authMiddleware } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";
import { serializeReconResult } from "./serializers";
import type { TenantRequest } from "../../../middleware/tenant";

const router: Router = Router();
// Prisma client will be initialized at runtime

const prisma = {} as PrismaClient;
const reconEngine = new ReconCoreEngine(prisma);

/**
 * GET /api/v1/recon/jobs/:jobId/results
 * List reconciliation results for a job
 */
router.get("/", authMiddleware, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const jobId = (req.params.jobId || req.query.jobId) as string | undefined;

    if (!jobId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Job ID is required",
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    // Get total count for accurate pagination
    const totalCount = await reconEngine.countReconResults(jobId, tenantId);

    const results = await reconEngine.listReconResults(jobId, tenantId, {
      limit,
      offset,
    });
    const serializedResults = results.map((result) => serializeReconResult(result));

    return res.json({
      data: serializedResults,
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    });
  } catch (error) {
    return handleRouteError(res, error, "Failed to list reconciliation results", 400);
  }
});

/**
 * GET /api/v1/recon/results/:resultId
 * Get a specific reconciliation result
 */
router.get(
  "/:resultId",
  authMiddleware,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const resultIdParam = req.params["resultId"];
      const resultId = Array.isArray(resultIdParam)
        ? (resultIdParam[0] ?? "")
        : (resultIdParam ?? "");

      if (!resultId) {
        return res.status(400).json({
          error: "Bad request",
          message: "Result ID is required",
        });
      }

      const result = await reconEngine.getReconResult(resultId, tenantId);

      if (!result) {
        return res.status(404).json({
          error: "Not found",
          message: `Reconciliation result ${resultId} not found`,
        });
      }

      return res.json({ data: serializeReconResult(result) });
    } catch (error) {
      return handleRouteError(res, error, "Failed to get reconciliation result", 400);
    }
  }
);

export default router;
