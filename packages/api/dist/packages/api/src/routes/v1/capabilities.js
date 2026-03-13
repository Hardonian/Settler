"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const User_1 = require("../../domain/entities/User");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const registry_1 = require("../../services/capabilities/registry");
const telemetry_1 = require("../../services/capabilities/telemetry");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
const capabilityPermissionMap = {
    operator_intelligence: [Permissions_1.Permission.ADMIN_READ],
    alert_routing: [Permissions_1.Permission.ADMIN_READ],
    usage_metering: [Permissions_1.Permission.ADMIN_READ],
    enterprise_analytics: [Permissions_1.Permission.ADMIN_READ],
    enterprise_surface: [Permissions_1.Permission.ADMIN_READ],
    support_intake: [Permissions_1.Permission.USERS_READ],
    rate_limiting_guard: [Permissions_1.Permission.USERS_READ],
    webhook_replay_guard: [Permissions_1.Permission.USERS_READ],
};
async function resolveRequestPermissions(req) {
    const scopes = [];
    if (req.apiKeyId) {
        const apiKeyRows = await (0, db_1.query)(`SELECT scopes FROM api_keys WHERE id = $1`, [req.apiKeyId]);
        scopes.push(...(apiKeyRows[0]?.scopes ?? []));
    }
    if (!req.userId) {
        return { role: User_1.UserRole.VIEWER, scopes };
    }
    const userRows = await (0, db_1.query)(`SELECT role FROM users WHERE id = $1`, [
        req.userId,
    ]);
    const roleValue = userRows[0]?.role;
    const role = Object.values(User_1.UserRole).includes(roleValue)
        ? roleValue
        : User_1.UserRole.VIEWER;
    return { role, scopes };
}
function isCapabilityVisible(status, role, scopes) {
    const requiredPermissions = capabilityPermissionMap[status.key] ?? [Permissions_1.Permission.USERS_READ];
    return Permissions_1.PermissionChecker.hasAnyPermission(role, scopes, requiredPermissions);
}
router.get("/capabilities", async (_req, res) => {
    try {
        const registry = await (0, registry_1.getCapabilityRegistry)();
        const data = registry.list();
        data.forEach((status) => (0, telemetry_1.observeCapabilityStatus)(status, "/api/v1/capabilities"));
        res.json({ data });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, "Failed to load capability registry", 500);
    }
});
router.get("/capabilities/projected", async (req, res) => {
    try {
        const registry = await (0, registry_1.getCapabilityRegistry)();
        const { role, scopes } = await resolveRequestPermissions(req);
        const projected = registry
            .list()
            .filter((status) => isCapabilityVisible(status, role, scopes))
            .map((status) => ({ ...status, visible: true }));
        projected.forEach((status) => (0, telemetry_1.observeCapabilityStatus)(status, "/api/v1/capabilities/projected"));
        res.json({
            data: projected,
            metadata: {
                role,
                scopeCount: scopes.length,
            },
        });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, "Failed to load projected capabilities", 500, {
            userId: req.userId,
            apiKeyId: req.apiKeyId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=capabilities.js.map