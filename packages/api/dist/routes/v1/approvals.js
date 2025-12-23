"use strict";
/**
 * Approval Workflows API Routes
 * Handles approval request endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const approval_workflows_1 = require("../../services/approval-workflows");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/approvals/requests
 * Create an approval request
 */
router.post("/requests", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { requestType, requestDetails, reconciliationRunId, reconJobId, reconResultId, approverId, approverRole, expiresInHours, comments, } = req.body;
        if (!requestType || !requestDetails) {
            return res.status(400).json({
                error: "Bad Request",
                message: "requestType and requestDetails are required",
                traceId: req.traceId,
            });
        }
        const approvalId = await (0, approval_workflows_1.createApprovalRequest)(tenantId, userId, requestType, requestDetails, {
            reconciliationRunId,
            reconJobId,
            reconResultId,
            approverId,
            approverRole,
            expiresInHours,
            comments,
        });
        (0, logger_1.logInfo)("Approval request created", { approvalId, tenantId, userId, traceId: req.traceId });
        return res.status(201).json({
            id: approvalId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create approval request", error, { traceId: req.traceId });
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
router.get("/requests", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { status, approverId, requestedBy, limit = 100, offset = 0, } = req.query;
        const requests = await (0, approval_workflows_1.listApprovalRequests)(tenantId, {
            status: status,
            approverId: approverId,
            requestedBy: requestedBy,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        return res.json({
            data: requests,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: requests.length,
            },
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list approval requests", error, { traceId: req.traceId });
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
router.get("/requests/:approvalId", async (req, res) => {
    try {
        const { approvalId } = req.params;
        const tenantId = req.tenantId;
        if (!approvalId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "approvalId is required",
                traceId: req.traceId,
            });
        }
        const request = await (0, approval_workflows_1.getApprovalRequest)(tenantId, approvalId);
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get approval request", error, { traceId: req.traceId });
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
router.post("/requests/:approvalId/approve", async (req, res) => {
    try {
        const { approvalId } = req.params;
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!approvalId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "approvalId is required",
                traceId: req.traceId,
            });
        }
        await (0, approval_workflows_1.approveRequest)(tenantId, approvalId, userId);
        (0, logger_1.logInfo)("Approval request approved", { approvalId, tenantId, userId, traceId: req.traceId });
        return res.status(200).json({
            message: "Request approved",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to approve request", error, { traceId: req.traceId });
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            error: statusCode === 404 ? "Not Found" : "Internal Server Error",
            message: error.message || "Failed to approve request",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/approvals/requests/:approvalId/reject
 * Reject a request
 */
router.post("/requests/:approvalId/reject", async (req, res) => {
    try {
        const { approvalId } = req.params;
        const { comments } = req.body;
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!approvalId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "approvalId is required",
                traceId: req.traceId,
            });
        }
        await (0, approval_workflows_1.rejectRequest)(tenantId, approvalId, userId, comments);
        (0, logger_1.logInfo)("Approval request rejected", { approvalId, tenantId, userId, traceId: req.traceId });
        return res.status(200).json({
            message: "Request rejected",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to reject request", error, { traceId: req.traceId });
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            error: statusCode === 404 ? "Not Found" : "Internal Server Error",
            message: error.message || "Failed to reject request",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/approvals/approvers
 * Add an approver
 */
router.post("/approvers", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { userId, role, approvalThreshold, canApproveFinal } = req.body;
        if (!userId || !role) {
            return res.status(400).json({
                error: "Bad Request",
                message: "userId and role are required",
                traceId: req.traceId,
            });
        }
        const approverId = await (0, approval_workflows_1.addApprover)(tenantId, userId, role, {
            approvalThreshold,
            canApproveFinal,
        });
        (0, logger_1.logInfo)("Approver added", { approverId, tenantId, userId, role, traceId: req.traceId });
        return res.status(201).json({
            id: approverId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to add approver", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to add approver",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=approvals.js.map