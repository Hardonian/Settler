/**
 * Settlements API Routes
 * 
 * REST API endpoints for settlement management
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
const getSettlementsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
    provider: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const getSettlementSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * GET /api/v1/settlements
 * List settlements with filtering and pagination
 */
router.get(
  '/',
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getSettlementsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const queryParams = getSettlementsSchema.parse({ query: req.query });
      const { page, limit, provider, status, startDate, endDate } = queryParams.query;
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
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM settlements WHERE ${whereClause}`,
        params
      );
      if (!countResult[0]) {
        throw new Error('Failed to get settlement count');
      }
      const total = parseInt(countResult[0].count, 10);

      // Get settlements
      const settlements = await query(
        `SELECT 
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
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      sendPaginated(res, settlements, { page, limit, total });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch settlements', 500);
      return;
    }
  }
);

/**
 * GET /api/v1/settlements/:id
 * Get settlement by ID
 */
router.get(
  '/:id',
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getSettlementSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const settlements = await query(
        `SELECT 
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
        WHERE id = $1 AND tenant_id = $2`,
        [id || '', tenantId]
      );

      if (settlements.length === 0) {
        return sendError(res, 404, 'NOT_FOUND', 'Settlement not found');
      }

      if (!settlements[0]) {
        return sendError(res, 404, 'NOT_FOUND', 'Settlement not found');
      }
      sendSuccess(res, settlements[0]);
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to fetch settlement', 500);
      return;
    }
  }
);

export default router;
