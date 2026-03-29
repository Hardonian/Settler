import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getOpenFgaAuthorizationService,
  TenantAction,
} from "../services/authz/openfga-authorization-service";

export function requireTenantContext(req: AuthRequest, res: Response): string | null {
  if (req.tenantId) {
    return req.tenantId;
  }

  res.status(400).json({
    error: "TENANT_CONTEXT_REQUIRED",
    message: "Tenant context is required",
    reason: "missing_tenant_context",
    traceId: req.traceId,
  });
  return null;
}

export function requireUserContext(req: AuthRequest, res: Response): string | null {
  if (req.userId) {
    return req.userId;
  }

  res.status(401).json({
    error: "UNAUTHORIZED",
    message: "Authentication required",
    reason: "missing_user_context",
    traceId: req.traceId,
  });
  return null;
}

export async function authorizeTenantActionOr403(
  req: AuthRequest,
  res: Response,
  tenantId: string,
  action: TenantAction,
  message = "Tenant action is not authorized"
): Promise<boolean> {
  const userId = requireUserContext(req, res);
  if (!userId) {
    return false;
  }

  const authz = await getOpenFgaAuthorizationService().authorizeTenantAction(
    userId,
    tenantId,
    action
  );
  if (authz.allowed) {
    return true;
  }

  res.status(403).json({
    error: "FORBIDDEN",
    message,
    reason: authz.reason ?? "forbidden",
    authz: {
      mode: authz.mode,
      degraded: authz.degraded,
      provider: "openfga",
      required: process.env.OPENFGA_REQUIRED === "true",
      openfga: authz.openfga,
    },
    traceId: req.traceId,
  });
  return false;
}
