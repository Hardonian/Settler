/**
 * Role-Based Access Control (RBAC)
 * 
 * Defines user roles and permissions for the multi-tenant site builder.
 * Type-safe role checking and permission validation.
 */

/**
 * User roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_EDITOR = 'TENANT_EDITOR',
  USER = 'USER', // Default role
}

/**
 * Permissions for site builder operations
 */
export enum SiteBuilderPermission {
  // Tenant management
  VIEW_ALL_TENANTS = 'VIEW_ALL_TENANTS',
  CREATE_TENANT = 'CREATE_TENANT',
  UPDATE_ANY_TENANT = 'UPDATE_ANY_TENANT',
  DELETE_TENANT = 'DELETE_TENANT',
  
  // Tenant-specific operations
  VIEW_TENANT_CONFIG = 'VIEW_TENANT_CONFIG',
  UPDATE_TENANT_BRANDING = 'UPDATE_TENANT_BRANDING',
  UPDATE_TENANT_NAVIGATION = 'UPDATE_TENANT_NAVIGATION',
  
  // Page management
  CREATE_PAGE = 'CREATE_PAGE',
  UPDATE_PAGE = 'UPDATE_PAGE',
  DELETE_PAGE = 'DELETE_PAGE',
  PUBLISH_PAGE = 'PUBLISH_PAGE',
  VIEW_PAGE_REVISIONS = 'VIEW_PAGE_REVISIONS',
  REVERT_PAGE = 'REVERT_PAGE',
  
  // Experiments
  CREATE_EXPERIMENT = 'CREATE_EXPERIMENT',
  UPDATE_EXPERIMENT = 'UPDATE_EXPERIMENT',
  DELETE_EXPERIMENT = 'DELETE_EXPERIMENT',
  START_EXPERIMENT = 'START_EXPERIMENT',
  PAUSE_EXPERIMENT = 'PAUSE_EXPERIMENT',
  VIEW_EXPERIMENT_RESULTS = 'VIEW_EXPERIMENT_RESULTS',
  
  // Raw config access (super admin only)
  VIEW_RAW_CONFIG = 'VIEW_RAW_CONFIG',
  EDIT_RAW_CONFIG = 'EDIT_RAW_CONFIG',
  VALIDATE_CONFIG = 'VALIDATE_CONFIG',
}

/**
 * Role to permissions mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Set<SiteBuilderPermission>> = {
  [UserRole.SUPER_ADMIN]: new Set([
    // All permissions
    SiteBuilderPermission.VIEW_ALL_TENANTS,
    SiteBuilderPermission.CREATE_TENANT,
    SiteBuilderPermission.UPDATE_ANY_TENANT,
    SiteBuilderPermission.DELETE_TENANT,
    SiteBuilderPermission.VIEW_TENANT_CONFIG,
    SiteBuilderPermission.UPDATE_TENANT_BRANDING,
    SiteBuilderPermission.UPDATE_TENANT_NAVIGATION,
    SiteBuilderPermission.CREATE_PAGE,
    SiteBuilderPermission.UPDATE_PAGE,
    SiteBuilderPermission.DELETE_PAGE,
    SiteBuilderPermission.PUBLISH_PAGE,
    SiteBuilderPermission.VIEW_PAGE_REVISIONS,
    SiteBuilderPermission.REVERT_PAGE,
    SiteBuilderPermission.CREATE_EXPERIMENT,
    SiteBuilderPermission.UPDATE_EXPERIMENT,
    SiteBuilderPermission.DELETE_EXPERIMENT,
    SiteBuilderPermission.START_EXPERIMENT,
    SiteBuilderPermission.PAUSE_EXPERIMENT,
    SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS,
    SiteBuilderPermission.VIEW_RAW_CONFIG,
    SiteBuilderPermission.EDIT_RAW_CONFIG,
    SiteBuilderPermission.VALIDATE_CONFIG,
  ]),
  
  [UserRole.TENANT_ADMIN]: new Set([
    SiteBuilderPermission.VIEW_TENANT_CONFIG,
    SiteBuilderPermission.UPDATE_TENANT_BRANDING,
    SiteBuilderPermission.UPDATE_TENANT_NAVIGATION,
    SiteBuilderPermission.CREATE_PAGE,
    SiteBuilderPermission.UPDATE_PAGE,
    SiteBuilderPermission.DELETE_PAGE,
    SiteBuilderPermission.PUBLISH_PAGE,
    SiteBuilderPermission.VIEW_PAGE_REVISIONS,
    SiteBuilderPermission.REVERT_PAGE,
    SiteBuilderPermission.CREATE_EXPERIMENT,
    SiteBuilderPermission.UPDATE_EXPERIMENT,
    SiteBuilderPermission.DELETE_EXPERIMENT,
    SiteBuilderPermission.START_EXPERIMENT,
    SiteBuilderPermission.PAUSE_EXPERIMENT,
    SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS,
  ]),
  
  [UserRole.TENANT_EDITOR]: new Set([
    SiteBuilderPermission.VIEW_TENANT_CONFIG,
    SiteBuilderPermission.CREATE_PAGE,
    SiteBuilderPermission.UPDATE_PAGE,
    SiteBuilderPermission.VIEW_PAGE_REVISIONS,
    SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS,
  ]),
  
  [UserRole.USER]: new Set([]), // No site builder permissions
};

/**
 * Get user role for a tenant
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID (optional, for tenant-specific roles)
 * @returns User role
 */
export async function getUserRole(
  userId: string,
  tenantId?: string
): Promise<UserRole> {
  const { prisma } = await import('@/shared/db/prismaClient');
  
  // Check if user is super admin (stored in metadata or separate table)
  // For now, check if user has a special flag in billing account metadata
  const billingAccount = await prisma.billingAccount.findFirst({
    where: { userId },
  });
  
  const metadata = billingAccount?.metadata as Record<string, unknown> | undefined;
  if (metadata?.role === UserRole.SUPER_ADMIN) {
    return UserRole.SUPER_ADMIN;
  }
  
  // If tenantId provided, check tenant-specific role
  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        billingAccount: {
          where: { userId },
        },
      },
    });
    
    if (tenant?.billingAccount) {
      // Check if user is tenant admin (owner of billing account)
      if (tenant.billingAccount.userId === userId) {
        return UserRole.TENANT_ADMIN;
      }
      
      // Check tenant-specific role in metadata
      const tenantMetadata = tenant.metadata as Record<string, unknown> | undefined;
      const userRole = tenantMetadata?.userRoles as Record<string, string> | undefined;
      if (userRole?.[userId] === UserRole.TENANT_EDITOR) {
        return UserRole.TENANT_EDITOR;
      }
    }
  }
  
  return UserRole.USER;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: SiteBuilderPermission,
  tenantId?: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.has(permission);
}

/**
 * Check if user can access a tenant
 */
export async function canAccessTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  
  // Super admin can access any tenant
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Tenant admin/editor can access their tenant
  if (role === UserRole.TENANT_ADMIN || role === UserRole.TENANT_EDITOR) {
    return true;
  }
  
  return false;
}

/**
 * Require permission or throw error
 */
export async function requirePermission(
  userId: string,
  permission: SiteBuilderPermission,
  tenantId?: string
): Promise<void> {
  const has = await hasPermission(userId, permission, tenantId);
  if (!has) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
