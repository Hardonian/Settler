"use strict";
/**
 * Transactions API Routes
 *
 * REST API endpoints for transaction management
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
const getTransactionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
        provider: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
        paymentId: zod_1.z.string().uuid().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
const getTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * GET /api/v1/transactions
 * List transactions with filtering and pagination
 */
router.get('/', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getTransactionsSchema), async (req, res) => {
    try {
        const queryParams = getTransactionsSchema.parse({ query: req.query });
        const { page, limit, provider, status, type, paymentId, startDate, endDate } = queryParams.query;
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
        if (type) {
            whereClause += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (paymentId) {
            whereClause += ` AND payment_id = $${paramIndex}`;
            params.push(paymentId);
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
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`, params);
        if (!countResult[0]) {
            throw new Error('Failed to get transaction count');
        }
        const total = parseInt(countResult[0].count, 10);
        // Get transactions
        const transactions = await (0, db_1.query)(`SELECT 
          id,
          tenant_id as "tenantId",
          payment_id as "paymentId",
          provider,
          provider_transaction_id as "providerTransactionId",
          type,
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          net_amount_value as "netAmount.value",
          net_amount_currency as "netAmount.currency",
          status,
          raw_payload as "rawPayload",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM transactions 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        (0, api_response_1.sendPaginated)(res, transactions, { page, limit, total });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to fetch transactions', 500);
        return;
    }
});
/**
 * GET /api/v1/transactions/:id
 * Get transaction by ID
 */
router.get('/:id', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getTransactionSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;
        const transactions = await (0, db_1.query)(`SELECT 
          id,
          tenant_id as "tenantId",
          payment_id as "paymentId",
          provider,
          provider_transaction_id as "providerTransactionId",
          type,
          amount_value as "amount.value",
          amount_currency as "amount.currency",
          net_amount_value as "netAmount.value",
          net_amount_currency as "netAmount.currency",
          status,
          raw_payload as "rawPayload",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM transactions 
        WHERE id = $1 AND tenant_id = $2`, [id || '', tenantId]);
        if (transactions.length === 0 || !transactions[0]) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Transaction not found');
        }
        (0, api_response_1.sendSuccess)(res, transactions[0]);
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to fetch transaction', 500);
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map