/**
 * Transactions API Routes
 * 
 * REST API endpoints for transaction management
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation';
import { AuthRequest } from '../../middleware/auth';
import { requirePermission } from '../../middleware/authorization';
import { Permission } from '../../infrastructure/security/Permissions';
import { query } from '../../db';
import { sendSuccess, sendError, sendPaginated } from '../../utils/api-response';
import { handleRouteError } from '../../utils/error-handler';

const router = Router();

// Validation schemas
const getTransactionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
    provider: z.string().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    paymentId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const getTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * GET /api/v1/transactions
 * List transactions with filtering and pagination
 */
router.get(
  '/',
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getTransactionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const queryParams = getTransactionsSchema.parse({ query: req.query });
      const { page, limit, provider, status, type, paymentId, startDate, endDate } = queryParams.query;
      const tenantId = req.tenantId!;
      const offset = (page - 1) * limit;

      let whereClause = 'tenant_id = $1';
      const params: (string | number)[] = [tenantId];
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
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`,
        params
      );
      if (!countResult[0]) {
        throw new Error('Failed to get transaction count');
      }
      const total = parseInt(countResult[0].count, 10);

      // Get transactions
      const transactions = await query(
        `SELECT 
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
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      sendPaginated(res, transactions, { page, limit, total });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch transactions', 500);
      return;
    }
  }
);

/**
 * GET /api/v1/transactions/:id
 * Get transaction by ID
 */
router.get(
  '/:id',
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getTransactionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const transactions = await query(
        `SELECT 
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
        WHERE id = $1 AND tenant_id = $2`,
        [id || '', tenantId]
      );

      if (transactions.length === 0 || !transactions[0]) {
        return sendError(res, 404, 'NOT_FOUND', 'Transaction not found');
      }

      sendSuccess(res, transactions[0]);
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch transaction', 500);
    }
  }
);

export default router;
