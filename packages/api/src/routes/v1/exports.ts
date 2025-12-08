/**
 * Export API Routes
 * 
 * REST API endpoints for exporting reconciled data
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation';
import { AuthRequest } from '../../middleware/auth';
import { requirePermission } from '../../middleware/authorization';
import { Permission } from '../../infrastructure/security/Permissions';
import { QuickBooksExporter } from '../../application/export/QuickBooksExporter';
import { CSVExporter } from '../../application/export/CSVExporter';
import { JSONExporter } from '../../application/export/JSONExporter';
import { sendSuccess, sendError } from '../../utils/api-response';
import { handleRouteError } from '../../utils/error-handler';

const router = Router();

// Validation schemas
const exportSchema = z.object({
  body: z.object({
    jobId: z.string().uuid(),
    format: z.enum(['quickbooks', 'csv', 'json']),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    options: z.object({
      includeFees: z.boolean().optional().default(true),
      includeUnmatched: z.boolean().optional().default(false),
      includeRawPayloads: z.boolean().optional().default(false),
      columns: z.array(z.string()).optional(), // For CSV
      glAccountMapping: z.record(z.string()).optional(), // For QuickBooks
    }).optional(),
  }),
});

/**
 * POST /api/v1/exports
 * Create export
 */
router.post(
  '/',
  requirePermission(Permission.REPORTS_EXPORT),
  validateRequest(exportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId, format, dateRange, options = {} } = req.body;
      const tenantId = req.tenantId!;

      let exportData: string | object;

      switch (format) {
        case 'quickbooks': {
          const exporter = new QuickBooksExporter();
          exportData = await exporter.exportToCSV(tenantId, jobId, {
            dateRange: {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            },
            includeFees: options.includeFees ?? true,
            includeUnmatched: options.includeUnmatched ?? false,
            glAccountMapping: options.glAccountMapping,
          });
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="quickbooks-export-${Date.now()}.csv"`);
          return res.send(exportData);
        }

        case 'csv': {
          const exporter = new CSVExporter();
          exportData = await exporter.exportToCSV(tenantId, jobId, {
            dateRange: {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            },
            columns: options.columns || exporter.getDefaultColumns(),
            includeFees: options.includeFees ?? true,
            includeUnmatched: options.includeUnmatched ?? false,
          });
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`);
          return res.send(exportData);
        }

        case 'json': {
          const exporter = new JSONExporter();
          exportData = await exporter.exportToJSON(tenantId, jobId, {
            dateRange: {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            },
            includeRawPayloads: options.includeRawPayloads ?? false,
          } as any);
          res.setHeader('Content-Type', 'application/json');
          return sendSuccess(res, exportData);
        }

        default:
          return sendError(res, 400, 'BAD_REQUEST', `Unsupported format: ${format}`);
      }
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create export', 500);
    }
  }
);

export default router;
