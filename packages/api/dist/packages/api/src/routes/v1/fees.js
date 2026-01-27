"use strict";
/**
 * Fees API Routes
 *
 * REST API endpoints for fee visibility and reporting
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
const getFeesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
        transactionId: zod_1.z.string().uuid().optional(),
        settlementId: zod_1.z.string().uuid().optional(),
        type: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
const getEffectiveRateSchema = zod_1.z.object({
    query: zod_1.z.object({
        transactionId: zod_1.z.string().uuid().optional(),
        provider: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
/**
 * GET /api/v1/fees
 * List fees with filtering and pagination
 */
router.get('/', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getFeesSchema), async (req, res) => {
    try {
        const queryParams = getFeesSchema.parse({ query: req.query });
        const { page, limit, transactionId, settlementId, type, startDate, endDate } = queryParams.query;
        const tenantId = req.tenantId;
        const offset = (page - 1) * limit;
        let whereClause = 'tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;
        if (transactionId) {
            whereClause += ` AND transaction_id = $${paramIndex}`;
            params.push(transactionId);
            paramIndex++;
        }
        if (settlementId) {
            whereClause += ` AND settlement_id = $${paramIndex}`;
            params.push(settlementId);
            paramIndex++;
        }
        if (type) {
            whereClause += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (startDate) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(new Date(startDate).toISOString());
            paramIndex++;
        }
        if (endDate) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(new Date(endDate).toISOString());
            paramIndex++;
        }
        // Get total count
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM fees WHERE ${whereClause}`, params);
        if (!countResult[0]) {
            throw new Error('Failed to get fee count');
        }
        const total = parseInt(countResult[0].count, 10);
        // Get fees
        const fees = await (0, db_1.query)(`SELECT 
          id,
          tenant_id as "tenantId",
          transaction_id as "transactionId",
          settlement_id as "settlementId",
          type,
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          description,
          rate,
          raw_payload as "rawPayload",
          created_at as "createdAt"
        FROM fees 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        (0, api_response_1.sendPaginated)(res, fees, { page, limit, total });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to fetch fees', 500);
    }
});
/**
 * GET /api/v1/fees/effective-rate
 * Calculate effective rate for transactions
 */
router.get('/effective-rate', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getEffectiveRateSchema), async (req, res) => {
    try {
        const queryParams = getEffectiveRateSchema.parse({ query: req.query });
        const { transactionId, provider, startDate, endDate } = queryParams.query;
        const tenantId = req.tenantId;
        let whereClause = 't.tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;
        if (transactionId) {
            whereClause += ` AND t.id = $${paramIndex}`;
            params.push(transactionId);
            paramIndex++;
        }
        if (provider) {
            whereClause += ` AND t.provider = $${paramIndex}`;
            params.push(provider);
            paramIndex++;
        }
        if (startDate) {
            whereClause += ` AND t.created_at >= $${paramIndex}`;
            params.push(new Date(startDate).toISOString());
            paramIndex++;
        }
        if (endDate) {
            whereClause += ` AND t.created_at <= $${paramIndex}`;
            params.push(new Date(endDate).toISOString());
            paramIndex++;
        }
        const result = await (0, db_1.query)(`SELECT 
          t.id as "transactionId",
          t.provider,
          t.amount_value as "transactionAmount",
          COALESCE(SUM(f.amount_value), 0) as "totalFees",
          CASE 
            WHEN t.amount_value > 0 THEN 
              (COALESCE(SUM(f.amount_value), 0) / t.amount_value) * 100
            ELSE 0
          END as "effectiveRate"
        FROM transactions t
        LEFT JOIN fees f ON f.transaction_id = t.id
        WHERE ${whereClause}
        GROUP BY t.id, t.provider, t.amount_value
        ORDER BY t.created_at DESC`, params);
        (0, api_response_1.sendSuccess)(res, result);
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to calculate effective rate', 500);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=fees.js.map