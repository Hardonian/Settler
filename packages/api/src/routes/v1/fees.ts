/**
 * Fees API Routes
 * 
 * REST API endpoints for fee visibility and reporting
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation';
import { AuthRequest } from '../../middleware/auth';
import { requirePermission } from '../../middleware/authorization';
import { Permission } from '../../infrastructure/security/Permissions';
import { query } from '../../db';
import { sendSuccess, sendPaginated } from '../../utils/api-response';
import { handleRouteError } from '../../utils/error-handler';

const router = Router();

// Validation schemas
const getFeesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
    transactionId: z.string().uuid().optional(),
    settlementId: z.string().uuid().optional(),
    type: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const getEffectiveRateSchema = z.object({
  query: z.object({
    transactionId: z.string().uuid().optional(),
    provider: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

/**
 * GET /api/v1/fees
 * List fees with filtering and pagination
 */
router.get(
  '/',
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getFeesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const queryParams = getFeesSchema.parse({ query: req.query });
      const { page, limit, transactionId, settlementId, type, startDate, endDate } = queryParams.query;
      const tenantId = req.tenantId!;
      const offset = (page - 1) * limit;

      let whereClause = 'tenant_id = $1';
      const params: (string | number)[] = [tenantId];
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
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM fees WHERE ${whereClause}`,
        params
      );
      if (!countResult[0]) {
        throw new Error('Failed to get fee count');
      }
      const total = parseInt(countResult[0].count, 10);

      // Get fees
      const fees = await query(
        `SELECT 
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
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      sendPaginated(res, fees, { page, limit, total });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch fees', 500);
    }
  }
);

/**
 * GET /api/v1/fees/effective-rate
 * Calculate effective rate for transactions
 */
router.get(
  '/effective-rate',
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getEffectiveRateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const queryParams = getEffectiveRateSchema.parse({ query: req.query });
      const { transactionId, provider, startDate, endDate } = queryParams.query;
      const tenantId = req.tenantId!;

      let whereClause = 't.tenant_id = $1';
      const params: (string | number)[] = [tenantId];
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

      const result = await query(
        `SELECT 
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
        ORDER BY t.created_at DESC`,
        params
      );

      sendSuccess(res, result);
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to calculate effective rate', 500);
      return;
    }
  }
);

export default router;
