"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const tenant_1 = require("../../middleware/tenant");
const api_response_1 = require("../../utils/api-response");
const error_handler_1 = require("../../utils/error-handler");
const support_intake_service_1 = require("../../services/support/support-intake-service");
const router = (0, express_1.Router)();
const supportIntakeRequestSchema = zod_1.z.object({
    category: zod_1.z.string().min(1),
    description: zod_1.z.string().min(20),
    run_id: zod_1.z.string().optional(),
    route: zod_1.z.string().optional(),
    module: zod_1.z.string().optional(),
    contact: zod_1.z
        .object({
        user_id: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        role: zod_1.z.string().optional(),
    })
        .optional(),
});
router.post("/intake", tenant_1.tenantMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return (0, api_response_1.sendError)(res, 401, "UNAUTHORIZED", "Authentication required");
        }
        if (!req.tenantId) {
            return (0, api_response_1.sendError)(res, 403, "TENANT_NOT_FOUND", "Tenant context required");
        }
        const parseResult = supportIntakeRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, api_response_1.sendError)(res, 400, "INVALID_SUPPORT_INTAKE", "Support intake request is invalid", parseResult.error.flatten());
        }
        const stored = await (0, support_intake_service_1.submitSupportIntake)({
            userId: req.userId,
            tenantId: req.tenantId,
            path: req.originalUrl,
            body: parseResult.data,
        });
        return res.status(202).json({
            accepted: true,
            submission_id: stored.submissionId,
            tenant_id: stored.tenantId,
            created_at: stored.createdAt,
        });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, "Failed to submit support intake", 500, {
            module: "routes/v1/support",
            route: `${req.method} ${req.baseUrl}${req.path}`,
            tenant_id: req.tenantId,
            run_id: typeof req.body?.run_id === "string" ? req.body.run_id : undefined,
        });
    }
});
exports.default = router;
//# sourceMappingURL=support.js.map