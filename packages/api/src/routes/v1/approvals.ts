/**
 * Approval Workflows API Routes
 * Handles approval request endpoints
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { logError, logInfo } from "../../utils/logger";
import {
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  getApprovalRequest,
  listApprovalRequests,
  addApprover,
  type ApprovalStatus,
} from "../../services/approval-workflows";

const router: Router = Router();

/**
 * POST /api/v1/approvals/requests
 * Create an approval request
 */
router.post("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const {
      requestType,
      requestDetails,
      reconciliationRunId,
      reconJobId,
      reconResultId,
      approverId,
      approverRole,
      expiresInHours,
      comments,
    } = req.body;

    if (!requestType || !requestDetails) {
      return res.status(400).json({
        error: "Bad Request",
        message: "requestType and requestDetails are required",
        traceId: req.traceId,
      });
    }

    const approvalId = await createApprovalRequest(
      tenantId,
      userId,
      requestType,
      requestDetails,
      {
        reconciliationRunId,
        reconJobId,
        reconResultId,
        approverId,
        approverRole,
        expiresInHours,
        comments,
      }
    );

    logInfo("Approval request created", { approvalId, tenantId, userId, traceId: req.traceId });

    return res.status(201).json({
      id: approvalId,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to create approval request", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create approval request",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/approvals/requests
 * List approval requests
 */
router.get("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      status,
      approverId,
      requestedBy,
      limit = 100,
      offset = 0,
    } = req.query;

    const requests = await listApprovalRequests(tenantId, {
      status: status as ApprovalStatus | undefined,
      approverId: approverId as string | undefined,
      requestedBy: requestedBy as string | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    return res.json({
      data: requests,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: requests.length,
      },
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to list approval requests", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list approval requests",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/approvals/requests/:approvalId
 * Get approval request details
 */
router.get("/requests/:approvalId", async (req: AuthRequest, res: Response) => {
  try {
    const { approvalId } = req.params;
    const tenantId = req.tenantId!;

    if (!approvalId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "approvalId is required",
        traceId: req.traceId,
      });
    }

    const request = await getApprovalRequest(tenantId, approvalId);

    if (!request) {
      return res.status(404).json({
        error: "Not Found",
        message: "Approval request not found",
        traceId: req.traceId,
      });
    }

    return res.json({
      ...request,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get approval request", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get approval request",
      traceId: req.traceId,
    });
  }
});

/**
 * POST /api/v1/approvals/requests/:approvalId/approve
 * Approve a request
 */
router.post("/requests/:approvalId/approve", async (req: AuthRequest, res: Response) => {
  try {
    const { approvalId } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    if (!approvalId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "approvalId is required",
        traceId: req.traceId,
      });
    }

    await approveRequest(tenantId, approvalId, userId);

    logInfo("Approval request approved", { approvalId, tenantId, userId, traceId: req.traceId });

    return res.status(200).json({
      message: "Request approved",
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to approve request", error, { traceId: req.traceId });
    const statusCode = (error as Error).message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      error: statusCode === 404 ? "Not Found" : "Internal Server Error",
      message: (error as Error).message || "Failed to approve request",
      traceId: req.traceId,
    });
  }
});

/**
 * POST /api/v1/approvals/requests/:approvalId/reject
 * Reject a request
 */
router.post("/requests/:approvalId/reject", async (req: AuthRequest, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { comments } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    if (!approvalId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "approvalId is required",
        traceId: req.traceId,
      });
    }

    await rejectRequest(tenantId, approvalId, userId, comments);

    logInfo("Approval request rejected", { approvalId, tenantId, userId, traceId: req.traceId });

    return res.status(200).json({
      message: "Request rejected",
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to reject request", error, { traceId: req.traceId });
    const statusCode = (error as Error).message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      error: statusCode === 404 ? "Not Found" : "Internal Server Error",
      message: (error as Error).message || "Failed to reject request",
      traceId: req.traceId,
    });
  }
});

/**
 * POST /api/v1/approvals/approvers
 * Add an approver
 */
router.post("/approvers", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { userId, role, approvalThreshold, canApproveFinal } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        error: "Bad Request",
        message: "userId and role are required",
        traceId: req.traceId,
      });
    }

    const approverId = await addApprover(tenantId, userId, role, {
      approvalThreshold,
      canApproveFinal,
    });

    logInfo("Approver added", { approverId, tenantId, userId, role, traceId: req.traceId });

    return res.status(201).json({
      id: approverId,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to add approver", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to add approver",
      traceId: req.traceId,
    });
  }
});

export default router;
