/**
 * Tenant Middleware
 * Extracts tenant context from request and sets it for RLS
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { ITenantRepository } from "../domain/repositories/ITenantRepository";
import { Container } from "../infrastructure/di/Container";
import { query } from "../db";
import { sendProblemJson } from "../utils/problem-json";
import { UserRole } from "../domain/entities/User";

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
    const tenantRepo = container.get<ITenantRepository>("ITenantRepository");
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
          sendProblemJson(req, res, {
            status: 401,
            title: "Unauthorized",
            detail: "Authenticated identity required when selecting tenant context",
            code: "TENANT_CONTEXT_AUTH_REQUIRED",
          });
          return;
        }

        const userResult = await query<{ tenant_id: string; role: UserRole }>(
          `SELECT tenant_id, role FROM users WHERE id = $1`,
          [req.userId]
        );

        if (userResult.length === 0 || !userResult[0]) {
          sendProblemJson(req, res, {
            status: 403,
            title: "Forbidden",
            detail: "User not found",
            code: "TENANT_CONTEXT_USER_NOT_FOUND",
          });
          return;
        }

        const user = userResult[0];
        const canImpersonateTenant = user.role === UserRole.OWNER || user.role === UserRole.ADMIN;

        if (tenantId !== user.tenant_id && !canImpersonateTenant) {
          sendProblemJson(req, res, {
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
      const userResult = await query<{ tenant_id: string }>(
        `SELECT tenant_id FROM users WHERE id = $1`,
        [req.userId]
      );
      if (userResult.length > 0 && userResult[0]) {
        tenant = await tenantRepo.findById(userResult[0].tenant_id);
      }
    }

    if (!tenant) {
      sendProblemJson(req, res, {
        status: 403,
        title: "Tenant context missing",
        detail: "Unable to determine tenant context",
        code: "TENANT_NOT_FOUND",
      });
      return;
    }

    // Check tenant status
    if (tenant.status === "suspended" || tenant.status === "cancelled") {
      sendProblemJson(req, res, {
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
  } catch (error) {
    next(error);
  }
}
