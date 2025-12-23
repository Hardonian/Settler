/**
 * Compliance API Routes
 * 
 * REST API for compliance exports and edge agent management
 */

import { Router, Response } from 'express';
import { complianceExportSystem } from '../../services/compliance/export-system';
import { EdgeAgent } from '../../services/privacy-preserving/edge-agent';
import { handleRouteError } from '../../utils/error-handler';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';

const router = Router();

/**
 * POST /api/v2/compliance/exports
 * Create a compliance export
 */
router.post('/exports', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const { jurisdiction, format } = req.body;

    if (!jurisdiction) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jurisdiction is required',
        traceId: req.traceId,
      });
    }

    const export_ = await complianceExportSystem.createExport(
      tenantId,
      userId,
      jurisdiction,
      format || 'json'
    );

    res.status(201).json({
      data: export_,
      message: 'Export created successfully',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to create export', 400);
    return;
  }
});

/**
 * GET /api/v2/compliance/exports
 * List exports for tenant
 */
router.get('/exports', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const exports = complianceExportSystem.listExports(tenantId);

    res.json({
      data: exports,
      count: exports.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to list exports', 500);
    return;
  }
});

/**
 * GET /api/v2/compliance/exports/:id
 * Get export by ID
 */
router.get('/exports/:id', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Export ID is required',
        traceId: req.traceId,
      });
    }
    const export_ = complianceExportSystem.getExport(id, tenantId);

    if (!export_) {
      return res.status(404).json({
        error: 'Export not found',
        message: `Export ${id} not found`,
      });
    }

    res.json({
      data: export_,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get export', 500);
    return;
  }
});

/**
 * GET /api/v2/compliance/templates
 * Get available export templates
 */
router.get('/templates', async (_req, res: Response) => {
  try {
    const templates = complianceExportSystem.getTemplates();

    res.json({
      data: templates,
      count: templates.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get templates', 500);
    return;
  }
});

/**
 * POST /api/v2/compliance/edge/initialize
 * Initialize edge agent
 */
router.post('/edge/initialize', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const { apiKey, cloudEndpoint, reconciliationRules, encryptionKey } = req.body;

    if (!apiKey || !cloudEndpoint || !reconciliationRules) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'apiKey, cloudEndpoint, and reconciliationRules are required',
        traceId: req.traceId,
      });
    }

    const edgeAgent = new EdgeAgent({
      tenantId,
      userId,
      customerId: tenantId, // For backward compatibility
      apiKey,
      cloudEndpoint: cloudEndpoint || 'https://api.settler.io',
      reconciliationRules,
      encryptionKey,
    });

    await edgeAgent.initialize();

    res.json({
      data: {
        tenantId,
        initialized: true,
      },
      message: 'Edge agent initialized successfully',
      traceId: req.traceId,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to initialize edge agent', 400);
    return;
  }
});

export default router;
