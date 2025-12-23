/**
 * Dedicated Infrastructure API Routes
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { tenantMiddleware, TenantRequest } from "../../middleware/tenant";
import { featureGate } from "../../middleware/billing-gating";
import { logError } from "../../utils/logger";
import {
  provisionDedicatedInfrastructure,
  getDedicatedInfrastructure,
  listDedicatedInfrastructure,
  deprovisionDedicatedInfrastructure,
} from "../../services/dedicated-infrastructure";

const router = Router();

router.post("/", tenantMiddleware, featureGate("dedicated_infrastructure"), async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { infrastructureType, resourceConfig, isolationLevel, dataRetentionDays, securityConfig } =
      req.body;

    if (!infrastructureType || !resourceConfig) {
      return res.status(400).json({
        error: "Bad Request",
        message: "infrastructureType and resourceConfig are required",
        traceId: req.traceId,
      });
    }

    const infrastructureId = await provisionDedicatedInfrastructure(
      tenantId,
      infrastructureType,
      resourceConfig,
      {
        isolationLevel,
        dataRetentionDays,
        securityConfig,
      }
    );

    return res.status(201).json({ id: infrastructureId, traceId: req.traceId });
  } catch (error) {
    logError("Failed to provision dedicated infrastructure", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to provision dedicated infrastructure",
      traceId: req.traceId,
    });
  }
});

router.get("/", tenantMiddleware, featureGate("dedicated_infrastructure"), async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { isActive, infrastructureType } = req.query;

    const infrastructure = await listDedicatedInfrastructure(tenantId, {
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      infrastructureType: infrastructureType as string | undefined,
    });

    return res.json({ data: infrastructure, traceId: req.traceId });
  } catch (error) {
    logError("Failed to list dedicated infrastructure", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list dedicated infrastructure",
      traceId: req.traceId,
    });
  }
});

router.get("/:infrastructureId", tenantMiddleware, featureGate("dedicated_infrastructure"), async (req: TenantRequest, res: Response) => {
  try {
    const { infrastructureId } = req.params;
    const tenantId = req.tenantId!;

    if (!infrastructureId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "infrastructureId is required",
        traceId: req.traceId,
      });
    }

    const infrastructure = await getDedicatedInfrastructure(tenantId, infrastructureId);

    if (!infrastructure) {
      return res.status(404).json({
        error: "Not Found",
        message: "Dedicated infrastructure not found",
        traceId: req.traceId,
      });
    }

    return res.json({ ...infrastructure, traceId: req.traceId });
  } catch (error) {
    logError("Failed to get dedicated infrastructure", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get dedicated infrastructure",
      traceId: req.traceId,
    });
  }
});

router.delete("/:infrastructureId", tenantMiddleware, featureGate("dedicated_infrastructure"), async (req: TenantRequest, res: Response) => {
  try {
    const { infrastructureId } = req.params;
    const tenantId = req.tenantId!;

    if (!infrastructureId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "infrastructureId is required",
        traceId: req.traceId,
      });
    }

    await deprovisionDedicatedInfrastructure(tenantId, infrastructureId);

    return res.json({ message: "Infrastructure deprovisioned", traceId: req.traceId });
  } catch (error) {
    logError("Failed to deprovision dedicated infrastructure", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to deprovision dedicated infrastructure",
      traceId: req.traceId,
    });
  }
});

export default router;
