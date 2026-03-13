"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authorization_1 = require("../../middleware/authorization");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const validation_1 = require("../../middleware/validation");
const error_handler_1 = require("../../utils/error-handler");
const registry_1 = require("../../services/capabilities/registry");
const errors_1 = require("../../services/capabilities/errors");
const telemetry_1 = require("../../services/capabilities/telemetry");
const router = (0, express_1.Router)();
router.get("/operator/intelligence/system-health", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ error: "Missing tenant context" });
    }
    try {
        const days = Number(req.query.days ?? 7);
        const provider = await (0, registry_1.getOperatorIntelligenceProvider)();
        const data = await provider.getSystemHealthSnapshot(tenantId, Number.isFinite(days) ? days : 7);
        const capability = provider.status();
        (0, telemetry_1.observeCapabilityStatus)(capability, "/api/v1/operator/intelligence/system-health");
        return res.json({ data, capability });
    }
    catch (error) {
        if ((0, errors_1.isMissingOptionalCapabilityDependency)(error)) {
            const provider = (0, registry_1.getUnavailableOperatorIntelligenceProvider)("Operator intelligence storage tables are not present in OSS mode");
            const capability = provider.status();
            (0, telemetry_1.observeCapabilityStatus)(capability, "/api/v1/operator/intelligence/system-health");
            return res.status(200).json({
                data: await provider.getSystemHealthSnapshot(tenantId, 7),
                capability,
            });
        }
        return (0, error_handler_1.handleRouteError)(res, error, "Failed to load system health snapshot", 500, {
            userId: req.userId,
        });
    }
});
const runExplorerSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.string().optional(),
        runId: zod_1.z.string().uuid().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).optional(),
    }),
});
router.get("/operator/intelligence/run-explorer", (0, authorization_1.requirePermission)(Permissions_1.Permission.ADMIN_READ), (0, validation_1.validateRequest)(runExplorerSchema), async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ error: "Missing tenant context" });
    }
    try {
        const provider = await (0, registry_1.getOperatorIntelligenceProvider)();
        const runs = await provider.getRunExplorer(tenantId, {
            status: typeof req.query.status === "string" ? req.query.status : undefined,
            runId: typeof req.query.runId === "string" ? req.query.runId : undefined,
            limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
        });
        const capability = provider.status();
        (0, telemetry_1.observeCapabilityStatus)(capability, "/api/v1/operator/intelligence/run-explorer");
        return res.json({ data: runs, capability });
    }
    catch (error) {
        if ((0, errors_1.isMissingOptionalCapabilityDependency)(error)) {
            const provider = (0, registry_1.getUnavailableOperatorIntelligenceProvider)("Operator intelligence storage tables are not present in OSS mode");
            const capability = provider.status();
            (0, telemetry_1.observeCapabilityStatus)(capability, "/api/v1/operator/intelligence/run-explorer");
            return res.status(200).json({
                data: await provider.getRunExplorer(tenantId, {}),
                capability,
            });
        }
        return (0, error_handler_1.handleRouteError)(res, error, "Failed to load run explorer", 500, {
            userId: req.userId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=operator-intelligence.js.map