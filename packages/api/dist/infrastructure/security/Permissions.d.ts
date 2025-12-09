/**
 * Role-Based Access Control (RBAC) and Scope-Based Permissions
 * Implements least privilege principle
 */
import { UserRole } from '../../domain/entities/User';
export declare enum Permission {
    JOBS_READ = "jobs:read",
    JOBS_WRITE = "jobs:write",
    JOBS_DELETE = "jobs:delete",
    JOBS_EXECUTE = "jobs:execute",
    REPORTS_READ = "reports:read",
    REPORTS_EXPORT = "reports:export",
    WEBHOOKS_READ = "webhooks:read",
    WEBHOOKS_WRITE = "webhooks:write",
    WEBHOOKS_DELETE = "webhooks:delete",
    USERS_READ = "users:read",
    USERS_WRITE = "users:write",
    USERS_DELETE = "users:delete",
    TENANT_READ = "tenant:read",
    TENANT_WRITE = "tenant:write",
    TENANT_DELETE = "tenant:delete",
    TENANT_BILLING = "tenant:billing",
    ADMIN_READ = "admin:read",
    ADMIN_WRITE = "admin:write",
    ADMIN_AUDIT = "admin:audit",
    EDGE_AIAS_ACCESS = "edge:aias:access",
    EDGE_MODELS_READ = "edge:models:read",
    EDGE_NODES_READ = "edge:nodes:read",
    EDGE_NODES_WRITE = "edge:nodes:write"
}
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
export declare class PermissionChecker {
    /**
     * Check if user/API key has permission
     */
    static hasPermission(role: UserRole, scopes: string[], requiredPermission: Permission): boolean;
    /**
     * Check if user has any of the required permissions
     */
    static hasAnyPermission(role: UserRole, scopes: string[], requiredPermissions: Permission[]): boolean;
    /**
     * Check if user has all required permissions
     */
    static hasAllPermissions(role: UserRole, scopes: string[], requiredPermissions: Permission[]): boolean;
    /**
     * Get all permissions for a role
     */
    static getPermissionsForRole(role: UserRole): Permission[];
}
//# sourceMappingURL=Permissions.d.ts.map