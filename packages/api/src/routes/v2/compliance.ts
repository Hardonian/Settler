/**
 * Compliance API Routes
 *
 * REST API for compliance exports and edge agent management
 */

import { Router, Response } from "express";
import { complianceExportSystem } from "../../services/compliance/export-system";
import { EdgeAgent } from "../../services/privacy-preserving/edge-agent";
import { handleRouteError } from "../../utils/error-handler";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { authorizeTenantActionOr403, requireTenantContext } from "../authz-helpers";
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";

const router: Router = Router();
const COMPLIANCE_SURFACE = {
  key: "compliance_exports_v2",
  unavailableReason:
    "Compliance v2 is disabled until export state and privacy workflows are tenant-scoped and durably persisted.",
  previewReason:
    "Compliance v2 is running in local-only preview mode without tenant-scoped durable export storage.",
};

/**
 * POST /api/v2/compliance/exports
 * Create a compliance export
 */
router.post(
  "/exports",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;
    if (
      !(await authorizeTenantActionOr403(
        req,
        res,
        tenantId,
        "tenant.user.data.export",
        "Compliance export creation is not authorized"
      ))
    ) {
      return;
    }
    const capability = requireStrategicSurfaceAvailability(
      req,
      res,
      "/api/v2/compliance/exports",
      COMPLIANCE_SURFACE
    );
    if (!capability) return;
    const { jurisdiction, format } = req.body;

    if (!jurisdiction) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "jurisdiction is required",
      });
    }

    const export_ = await complianceExportSystem.createExport(
      tenantId,
      jurisdiction,
      format || "json"
    );

    res.status(201).json({
      data: export_,
      capability,
      metadata: buildStrategicSurfaceMetadata(req, capability),
      message: "Export created successfully",
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to create export", 400);
    return;
  }
});

/**
 * GET /api/v2/compliance/exports
 * List exports for customer
 */
router.get(
  "/exports",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;
    if (
      !(await authorizeTenantActionOr403(
        req,
        res,
        tenantId,
        "tenant.user.data.export",
        "Compliance export read is not authorized"
      ))
    ) {
      return;
    }
    const capability = requireStrategicSurfaceAvailability(
      req,
      res,
      "/api/v2/compliance/exports",
      COMPLIANCE_SURFACE
    );
    if (!capability) return;

    const exports = await complianceExportSystem.listExportsFromDb(tenantId);

    res.json({
      data: exports,
      capability,
      count: exports.length,
      metadata: buildStrategicSurfaceMetadata(req, capability),
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to list exports", 500);
    return;
  }
});

/**
 * GET /api/v2/compliance/exports/:id
 * Get export by ID
 */
router.get(
  "/exports/:id",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;
    if (
      !(await authorizeTenantActionOr403(
        req,
        res,
        tenantId,
        "tenant.user.data.export",
        "Compliance export read is not authorized"
      ))
    ) {
      return;
    }
    const capability = requireStrategicSurfaceAvailability(
      req,
      res,
      "/api/v2/compliance/exports/:id",
      COMPLIANCE_SURFACE
    );
    if (!capability) return;
    const idParam = req.params["id"];
    const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
    if (!id) {
      return res.status(400).json({ error: "Export ID is required" });
    }
    const export_ = await complianceExportSystem.getExportFromDb(id, tenantId);

    if (!export_) {
      return res.status(404).json({
        error: "Export not found",
        message: `Export ${id} not found`,
      });
    }

    if (export_.customerId !== tenantId) {
      return res.status(404).json({
        error: "Export not found",
        message: `Export ${id} not found`,
      });
    }

    res.json({
      data: export_,
      capability,
      metadata: buildStrategicSurfaceMetadata(req, capability),
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to get export", 500);
    return;
  }
});

/**
 * GET /api/v2/compliance/templates
 * Get available export templates
 */
router.get(
  "/templates",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;
    if (
      !(await authorizeTenantActionOr403(
        req,
        res,
        tenantId,
        "tenant.user.data.export",
        "Compliance export template read is not authorized"
      ))
    ) {
      return;
    }
    const capability = requireStrategicSurfaceAvailability(
      req,
      res,
      "/api/v2/compliance/templates",
      COMPLIANCE_SURFACE
    );
    if (!capability) return;
    const templates = complianceExportSystem.getTemplates();

    res.json({
      data: templates,
      capability,
      count: templates.length,
      metadata: buildStrategicSurfaceMetadata(req, capability),
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to get templates", 500);
    return;
  }
});

/**
 * POST /api/v2/compliance/edge/initialize
 * Initialize edge agent
 */
router.post(
  "/edge/initialize",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;
    if (
      !(await authorizeTenantActionOr403(
        req,
        res,
        tenantId,
        "tenant.integration.manage",
        "Compliance edge initialization is not authorized"
      ))
    ) {
      return;
    }
    const capability = requireStrategicSurfaceAvailability(
      req,
      res,
      "/api/v2/compliance/edge/initialize",
      COMPLIANCE_SURFACE
    );
    if (!capability) return;
    const { apiKey, cloudEndpoint, reconciliationRules, encryptionKey } = req.body;

    if (!apiKey || !cloudEndpoint || !reconciliationRules) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "apiKey, cloudEndpoint, and reconciliationRules are required",
      });
    }

    const edgeAgent = new EdgeAgent({
      customerId: tenantId,
      apiKey,
      cloudEndpoint: cloudEndpoint || "https://api.settler.io",
      reconciliationRules,
      encryptionKey,
    });

    await edgeAgent.initialize();

    res.json({
      data: {
        customerId: tenantId,
        initialized: true,
      },
      capability,
      metadata: buildStrategicSurfaceMetadata(req, capability),
      message: "Edge agent initialized successfully",
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to initialize edge agent", 400);
    return;
  }
});

export default router;
