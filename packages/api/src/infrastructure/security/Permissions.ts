/**
 * Role-Based Access Control (RBAC) and Scope-Based Permissions
 * Implements least privilege principle
 */

import { UserRole } from '../../domain/entities/User';

export enum Permission {
  // Jobs
  JOBS_READ = 'jobs:read',
  JOBS_WRITE = 'jobs:write',
  JOBS_DELETE = 'jobs:delete',
  JOBS_EXECUTE = 'jobs:execute',

  // Reports
  REPORTS_READ = 'reports:read',
  REPORTS_EXPORT = 'reports:export',

  // Webhooks
  WEBHOOKS_READ = 'webhooks:read',
  WEBHOOKS_WRITE = 'webhooks:write',
  WEBHOOKS_DELETE = 'webhooks:delete',

  // Users
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',

  // Tenants
  TENANT_READ = 'tenant:read',
  TENANT_WRITE = 'tenant:write',
  TENANT_DELETE = 'tenant:delete',
  TENANT_BILLING = 'tenant:billing',

  // Admin
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_AUDIT = 'admin:audit',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
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
  [UserRole.ADMIN]: [
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
  [UserRole.DEVELOPER]: [
    Permission.JOBS_READ,
    Permission.JOBS_WRITE,
    Permission.JOBS_EXECUTE,
    Permission.REPORTS_READ,
    Permission.REPORTS_EXPORT,
    Permission.WEBHOOKS_READ,
    Permission.WEBHOOKS_WRITE,
    Permission.USERS_READ,
  ],
  [UserRole.VIEWER]: [
    Permission.JOBS_READ,
    Permission.REPORTS_READ,
    Permission.WEBHOOKS_READ,
    Permission.USERS_READ,
  ],
};

export class PermissionChecker {
  /**
   * Check if user/API key has permission
   */
  static hasPermission(
    role: UserRole,
    scopes: string[],
    requiredPermission: Permission
  ): boolean {
    // Check explicit scopes first (API keys)
    if (scopes.includes('*') || scopes.includes(requiredPermission)) {
      return true;
    }

    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required permissions
   */
  static hasAnyPermission(
    role: UserRole,
    scopes: string[],
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.some((perm) =>
      this.hasPermission(role, scopes, perm)
    );
  }

  /**
   * Check if user has all required permissions
   */
  static hasAllPermissions(
    role: UserRole,
    scopes: string[],
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.every((perm) =>
      this.hasPermission(role, scopes, perm)
    );
  }

  /**
   * Get all permissions for a role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}
