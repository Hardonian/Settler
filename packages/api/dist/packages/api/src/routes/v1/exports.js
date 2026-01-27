"use strict";
/**
 * Export API Routes
 *
 * REST API endpoints for exporting reconciled data
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../../middleware/validation");
const authorization_1 = require("../../middleware/authorization");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const QuickBooksExporter_1 = require("../../application/export/QuickBooksExporter");
const CSVExporter_1 = require("../../application/export/CSVExporter");
const JSONExporter_1 = require("../../application/export/JSONExporter");
const api_response_1 = require("../../utils/api-response");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
// Validation schemas
const exportSchema = zod_1.z.object({
    body: zod_1.z.object({
        jobId: zod_1.z.string().uuid(),
        format: zod_1.z.enum(['quickbooks', 'csv', 'json']),
        dateRange: zod_1.z.object({
            start: zod_1.z.string().datetime(),
            end: zod_1.z.string().datetime(),
        }),
        options: zod_1.z.object({
            includeFees: zod_1.z.boolean().optional().default(true),
            includeUnmatched: zod_1.z.boolean().optional().default(false),
            includeRawPayloads: zod_1.z.boolean().optional().default(false),
            columns: zod_1.z.array(zod_1.z.string()).optional(), // For CSV
            glAccountMapping: zod_1.z.record(zod_1.z.string()).optional(), // For QuickBooks
        }).optional(),
    }),
});
/**
 * POST /api/v1/exports
 * Create export
 */
router.post('/', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_EXPORT), (0, validation_1.validateRequest)(exportSchema), async (req, res) => {
    try {
        const { jobId, format, dateRange, options = {} } = req.body;
        const tenantId = req.tenantId;
        let exportData;
        switch (format) {
            case 'quickbooks': {
                const exporter = new QuickBooksExporter_1.QuickBooksExporter();
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
                const exporter = new CSVExporter_1.CSVExporter();
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
                const exporter = new JSONExporter_1.JSONExporter();
                exportData = await exporter.exportToJSON(tenantId, jobId, {
                    dateRange: {
                        start: new Date(dateRange.start),
                        end: new Date(dateRange.end),
                    },
                    includeRawPayloads: options.includeRawPayloads ?? false,
                });
                res.setHeader('Content-Type', 'application/json');
                return (0, api_response_1.sendSuccess)(res, exportData);
            }
            default:
                return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', `Unsupported format: ${format}`);
        }
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to create export', 500);
    }
});
exports.default = router;
//# sourceMappingURL=exports.js.map