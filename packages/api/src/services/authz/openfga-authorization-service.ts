import { query } from "../../db";
import { UserRole } from "../../domain/entities/User";
import { logWarn } from "../../utils/logger";

export type OpenFgaAuthzState =
  | "disabled"
  | "unconfigured"
  | "available"
  | "degraded"
  | "unavailable";

export interface OpenFgaCheckResult {
  state: OpenFgaAuthzState;
  allowed: boolean;
  reason?: string;
}

interface OpenFgaConfig {
  enabled: boolean;
  required: boolean;
  apiUrl?: string;
  storeId?: string;
  modelId?: string;
}

export interface TenantActionAuthorization {
  allowed: boolean;
  reason?: string;
  degraded: boolean;
  mode: "local_rbac" | "openfga" | "fail_closed";
  openfga: OpenFgaCheckResult;
}

function readConfig(): OpenFgaConfig {
  const enabled = process.env.OPENFGA_ENABLED === "true";
  const required = process.env.OPENFGA_REQUIRED === "true";
  return {
    enabled,
    required,
    apiUrl: process.env.OPENFGA_API_URL,
    storeId: process.env.OPENFGA_STORE_ID,
    modelId: process.env.OPENFGA_AUTHORIZATION_MODEL_ID,
  };
}

function buildTenantObject(tenantId: string): string {
  return `tenant:${tenantId}`;
}

async function checkWithOpenFga(
  userId: string,
  relation: string,
  tenantId: string
): Promise<OpenFgaCheckResult> {
  const config = readConfig();

  if (!config.enabled) {
    return {
      state: "disabled",
      allowed: false,
      reason: "openfga_disabled",
    };
  }

  if (!config.apiUrl || !config.storeId || !config.modelId) {
    return {
      state: "unconfigured",
      allowed: false,
      reason: "openfga_unconfigured",
    };
  }

  try {
    const response = await fetch(`${config.apiUrl}/stores/${config.storeId}/check`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tuple_key: {
          user: `user:${userId}`,
          relation,
          object: buildTenantObject(tenantId),
        },
        authorization_model_id: config.modelId,
      }),
    });

    if (!response.ok) {
      return {
        state: "degraded",
        allowed: false,
        reason: `openfga_http_${response.status}`,
      };
    }

    const payload = (await response.json()) as { allowed?: boolean };
    return {
      state: "available",
      allowed: payload.allowed === true,
      reason: payload.allowed === true ? undefined : "openfga_denied",
    };
  } catch (error) {
    return {
      state: "unavailable",
      allowed: false,
      reason: error instanceof Error ? error.message : "openfga_unknown_error",
    };
  }
}

async function getTenantUserRole(userId: string, tenantId: string): Promise<UserRole | null> {
  const rows = await query<{ role: UserRole }>(
    `SELECT role FROM users WHERE id = $1 AND tenant_id = $2`,
    [userId, tenantId]
  );

  return rows[0]?.role ?? null;
}

function relationForAction(action: "tenant.data.export" | "tenant.data.delete"): string {
  if (action === "tenant.data.delete") {
    return "can_delete";
  }

  return "can_export";
}

function localRoleAllowed(
  action: "tenant.data.export" | "tenant.data.delete",
  role: UserRole | null
): boolean {
  if (!role) {
    return false;
  }

  if (action === "tenant.data.delete") {
    return role === UserRole.OWNER;
  }

  return role === UserRole.OWNER || role === UserRole.ADMIN;
}

export class OpenFgaAuthorizationService {
  async authorizeTenantAction(
    userId: string,
    tenantId: string,
    action: "tenant.data.export" | "tenant.data.delete"
  ): Promise<TenantActionAuthorization> {
    const role = await getTenantUserRole(userId, tenantId);
    const localAllowed = localRoleAllowed(action, role);

    if (!localAllowed) {
      return {
        allowed: false,
        reason: "insufficient_local_role",
        degraded: false,
        mode: "local_rbac",
        openfga: { state: "disabled", allowed: false, reason: "local_role_denied" },
      };
    }

    const config = readConfig();
    const openfga = await checkWithOpenFga(userId, relationForAction(action), tenantId);

    if (!config.enabled) {
      return {
        allowed: true,
        degraded: false,
        mode: "local_rbac",
        openfga,
      };
    }

    if (openfga.state === "available") {
      return {
        allowed: openfga.allowed,
        reason: openfga.allowed ? undefined : "openfga_denied",
        degraded: false,
        mode: "openfga",
        openfga,
      };
    }

    if (config.required) {
      logWarn("OpenFGA required but unavailable; failing closed", {
        tenantId,
        userId,
        action,
        openfgaState: openfga.state,
        openfgaReason: openfga.reason,
      });
      return {
        allowed: false,
        reason: "openfga_required_unavailable",
        degraded: true,
        mode: "fail_closed",
        openfga,
      };
    }

    return {
      allowed: true,
      reason: "openfga_degraded_fallback_local_rbac",
      degraded: true,
      mode: "local_rbac",
      openfga,
    };
  }

  async status(): Promise<{
    key: string;
    state: OpenFgaAuthzState;
    available: boolean;
    reason?: string;
  }> {
    const config = readConfig();

    if (!config.enabled) {
      return {
        key: "openfga_authorization",
        state: "disabled",
        available: false,
        reason: "openfga_disabled",
      };
    }

    if (!config.apiUrl || !config.storeId || !config.modelId) {
      return {
        key: "openfga_authorization",
        state: "unconfigured",
        available: false,
        reason: "openfga_unconfigured",
      };
    }

    const probe = await checkWithOpenFga("health-probe", "can_view", "health");
    return {
      key: "openfga_authorization",
      state: probe.state,
      available: probe.state === "available",
      reason: probe.reason,
    };
  }
}

let service: OpenFgaAuthorizationService | null = null;

export function getOpenFgaAuthorizationService(): OpenFgaAuthorizationService {
  if (!service) {
    service = new OpenFgaAuthorizationService();
  }

  return service;
}
