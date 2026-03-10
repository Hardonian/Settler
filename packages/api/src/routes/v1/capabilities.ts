import { Router, Response } from "express";
import { query } from "../../db";
import type { AuthRequest } from "../../middleware/auth";
import { UserRole } from "../../domain/entities/User";
import { Permission, PermissionChecker } from "../../infrastructure/security/Permissions";
import { getCapabilityRegistry } from "../../services/capabilities/registry";
import { observeCapabilityStatus } from "../../services/capabilities/telemetry";
import type { CapabilityStatus } from "../../services/capabilities/types";
import { handleRouteError } from "../../utils/error-handler";

const router: Router = Router();

const capabilityPermissionMap: Record<string, Permission[]> = {
  operator_intelligence: [Permission.ADMIN_READ],
  alert_routing: [Permission.ADMIN_READ],
  usage_metering: [Permission.ADMIN_READ],
  enterprise_analytics: [Permission.ADMIN_READ],
  enterprise_surface: [Permission.ADMIN_READ],
  support_intake: [Permission.USERS_READ],
};

async function resolveRequestPermissions(
  req: AuthRequest
): Promise<{ role: UserRole; scopes: string[] }> {
  const scopes: string[] = [];

  if (req.apiKeyId) {
    const apiKeyRows = await query<{ scopes: string[] | null }>(
      `SELECT scopes FROM api_keys WHERE id = $1`,
      [req.apiKeyId]
    );
    scopes.push(...(apiKeyRows[0]?.scopes ?? []));
  }

  if (!req.userId) {
    return { role: UserRole.VIEWER, scopes };
  }

  const userRows = await query<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [
    req.userId,
  ]);
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

router.get("/capabilities", async (_req, res) => {
  try {
    const registry = await getCapabilityRegistry();
    const data = registry.list();
    data.forEach((status) => observeCapabilityStatus(status, "/api/v1/capabilities"));
    res.json({ data });
  } catch (error) {
    return handleRouteError(res, error, "Failed to load capability registry", 500);
  }
});

router.get("/capabilities/projected", async (req: AuthRequest, res: Response) => {
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
      },
    });
  } catch (error) {
    return handleRouteError(res, error, "Failed to load projected capabilities", 500, {
      userId: req.userId,
      apiKeyId: req.apiKeyId,
    });
  }
});

export default router;
