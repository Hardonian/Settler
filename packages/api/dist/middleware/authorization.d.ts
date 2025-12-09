/**
 * Authorization Middleware
 * Enforces least privilege access control
 */
import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant';
import { Permission } from '../infrastructure/security/Permissions';
import { UserRole } from '../domain/entities/User';
export interface AuthorizedRequest extends TenantRequest {
    permissions?: Permission[];
}
export { UserRole as Role };
/**
 * Require specific permission(s)
 */
export declare function requirePermission(...permissions: Permission[]): (req: AuthorizedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require any of the specified permissions
 */
export declare function requireAnyPermission(...permissions: Permission[]): (req: AuthorizedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require resource ownership
 * Ensures the user owns the resource they're trying to access
 * Can be used as middleware or called directly with a callback
 */
export declare function requireResourceOwnership(req: AuthorizedRequest, res: Response, next: NextFunction | ((err?: unknown) => void), resourceType: string, resourceId: string): void;
//# sourceMappingURL=authorization.d.ts.map