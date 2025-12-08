/**
 * Tenant Middleware
 * Extracts tenant context from request and sets it for RLS
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ITenantRepository } from '../domain/repositories/ITenantRepository';
import { Container } from '../infrastructure/di/Container';
import { query } from '../db';

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
export async function tenantMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const container = Container.getInstance();
    const tenantRepo = container.get<ITenantRepository>('ITenantRepository');
    let tenant = null;

    // 1. Check custom domain
    const host = req.get('host') || '';
    if (host) {
      tenant = await tenantRepo.findByCustomDomain(host);
    }

    // 2. Check subdomain (e.g., tenant-slug.api.settler.io)
    if (!tenant && host.includes('.')) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
        tenant = await tenantRepo.findBySlug(subdomain);
      }
    }

    // 3. Check X-Tenant-ID header
    if (!tenant) {
      const tenantId = req.get('X-Tenant-ID');
      if (tenantId) {
        tenant = await tenantRepo.findById(tenantId);
      }
    }

    // 4. Fall back to user's tenantId from auth middleware
    if (!tenant && req.userId) {
      // Try to get tenant from user
      const userResult = await query<{ tenant_id: string }>(
        `SELECT tenant_id FROM users WHERE id = $1`,
        [req.userId]
      );
      if (userResult.length > 0 && userResult[0]) {
        tenant = await tenantRepo.findById(userResult[0].tenant_id);
      }
    }

    if (!tenant) {
      res.status(403).json({
        error: 'TenantNotFound',
        message: 'Unable to determine tenant context',
      });
      return;
    }

    // Check tenant status
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      res.status(403).json({
        error: 'TenantSuspended',
        message: 'Tenant account is suspended or cancelled',
      });
      return;
    }

    req.tenantId = tenant.id;
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}
