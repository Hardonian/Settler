"use strict";
/**
 * Role-Based Access Control (RBAC) and Scope-Based Permissions
 * Implements least privilege principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionChecker = exports.ROLE_PERMISSIONS = exports.Permission = void 0;
const User_1 = require("../../domain/entities/User");
var Permission;
(function (Permission) {
    // Jobs
    Permission["JOBS_READ"] = "jobs:read";
    Permission["JOBS_WRITE"] = "jobs:write";
    Permission["JOBS_DELETE"] = "jobs:delete";
    Permission["JOBS_EXECUTE"] = "jobs:execute";
    // Reports
    Permission["REPORTS_READ"] = "reports:read";
    Permission["REPORTS_EXPORT"] = "reports:export";
    // Webhooks
    Permission["WEBHOOKS_READ"] = "webhooks:read";
    Permission["WEBHOOKS_WRITE"] = "webhooks:write";
    Permission["WEBHOOKS_DELETE"] = "webhooks:delete";
    // Users
    Permission["USERS_READ"] = "users:read";
    Permission["USERS_WRITE"] = "users:write";
    Permission["USERS_DELETE"] = "users:delete";
    // Tenants
    Permission["TENANT_READ"] = "tenant:read";
    Permission["TENANT_WRITE"] = "tenant:write";
    Permission["TENANT_DELETE"] = "tenant:delete";
    Permission["TENANT_BILLING"] = "tenant:billing";
    // Admin
    Permission["ADMIN_READ"] = "admin:read";
    Permission["ADMIN_WRITE"] = "admin:write";
    Permission["ADMIN_AUDIT"] = "admin:audit";
    // Edge AI
    Permission["EDGE_AIAS_ACCESS"] = "edge:aias:access";
    Permission["EDGE_MODELS_READ"] = "edge:models:read";
    Permission["EDGE_NODES_READ"] = "edge:nodes:read";
    Permission["EDGE_NODES_WRITE"] = "edge:nodes:write";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
    [User_1.UserRole.OWNER]: [
        // Owner has all permissions
        Permission.JOBS_READ,
        Permission.JOBS_WRITE,
        Permission.JOBS_DELETE,
        Permission.JOBS_EXECUTE,
        Permission.REPORTS_READ,
        Permission.REPORTS_EXPORT,
        Permission.WEBHOOKS_READ,
        Permission.WEBHOOKS_WRITE,
        Permission.WEBHOOKS_DELETE,
        Permission.USERS_READ,
        Permission.USERS_WRITE,
        Permission.USERS_DELETE,
        Permission.TENANT_READ,
        Permission.TENANT_WRITE,
        Permission.TENANT_DELETE,
        Permission.TENANT_BILLING,
    ],
    [User_1.UserRole.ADMIN]: [
        Permission.JOBS_READ,
        Permission.JOBS_WRITE,
        Permission.JOBS_DELETE,
        Permission.JOBS_EXECUTE,
        Permission.REPORTS_READ,
        Permission.REPORTS_EXPORT,
        Permission.WEBHOOKS_READ,
        Permission.WEBHOOKS_WRITE,
        Permission.WEBHOOKS_DELETE,
        Permission.USERS_READ,
        Permission.USERS_WRITE,
        Permission.TENANT_READ,
        Permission.TENANT_WRITE,
    ],
    [User_1.UserRole.DEVELOPER]: [
        Permission.JOBS_READ,
        Permission.JOBS_WRITE,
        Permission.JOBS_EXECUTE,
        Permission.REPORTS_READ,
        Permission.REPORTS_EXPORT,
        Permission.WEBHOOKS_READ,
        Permission.WEBHOOKS_WRITE,
        Permission.USERS_READ,
    ],
    [User_1.UserRole.VIEWER]: [
        Permission.JOBS_READ,
        Permission.REPORTS_READ,
        Permission.WEBHOOKS_READ,
        Permission.USERS_READ,
    ],
};
class PermissionChecker {
    /**
     * Check if user/API key has permission
     */
    static hasPermission(role, scopes, requiredPermission) {
        // Check explicit scopes first (API keys)
        if (scopes.includes('*') || scopes.includes(requiredPermission)) {
            return true;
        }
        // Check role-based permissions
        const rolePermissions = exports.ROLE_PERMISSIONS[role] || [];
        return rolePermissions.includes(requiredPermission);
    }
    /**
     * Check if user has any of the required permissions
     */
    static hasAnyPermission(role, scopes, requiredPermissions) {
        return requiredPermissions.some((perm) => this.hasPermission(role, scopes, perm));
    }
    /**
     * Check if user has all required permissions
     */
    static hasAllPermissions(role, scopes, requiredPermissions) {
        return requiredPermissions.every((perm) => this.hasPermission(role, scopes, perm));
    }
    /**
     * Get all permissions for a role
     */
    static getPermissionsForRole(role) {
        return exports.ROLE_PERMISSIONS[role] || [];
    }
}
exports.PermissionChecker = PermissionChecker;
//# sourceMappingURL=Permissions.js.map