/**
 * Custom Integrations API Routes
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { logError } from "../../utils/logger";
import {
  getOpenFgaAuthorizationService,
  TenantAction,
} from "../../services/authz/openfga-authorization-service";
import {
  createCustomIntegration,
  getCustomIntegration,
  listCustomIntegrations,
  updateCustomIntegration,
} from "../../services/custom-integrations";

const router: Router = Router();

function tenantOr400(req: AuthRequest, res: Response): string | null {
  if (!req.tenantId) {
    res.status(400).json({
      error: "TENANT_CONTEXT_REQUIRED",
      message: "Tenant context is required",
      traceId: req.traceId,
    });
    return null;
  }
  return req.tenantId;
}

async function authorizeTenantActionOr403(
  req: AuthRequest,
  res: Response,
  tenantId: string,
  action: TenantAction
): Promise<boolean> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication required",
      reason: "missing_user_context",
      traceId: req.traceId,
    });
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
    message: "Tenant action is not authorized",
    reason: authz.reason,
    authz: {
      mode: authz.mode,
      degraded: authz.degraded,
      openfga: authz.openfga,
    },
    traceId: req.traceId,
  });
  return false;
}

router.post(
  "/",
  requirePermission(Permission.TENANT_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.integration.manage")))
        return;
      const { integrationName, integrationType, adapterConfig, whiteLabelConfig } = req.body;

      if (!integrationName || !integrationType || !adapterConfig) {
        return res.status(400).json({
          error: "Bad Request",
          message: "integrationName, integrationType, and adapterConfig are required",
          traceId: req.traceId,
        });
      }

      const integrationId = await createCustomIntegration(
        tenantId,
        integrationName,
        integrationType,
        adapterConfig,
        whiteLabelConfig
      );

      return res.status(201).json({ id: integrationId, traceId: req.traceId });
    } catch (error) {
      logError("Failed to create custom integration", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create custom integration",
        traceId: req.traceId,
      });
    }
  }
);

router.get(
  "/",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.integration.read")))
        return;
      const { isActive, integrationType } = req.query;

      const integrations = await listCustomIntegrations(tenantId, {
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        integrationType: integrationType as string | undefined,
      });

      return res.json({ data: integrations, traceId: req.traceId });
    } catch (error) {
      logError("Failed to list custom integrations", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to list custom integrations",
        traceId: req.traceId,
      });
    }
  }
);

router.get(
  "/:integrationId",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const integrationIdParam = req.params["integrationId"];
      const integrationId = Array.isArray(integrationIdParam)
        ? (integrationIdParam[0] ?? "")
        : (integrationIdParam ?? "");
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.integration.read")))
        return;

      if (!integrationId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "integrationId is required",
          traceId: req.traceId,
        });
      }

      const integration = await getCustomIntegration(tenantId, integrationId);

      if (!integration) {
        return res.status(404).json({
          error: "Not Found",
          message: "Custom integration not found",
          traceId: req.traceId,
        });
      }

      return res.json({ ...integration, traceId: req.traceId });
    } catch (error) {
      logError("Failed to get custom integration", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get custom integration",
        traceId: req.traceId,
      });
    }
  }
);

router.patch(
  "/:integrationId",
  requirePermission(Permission.TENANT_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const integrationIdParam2 = req.params["integrationId"];
      const integrationId = Array.isArray(integrationIdParam2)
        ? (integrationIdParam2[0] ?? "")
        : (integrationIdParam2 ?? "");
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.integration.manage")))
        return;
      const updates = req.body;

      if (!integrationId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "integrationId is required",
          traceId: req.traceId,
        });
      }

      await updateCustomIntegration(tenantId, integrationId, updates);

      return res.json({ message: "Integration updated", traceId: req.traceId });
    } catch (error) {
      logError("Failed to update custom integration", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update custom integration",
        traceId: req.traceId,
      });
    }
  }
);

export default router;
