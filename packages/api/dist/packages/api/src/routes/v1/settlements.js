"use strict";
/**
 * Settlements API Routes
 *
 * REST API endpoints for settlement management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../../middleware/validation");
const authorization_1 = require("../../middleware/authorization");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const db_1 = require("../../db");
const api_response_1 = require("../../utils/api-response");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
// Validation schemas
const getSettlementsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
        provider: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
const getSettlementSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * GET /api/v1/settlements
 * List settlements with filtering and pagination
 */
router.get('/', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getSettlementsSchema), async (req, res) => {
    try {
        const queryParams = getSettlementsSchema.parse({ query: req.query });
        const { page, limit, provider, status, startDate, endDate } = queryParams.query;
        const tenantId = req.tenantId;
        const offset = (page - 1) * limit;
        let whereClause = 'tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;
        if (provider) {
            whereClause += ` AND provider = $${paramIndex}`;
            params.push(provider);
            paramIndex++;
        }
        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (startDate) {
            whereClause += ` AND settlement_date >= $${paramIndex}`;
            params.push(new Date(startDate).toISOString());
            paramIndex++;
        }
        if (endDate) {
            whereClause += ` AND settlement_date <= $${paramIndex}`;
            params.push(new Date(endDate).toISOString());
            paramIndex++;
        }
        // Get total count
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM settlements WHERE ${whereClause}`, params);
        if (!countResult[0]) {
            throw new Error('Failed to get settlement count');
        }
        const total = parseInt(countResult[0].count, 10);
        // Get settlements
        const settlements = await (0, db_1.query)(`SELECT 
          id,
          tenant_id as "tenantId",
          provider,
          provider_settlement_id as "providerSettlementId",
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          currency,
          fx_rate as "fxRate",
          settlement_date as "settlementDate",
          expected_date as "expectedDate",
          status,
          raw_payload as "rawPayload",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM settlements 
        WHERE ${whereClause}
        ORDER BY settlement_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        (0, api_response_1.sendPaginated)(res, settlements, { page, limit, total });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to fetch settlements', 500);
        return;
    }
});
/**
 * GET /api/v1/settlements/:id
 * Get settlement by ID
 */
router.get('/:id', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getSettlementSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;
        const settlements = await (0, db_1.query)(`SELECT 
          id,
          tenant_id as "tenantId",
          provider,
          provider_settlement_id as "providerSettlementId",
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          currency,
          fx_rate as "fxRate",
          settlement_date as "settlementDate",
          expected_date as "expectedDate",
          status,
          raw_payload as "rawPayload",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM settlements 
        WHERE id = $1 AND tenant_id = $2`, [id || '', tenantId]);
        if (settlements.length === 0) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Settlement not found');
        }
        if (!settlements[0]) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Settlement not found');
        }
        (0, api_response_1.sendSuccess)(res, settlements[0]);
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to fetch settlement', 500);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=settlements.js.map