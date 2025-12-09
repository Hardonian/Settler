"use strict";
/**
 * Authorization Middleware
 * Enforces least privilege access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireResourceOwnership = requireResourceOwnership;
const Permissions_1 = require("../infrastructure/security/Permissions");
const User_1 = require("../domain/entities/User");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return User_1.UserRole; } });
const db_1 = require("../db");
/**
 * Require specific permission(s)
 */
function requirePermission(...permissions) {
    return async (req, res, next) => {
        try {
            if (!req.userId || !req.tenantId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
                return;
            }
            // Get user role and scopes
            const user = await (0, db_1.query)(`SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`, [req.userId, req.apiKeyId || null, req.tenantId]);
            if (user.length === 0 || !user[0]) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'User not found',
                });
                return;
            }
            const userRecord = user[0];
            const { role, scopes } = userRecord;
            // Check permissions
            const hasPermission = Permissions_1.PermissionChecker.hasAllPermissions(role, scopes, permissions);
            if (!hasPermission) {
                // Log unauthorized access attempt
                await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    'unauthorized_access',
                    req.userId,
                    req.tenantId,
                    req.ip || null,
                    req.headers['user-agent'] || null,
                    req.path,
                    JSON.stringify({ requiredPermissions: permissions }),
                ]);
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                    required: permissions,
                });
                return;
            }
            // Store permissions in request for downstream use
            req.permissions = Permissions_1.PermissionChecker.getPermissionsForRole(role);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Require any of the specified permissions
 */
function requireAnyPermission(...permissions) {
    return async (req, res, next) => {
        try {
            if (!req.userId || !req.tenantId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
                return;
            }
            const user = await (0, db_1.query)(`SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`, [req.userId, req.apiKeyId || null, req.tenantId]);
            if (user.length === 0 || !user[0]) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'User not found',
                });
                return;
            }
            const userRecord = user[0];
            const { role, scopes } = userRecord;
            const hasPermission = Permissions_1.PermissionChecker.hasAnyPermission(role, scopes, permissions);
            if (!hasPermission) {
                await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    'unauthorized_access',
                    req.userId,
                    req.tenantId,
                    req.ip || null,
                    req.headers['user-agent'] || null,
                    req.path,
                    JSON.stringify({ requiredPermissions: permissions }),
                ]);
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                });
                return;
            }
            req.permissions = Permissions_1.PermissionChecker.getPermissionsForRole(role);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Require resource ownership
 * Ensures the user owns the resource they're trying to access
 * Can be used as middleware or called directly with a callback
 */
function requireResourceOwnership(req, res, next, resourceType, resourceId) {
    (async () => {
        try {
            if (!req.userId || !req.tenantId) {
                const error = { error: 'Unauthorized', message: 'Authentication required' };
                if (typeof next === 'function' && next.length === 1) {
                    // Callback pattern
                    next(error);
                }
                else {
                    // Middleware pattern
                    res.status(401).json(error);
                }
                return;
            }
            // Check resource ownership based on type
            let owned = false;
            switch (resourceType) {
                case 'job': {
                    const result = await (0, db_1.query)(`SELECT id FROM reconciliation_jobs 
             WHERE id = $1 AND user_id = $2 AND tenant_id = $3`, [resourceId, req.userId, req.tenantId]);
                    owned = result.length > 0;
                    break;
                }
                case 'webhook': {
                    const result = await (0, db_1.query)(`SELECT id FROM webhooks 
             WHERE id = $1 AND tenant_id = $2`, [resourceId, req.tenantId]);
                    owned = result.length > 0;
                    break;
                }
                default:
                    // For unknown resource types, allow if user has admin permissions
                    const user = await (0, db_1.query)(`SELECT role FROM users WHERE id = $1 AND tenant_id = $2`, [req.userId, req.tenantId]);
                    if (user.length > 0 && user[0]) {
                        owned = user[0].role === User_1.UserRole.OWNER || user[0].role === User_1.UserRole.ADMIN;
                    }
            }
            if (!owned) {
                const error = { error: 'Forbidden', message: 'Resource not found or access denied' };
                if (typeof next === 'function' && next.length === 1) {
                    // Callback pattern
                    next(error);
                }
                else {
                    // Middleware pattern
                    res.status(403).json(error);
                }
                return;
            }
            // Success - call next
            if (typeof next === 'function' && next.length === 1) {
                // Callback pattern
                next();
            }
            else {
                // Middleware pattern
                next();
            }
        }
        catch (error) {
            if (typeof next === 'function' && next.length === 1) {
                // Callback pattern
                next(error);
            }
            else {
                // Middleware pattern
                next(error);
            }
        }
    })();
}
//# sourceMappingURL=authorization.js.map