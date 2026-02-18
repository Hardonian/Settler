"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const export_contract_1 = require("../services/reconciliation/export-contract");
const error_handler_1 = require("../utils/error-handler");
const router = (0, express_1.Router)();
exports.exportRouter = router;
const querySchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
});
router.get("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(401).json({
                code: "UNAUTHORIZED",
                message: "Tenant context is required",
                traceId: req.traceId,
                retryable: false,
            });
        }
        const parsed = querySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                code: "BAD_REQUEST",
                message: "runId (uuid) query parameter is required",
                traceId: req.traceId,
                retryable: false,
            });
        }
        const exportDocument = await (0, export_contract_1.buildReconciliationExport)(tenantId, parsed.data.runId);
        if (!exportDocument) {
            return res.status(404).json({
                code: "NOT_FOUND",
                message: "Reconciliation run not found",
                traceId: req.traceId,
                retryable: false,
            });
        }
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json(exportDocument);
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, "Failed to export reconciliation data", 500, {
            userId: req.userId,
        });
    }
});
//# sourceMappingURL=export.js.map