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

type TenantAccessSource =
  | "direct_user_tenant"
  | "super_admin"
  | "tenant_users"
  | "memberships"
  | "tenant_memberships"
  | "user_not_found"
  | "no_membership";

/**
 * Determines which tenant-access tables exist in the database.
 *
 * SECURITY NOTE: This probes the schema ONCE at startup and caches the result.
 * The previous implementation queried information_schema on every request, which
 * meant a schema migration could silently alter the auth model. This cached
 * approach ensures consistent behavior within a process lifecycle.
 *
 * The canonical tenant access lookup path is:
 *   1. Direct user.tenant_id match
 *   2. Super admin bypass
 *   3. tenant_users table (if exists)
 *   4. memberships table (if exists)
 *   5. tenant_memberships table (if exists)
 */
let cachedTenantAccessTables: Set<string> | null = null;

async function listTenantAccessTables(): Promise<Set<string>> {
  if (cachedTenantAccessTables) {
    return cachedTenantAccessTables;
  }

  const rows = await query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [["tenant_users", "memberships", "tenant_memberships"]]
  );

  cachedTenantAccessTables = new Set(rows.map((row) => row.table_name));
  return cachedTenantAccessTables;
}

async function hasSuperAdminAccess(userId: string, targetTenantId: string): Promise<boolean> {
  const rows = await query<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM auth.users
        WHERE id = $1
          AND (
            COALESCE(is_super_admin, false) = true
            OR COALESCE(raw_app_meta_data ->> 'role', '') = 'SUPER_ADMIN'
          )
     ) AS allowed`,
    [userId]
  );

  const isAllowed = rows[0]?.allowed === true;

  if (isAllowed) {
    try {
      await query(
        `INSERT INTO super_admin_audit_logs (user_id, action, tenant_id_accessed, metadata) 
         VALUES ($1, $2, $3, $4)`,
        [
          userId,
          "Cross-tenant bypass via super admin",
          targetTenantId,
          JSON.stringify({ via: "tenant_middleware" }),
        ]
      );
    } catch (e) {
      logError("Failed to log super admin access: " + e);
    }
  }

  return isAllowed;
}

async function resolveTenantAccess(
  userId: string,
  tenantId: string
): Promise<{ allowed: boolean; source: TenantAccessSource }> {
  const userRows = await query<{ tenant_id: string }>(`SELECT tenant_id FROM users WHERE id = $1`, [
    userId,
  ]);

  if (userRows.length === 0 || !userRows[0]) {
    return { allowed: false, source: "user_not_found" };
  }

  if (userRows[0].tenant_id === tenantId) {
    return { allowed: true, source: "direct_user_tenant" };
  }

  if (await hasSuperAdminAccess(userId, tenantId)) {
    return { allowed: true, source: "super_admin" };
  }

  const availableTables = await listTenantAccessTables();

  if (availableTables.has("tenant_users")) {
    const rows = await query<{ allowed: boolean }>(
      `SELECT EXISTS (
         SELECT 1
           FROM tenant_users
          WHERE tenant_id = $1
            AND user_id = $2
       ) AS allowed`,
      [tenantId, userId]
    );
    if (rows[0]?.allowed === true) {
      return { allowed: true, source: "tenant_users" };
    }
  }

  if (availableTables.has("memberships")) {
    const rows = await query<{ allowed: boolean }>(
      `SELECT EXISTS (
         SELECT 1
           FROM memberships
          WHERE tenant_id = $1
            AND user_id = $2
            AND COALESCE(status, 'active') IN ('active', 'accepted')
       ) AS allowed`,
      [tenantId, userId]
    );
    if (rows[0]?.allowed === true) {
      return { allowed: true, source: "memberships" };
    }
  }

  if (availableTables.has("tenant_memberships")) {
    const rows = await query<{ allowed: boolean }>(
      `SELECT EXISTS (
         SELECT 1
           FROM tenant_memberships
          WHERE tenant_id = $1
            AND user_id = $2
       ) AS allowed`,
      [tenantId, userId]
    );
    if (rows[0]?.allowed === true) {
      return { allowed: true, source: "tenant_memberships" };
    }
  }

  return { allowed: false, source: "no_membership" };
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

    if (req.userId) {
      const access = await resolveTenantAccess(req.userId, tenant.id);
      if (!access.allowed) {
        sendProblemJson(req, res, {
          status: 403,
          title: "Forbidden",
          detail:
            access.source === "user_not_found"
              ? "Authenticated user could not be resolved for tenant access"
              : "Authenticated identity does not have access to the requested tenant context",
          code:
            access.source === "user_not_found"
              ? "TENANT_CONTEXT_USER_NOT_FOUND"
              : "TENANT_CONTEXT_FORBIDDEN",
          extra: {
            requested_tenant_id: tenant.id,
            access_source: access.source,
          },
        });
        return;
      }
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
