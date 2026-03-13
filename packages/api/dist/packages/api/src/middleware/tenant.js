"use strict";
/**
 * Tenant Middleware
 * Extracts tenant context from request and sets it for RLS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
const Container_1 = require("../infrastructure/di/Container");
const db_1 = require("../db");
const problem_json_1 = require("../utils/problem-json");
const User_1 = require("../domain/entities/User");
/**
 * Extract tenant from request
 * Priority: custom domain > subdomain > header > user's tenant
 */
async function tenantMiddleware(req, res, next) {
    try {
        const container = Container_1.Container.getInstance();
        const tenantRepo = container.get("ITenantRepository");
        let tenant = null;
        // 1. Check custom domain
        const rawHost = req.get("host") || "";
        const host = rawHost.split(":")[0] ?? "";
        if (host) {
            tenant = await tenantRepo.findByCustomDomain(host);
        }
        // 2. Check subdomain (e.g., tenant-slug.api.settler.io)
        if (!tenant && host.includes(".")) {
            const subdomain = host.split(".")[0];
            if (subdomain && subdomain !== "api" && subdomain !== "www") {
                tenant = await tenantRepo.findBySlug(subdomain);
            }
        }
        // 3. Check X-Tenant-ID header
        if (!tenant) {
            const tenantId = req.get("X-Tenant-ID");
            if (tenantId) {
                if (!req.userId) {
                    (0, problem_json_1.sendProblemJson)(req, res, {
                        status: 401,
                        title: "Unauthorized",
                        detail: "Authenticated identity required when selecting tenant context",
                        code: "TENANT_CONTEXT_AUTH_REQUIRED",
                    });
                    return;
                }
                const userResult = await (0, db_1.query)(`SELECT tenant_id, role FROM users WHERE id = $1`, [req.userId]);
                if (userResult.length === 0 || !userResult[0]) {
                    (0, problem_json_1.sendProblemJson)(req, res, {
                        status: 403,
                        title: "Forbidden",
                        detail: "User not found",
                        code: "TENANT_CONTEXT_USER_NOT_FOUND",
                    });
                    return;
                }
                const user = userResult[0];
                const canImpersonateTenant = user.role === User_1.UserRole.OWNER || user.role === User_1.UserRole.ADMIN;
                if (tenantId !== user.tenant_id && !canImpersonateTenant) {
                    (0, problem_json_1.sendProblemJson)(req, res, {
                        status: 403,
                        title: "Forbidden",
                        detail: "Cross-tenant context is not permitted",
                        code: "TENANT_CONTEXT_FORBIDDEN",
                    });
                    return;
                }
                tenant = await tenantRepo.findById(tenantId);
            }
        }
        // 4. Fall back to user's tenantId from auth middleware
        if (!tenant && req.userId) {
            // Try to get tenant from user
            const userResult = await (0, db_1.query)(`SELECT tenant_id FROM users WHERE id = $1`, [req.userId]);
            if (userResult.length > 0 && userResult[0]) {
                tenant = await tenantRepo.findById(userResult[0].tenant_id);
            }
        }
        if (!tenant) {
            (0, problem_json_1.sendProblemJson)(req, res, {
                status: 403,
                title: "Tenant context missing",
                detail: "Unable to determine tenant context",
                code: "TENANT_NOT_FOUND",
            });
            return;
        }
        // Check tenant status
        if (tenant.status === "suspended" || tenant.status === "cancelled") {
            (0, problem_json_1.sendProblemJson)(req, res, {
                status: 403,
                title: "Tenant suspended",
                detail: "Tenant account is suspended or cancelled",
                code: "TENANT_SUSPENDED",
            });
            return;
        }
        req.tenantId = tenant.id;
        req.tenant = tenant;
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=tenant.js.map