import { Router, Response } from "express";
import { queryWithTenant } from "../../db";
import type { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { UserRole } from "../../domain/entities/User";
import { Permission, PermissionChecker } from "../../infrastructure/security/Permissions";
import { getCapabilityRegistry } from "../../services/capabilities/registry";
import { observeCapabilityStatus } from "../../services/capabilities/telemetry";
import type { CapabilityStatus } from "../../services/capabilities/types";
import { handleRouteError } from "../../utils/error-handler";
import { requireTenantContext } from "../authz-helpers";

const router: Router = Router();

const capabilityPermissionMap: Record<string, Permission[]> = {
  operator_intelligence: [Permission.ADMIN_READ],
  alert_routing: [Permission.ADMIN_READ],
  usage_metering: [Permission.ADMIN_READ],
  enterprise_analytics: [Permission.ADMIN_READ],
  enterprise_surface: [Permission.ADMIN_READ],
  support_intake: [Permission.USERS_READ],
  rate_limiting_guard: [Permission.USERS_READ],
  webhook_replay_guard: [Permission.USERS_READ],
};

async function resolveRequestPermissions(
  req: AuthRequest
): Promise<{ role: UserRole; scopes: string[] }> {
  const scopes: string[] = [];
  const tenantId = req.tenantId;

  if (req.apiKeyId && tenantId) {
    const apiKeyRows = await queryWithTenant<{ scopes: string[] | null }>(
      tenantId,
      `SELECT scopes FROM api_keys WHERE id = $1 AND tenant_id = $2`,
      [req.apiKeyId, tenantId]
    );
    scopes.push(...(apiKeyRows[0]?.scopes ?? []));
  }

  if (!req.userId || !tenantId) {
    return { role: UserRole.VIEWER, scopes };
  }

  const userRows = await queryWithTenant<{ role: string }>(
    tenantId,
    `SELECT role FROM users WHERE id = $1 AND tenant_id = $2`,
    [req.userId, tenantId]
  );
  const roleValue = userRows[0]?.role;
  const role = Object.values(UserRole).includes(roleValue as UserRole)
    ? (roleValue as UserRole)
    : UserRole.VIEWER;

  return { role, scopes };
}

function isCapabilityVisible(status: CapabilityStatus, role: UserRole, scopes: string[]): boolean {
  const requiredPermissions = capabilityPermissionMap[status.key] ?? [Permission.USERS_READ];
  return PermissionChecker.hasAnyPermission(role, scopes, requiredPermissions);
}

router.get(
  "/capabilities",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res) => {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;

    try {
      const registry = await getCapabilityRegistry();
      const data = registry.list();
      data.forEach((status) => observeCapabilityStatus(status, "/api/v1/capabilities"));
      res.json({
        data,
        metadata: { tenantId },
      });
    } catch (error) {
      return handleRouteError(res, error, "Failed to load capability registry", 500);
    }
  }
);

router.get(
  "/capabilities/projected",
  requirePermission(Permission.USERS_READ),
  async (req: AuthRequest, res: Response) => {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;

    try {
      const registry = await getCapabilityRegistry();
      const { role, scopes } = await resolveRequestPermissions(req);
      const projected = registry
        .list()
        .filter((status) => isCapabilityVisible(status, role, scopes))
        .map((status) => ({ ...status, visible: true }));

      projected.forEach((status) =>
        observeCapabilityStatus(status, "/api/v1/capabilities/projected")
      );

      res.json({
        data: projected,
        metadata: {
          role,
          scopeCount: scopes.length,
          tenantId,
        },
      });
    } catch (error) {
      return handleRouteError(res, error, "Failed to load projected capabilities", 500, {
        userId: req.userId,
        apiKeyId: req.apiKeyId,
      });
    }
  }
);

export default router;
