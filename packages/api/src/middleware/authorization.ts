/**
 * Authorization Middleware
 * Enforces least privilege access control
 */

import { Response, NextFunction } from "express";
import { TenantRequest } from "./tenant";
import { Permission, PermissionChecker } from "../infrastructure/security/Permissions";
import { UserRole } from "../domain/entities/User";
import { query } from "../db";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { getOpenFgaAuthorizationService } from "../services/authz/openfga-authorization-service";
import { prisma } from "../infrastructure/db/prisma";

export interface AuthorizedRequest extends TenantRequest {
  permissions?: Permission[];
}

// Export UserRole as Role for backward compatibility
export { UserRole as Role };

const userRepository = new UserRepository();

async function resolveUserRoleAndScopes(
  userId: string,
  tenantId: string,
  apiKeyId?: string
): Promise<{ role: UserRole; scopes: string[] } | null> {
  try {
    const user = await userRepository.findById(userId, tenantId);
    if (user) {
      let scopes: string[] = [];
      if (apiKeyId) {
        const keyRows = await query<{ scopes: string[] }>(
          `SELECT scopes FROM api_keys WHERE id = $1 AND user_id = $2`,
          [apiKeyId, userId]
        ).catch(() => []);
        scopes = keyRows[0]?.scopes || [];
      }
      return { role: user.role, scopes };
    }
  } catch {
    // fallback to SQL below
  }

  const user = await query<{ role: UserRole; scopes: string[] }>(
    `SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
     FROM users u
     LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
     WHERE u.id = $1 AND u.tenant_id = $3`,
    [userId, apiKeyId || null, tenantId]
  ).catch(() => []);

  if (user.length === 0 || !user[0]) {
    return null;
  }
  return user[0];
}

/**
 * Require specific permission(s) or OpenFGA relation on an objectType.
 * Supported signatures:
 * - requirePermission(relation: string, objectType: string)
 * - requirePermission(...permissions: Permission[])
 */
export function requirePermission(
  relationOrPermission: Permission | string,
  objectTypeOrPermission?: string | Permission,
  ...restPermissions: Permission[]
) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId || !req.tenantId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
        return;
      }

      const userRecord = await resolveUserRoleAndScopes(req.userId, req.tenantId, req.apiKeyId);
      if (!userRecord) {
        res.status(403).json({
          error: "Forbidden",
          message: "User not found",
        });
        return;
      }

      const { role, scopes } = userRecord;

      const isRelationFga =
        typeof relationOrPermission === "string" &&
        !Object.values(Permission).includes(relationOrPermission as Permission) &&
        (typeof objectTypeOrPermission === "string" || objectTypeOrPermission === undefined);

      let allowed = false;

      if (isRelationFga) {
        const relation = relationOrPermission as string;
        const objectType = (objectTypeOrPermission as string) || "tenant";
        const fgaService = getOpenFgaAuthorizationService();

        if (process.env.OPENFGA_ENABLED === "true" && process.env.OPENFGA_API_URL) {
          const authResult = await fgaService.authorizeTenantAction(
            req.userId,
            req.tenantId,
            `${objectType}.${relation}` as any
          );
          allowed = authResult.allowed;
        } else {
          // Deterministic local RBAC/ABAC policy evaluator fallback (offline / no-Argon mode)
          if (role === UserRole.OWNER) {
            allowed = true;
          } else if (role === UserRole.ADMIN) {
            allowed = relation !== "can_delete_tenant";
          } else if (role === UserRole.DEVELOPER) {
            allowed =
              relation.startsWith("can_view") ||
              relation.startsWith("can_read") ||
              relation.startsWith("can_execute") ||
              relation.startsWith("read");
          } else if (role === UserRole.VIEWER) {
            allowed =
              relation.startsWith("can_view") ||
              relation.startsWith("can_read") ||
              relation.startsWith("read");
          }
        }
      } else {
        const requiredPermissions: Permission[] = [
          relationOrPermission as Permission,
          ...(objectTypeOrPermission &&
          Object.values(Permission).includes(objectTypeOrPermission as Permission)
            ? [objectTypeOrPermission as Permission]
            : []),
          ...restPermissions,
        ];

        allowed = PermissionChecker.hasAllPermissions(role, scopes, requiredPermissions);
      }

      if (!allowed) {
        await prisma.auditLog
          .create({
            data: {
              tenantId: req.tenantId,
              userId: req.userId,
              action: "unauthorized_access",
              resourceType: isRelationFga
                ? String(objectTypeOrPermission || "tenant")
                : "permission",
              ipAddress: req.ip || null,
              userAgent: (req.headers["user-agent"] as string) || null,
              metadata: {
                path: req.path,
                required: isRelationFga
                  ? { relation: relationOrPermission, objectType: objectTypeOrPermission }
                  : {
                      requiredPermissions: [
                        relationOrPermission,
                        objectTypeOrPermission,
                        ...restPermissions,
                      ].filter((p): p is Permission => Boolean(p)),
                    },
              } as any,
            },
          })
          .catch(() => null);

        res.status(403).json({
          error: "Forbidden",
          message: "Insufficient permissions",
          required: isRelationFga
            ? `${relationOrPermission} on ${objectTypeOrPermission || "tenant"}`
            : relationOrPermission,
        });
        return;
      }

      req.permissions = PermissionChecker.getPermissionsForRole(role);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId || !req.tenantId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
        return;
      }

      const user = await query<{ role: UserRole; scopes: string[] }>(
        `SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`,
        [req.userId, req.apiKeyId || null, req.tenantId]
      );

      if (user.length === 0 || !user[0]) {
        res.status(403).json({
          error: "Forbidden",
          message: "User not found",
        });
        return;
      }

      const userRecord = user[0];
      const { role, scopes } = userRecord;

      const hasPermission = PermissionChecker.hasAnyPermission(role, scopes, permissions);

      if (!hasPermission) {
        await query(
          `INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            "unauthorized_access",
            req.userId,
            req.tenantId,
            req.ip || null,
            req.headers["user-agent"] || null,
            req.path,
            JSON.stringify({ requiredPermissions: permissions }),
          ]
        );

        res.status(403).json({
          error: "Forbidden",
          message: "Insufficient permissions",
        });
        return;
      }

      req.permissions = PermissionChecker.getPermissionsForRole(role);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require resource ownership
 * Ensures the user owns the resource they're trying to access
 * Can be used as middleware or called directly with a callback
 */
export function requireResourceOwnership(
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction | ((err?: unknown) => void),
  resourceType: string,
  resourceId: string
): void {
  (async () => {
    try {
      if (!req.userId || !req.tenantId) {
        const error = { error: "Unauthorized", message: "Authentication required" };
        if (typeof next === "function" && next.length === 1) {
          // Callback pattern
          (next as (err?: unknown) => void)(error);
        } else {
          // Middleware pattern
          res.status(401).json(error);
        }
        return;
      }

      // Check resource ownership based on type
      let owned = false;

      switch (resourceType) {
        case "job": {
          const result = await query<{ id: string }>(
            `SELECT id FROM jobs 
             WHERE id = $1 AND tenant_id = $2`,
            [resourceId, req.tenantId]
          );
          owned = result.length > 0;
          break;
        }
        case "webhook": {
          const result = await query<{ id: string }>(
            `SELECT id FROM webhooks 
             WHERE id = $1 AND tenant_id = $2`,
            [resourceId, req.tenantId]
          );
          owned = result.length > 0;
          break;
        }
        case "export": {
          const result = await query<{ id: string }>(
            `SELECT id FROM exports 
             WHERE id = $1 AND tenant_id = $2`,
            [resourceId, req.tenantId]
          );
          owned = result.length > 0;
          break;
        }
        case "audit_log": {
          const result = await query<{ id: string }>(
            `SELECT id FROM audit_logs 
             WHERE id = $1 AND tenant_id = $2`,
            [resourceId, req.tenantId]
          );
          owned = result.length > 0;
          break;
        }
        default: {
          // Fail-closed for unknown types unless user is OWNER
          const user = await query<{ role: UserRole }>(
            `SELECT role FROM users WHERE id = $1 AND tenant_id = $2`,
            [req.userId, req.tenantId]
          );
          if (user.length > 0 && user[0]) {
            owned = user[0].role === UserRole.OWNER;
          }
          break;
        }
      }

      if (!owned) {
        const error = { error: "Forbidden", message: "Resource not found or access denied" };
        if (typeof next === "function" && next.length === 1) {
          // Callback pattern
          (next as (err?: unknown) => void)(error);
        } else {
          // Middleware pattern
          res.status(403).json(error);
        }
        return;
      }

      // Success - call next
      if (typeof next === "function" && next.length === 1) {
        // Callback pattern
        (next as (err?: unknown) => void)();
      } else {
        // Middleware pattern
        (next as NextFunction)();
      }
    } catch (error) {
      if (typeof next === "function" && next.length === 1) {
        // Callback pattern
        (next as (err?: unknown) => void)(error);
      } else {
        // Middleware pattern
        (next as NextFunction)(error);
      }
    }
  })();
}
