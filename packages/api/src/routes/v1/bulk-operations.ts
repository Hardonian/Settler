/**
 * Bulk Operations API Routes
 * Handles bulk operation endpoints
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { logError, logInfo } from "../../utils/logger";
import {
  createBulkOperation,
  executeBulkOperation,
  getBulkOperationStatus,
  type BulkOperationType,
} from "../../services/bulk-operations";

const router = Router();

/**
 * POST /api/v1/bulk-operations
 * Create a bulk operation
 */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const { operationType, targetType, targetIds, operationConfig } = req.body;

    if (!operationType || !targetType || !targetIds || !Array.isArray(targetIds)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "operationType, targetType, and targetIds array are required",
        traceId: req.traceId,
      });
    }

    const operationId = await createBulkOperation(
      tenantId,
      userId,
      operationType as BulkOperationType,
      targetType,
      targetIds,
      operationConfig || {}
    );

    logInfo("Bulk operation created", {
      operationId,
      tenantId,
      userId,
      operationType,
      traceId: req.traceId,
    });

    // Execute asynchronously
    executeBulkOperation(tenantId, operationId).catch((error) => {
      logError("Bulk operation execution failed", error, { operationId, tenantId });
    });

    return res.status(201).json({
      id: operationId,
      status: "pending",
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to create bulk operation", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create bulk operation",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/bulk-operations/:operationId
 * Get bulk operation status
 */
router.get("/:operationId", async (req: AuthRequest, res: Response) => {
  try {
    const { operationId } = req.params;
    const tenantId = req.tenantId!;

    const status = await getBulkOperationStatus(tenantId, operationId);

    if (!status) {
      return res.status(404).json({
        error: "Not Found",
        message: "Bulk operation not found",
        traceId: req.traceId,
      });
    }

    return res.json({
      ...status,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get bulk operation status", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get bulk operation status",
      traceId: req.traceId,
    });
  }
});

export default router;
