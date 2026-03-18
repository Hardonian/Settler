/**
 * Custom Integrations API Routes
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { logError } from "../../utils/logger";
import {
  createCustomIntegration,
  getCustomIntegration,
  listCustomIntegrations,
  updateCustomIntegration,
} from "../../services/custom-integrations";

const router: Router = Router();

router.post("/", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
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
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
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
});

router.get("/:integrationId", async (req: AuthRequest, res: Response) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.tenantId!;

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
});

router.patch("/:integrationId", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const { integrationId } = req.params;
    const tenantId = req.tenantId!;
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
});

export default router;
