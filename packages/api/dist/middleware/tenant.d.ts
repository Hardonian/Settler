/**
 * Tenant Middleware
 * Extracts tenant context from request and sets it for RLS
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export interface TenantRequest extends AuthRequest {
    tenantId?: string;
    tenant?: {
        id: string;
        name: string;
        slug: string;
        status: string;
        tier: string;
    };
}
/**
 * Extract tenant from request
 * Priority: custom domain > subdomain > header > user's tenant
 */
export declare function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=tenant.d.ts.map