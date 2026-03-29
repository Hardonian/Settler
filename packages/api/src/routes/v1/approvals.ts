/**
 * Approval Workflows API Routes
 * Handles approval request endpoints
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { logError, logInfo } from "../../utils/logger";
import {
  authorizeTenantActionOr403,
  requireTenantContext,
  requireUserContext,
} from "../authz-helpers";
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
router.post(
  "/requests",
  requirePermission(Permission.TENANT_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      const userId = requireUserContext(req, res);
      if (!tenantId || !userId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.approval.request",
          "Approval request creation is not authorized"
        ))
      ) {
        return;
      }
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
  }
);

/**
 * GET /api/v1/approvals/requests
 * List approval requests
 */
router.get(
  "/requests",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.approval.read",
          "Approval request read is not authorized"
        ))
      ) {
        return;
      }
      const { status, approverId, requestedBy, limit = 100, offset = 0 } = req.query;

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
  }
);

/**
 * GET /api/v1/approvals/requests/:approvalId
 * Get approval request details
 */
router.get(
  "/requests/:approvalId",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const approvalIdParam = req.params["approvalId"];
      const approvalId = Array.isArray(approvalIdParam)
        ? (approvalIdParam[0] ?? "")
        : (approvalIdParam ?? "");
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.approval.read",
          "Approval request read is not authorized"
        ))
      ) {
        return;
      }

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
  }
);

/**
 * POST /api/v1/approvals/requests/:approvalId/approve
 * Approve a request
 */
router.post(
  "/requests/:approvalId/approve",
  requirePermission(Permission.TENANT_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const approvalIdParam2 = req.params["approvalId"];
      const approvalId = Array.isArray(approvalIdParam2)
        ? (approvalIdParam2[0] ?? "")
        : (approvalIdParam2 ?? "");
      const tenantId = requireTenantContext(req, res);
      const userId = requireUserContext(req, res);
      if (!tenantId || !userId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.approval.decide",
          "Approval decision is not authorized"
        ))
      ) {
        return;
      }

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
      const message = (error as Error).message;
      const statusCode = message.includes("not found")
        ? 404
        : message.includes("permission")
          ? 403
          : 409;
      return res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Conflict",
        message: message || "Failed to approve request",
        reason: message.includes("separation_of_duties")
          ? "separation_of_duties_violation"
          : "approval_transition_denied",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/approvals/requests/:approvalId/reject
 * Reject a request
 */
router.post(
  "/requests/:approvalId/reject",
  requirePermission(Permission.TENANT_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const approvalIdParam3 = req.params["approvalId"];
      const approvalId = Array.isArray(approvalIdParam3)
        ? (approvalIdParam3[0] ?? "")
        : (approvalIdParam3 ?? "");
      const { comments } = req.body;
      const tenantId = requireTenantContext(req, res);
      const userId = requireUserContext(req, res);
      if (!tenantId || !userId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.approval.decide",
          "Approval decision is not authorized"
        ))
      ) {
        return;
      }

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
      const message = (error as Error).message;
      const statusCode = message.includes("not found")
        ? 404
        : message.includes("permission")
          ? 403
          : 409;
      return res.status(statusCode).json({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Conflict",
        message: message || "Failed to reject request",
        reason: message.includes("separation_of_duties")
          ? "separation_of_duties_violation"
          : "approval_transition_denied",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/approvals/approvers
 * Add an approver
 */
router.post(
  "/approvers",
  requirePermission(Permission.TENANT_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.approval.manage",
          "Approver management is not authorized"
        ))
      ) {
        return;
      }
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
  }
);

export const approvalsRouter = router;
export default router;
