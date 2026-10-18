/**
 * Triangular (3-Way) Reconciliation API Route (v2)
 *
 * Exposes multi-party triangular matching across Orders, Gateway Captures,
 * and Bank Settlement Sweeps with strict tenant isolation.
 */

import { Router, Request, Response, NextFunction } from "express";
import {
  reconcileTriangular,
  OrderRecord,
  GatewayCaptureRecord,
  BankDepositRecord,
} from "@settler/reconciliation-core";
import { AuthRequest } from "../../middleware/auth";

export const triangularRouter: Router = Router();

interface TriangularReconcileBody {
  tenantId?: string;
  orders: OrderRecord[];
  captures: GatewayCaptureRecord[];
  deposits: BankDepositRecord[];
  toleranceCents?: string | number;
  maxTransitDelayHours?: number;
  enableBatchSweepAggregation?: boolean;
}

/**
 * POST /api/v2/reconciliation/triangular
 * Executes 3-way triangular reconciliation
 */
triangularRouter.post(
  "/",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const body = req.body as TriangularReconcileBody;
      const tenantId = authReq.tenantId ?? (authReq.user as any)?.tenantId ?? body.tenantId;

      if (!tenantId) {
        res.status(400).json({ error: "Tenant context is required" });
        return;
      }

      if (
        !Array.isArray(body.orders) ||
        !Array.isArray(body.captures) ||
        !Array.isArray(body.deposits)
      ) {
        res.status(400).json({
          error: "Invalid input: orders, captures, and deposits must be arrays",
        });
        return;
      }

      // Convert BigInt amounts safely from incoming JSON
      const parsedOrders: OrderRecord[] = body.orders.map((o) => ({
        ...o,
        amountCents: BigInt(o.amountCents ?? 0),
      }));

      const parsedCaptures: GatewayCaptureRecord[] = body.captures.map((c) => ({
        ...c,
        grossAmountCents: BigInt(c.grossAmountCents ?? 0),
        feeCents: BigInt(c.feeCents ?? 0),
        netAmountCents: BigInt(
          c.netAmountCents ?? BigInt(c.grossAmountCents ?? 0) - BigInt(c.feeCents ?? 0)
        ),
      }));

      const parsedDeposits: BankDepositRecord[] = body.deposits.map((d) => ({
        ...d,
        depositAmountCents: BigInt(d.depositAmountCents ?? 0),
      }));

      const toleranceCents = body.toleranceCents !== undefined ? BigInt(body.toleranceCents) : 0n;

      const result = reconcileTriangular(parsedOrders, parsedCaptures, parsedDeposits, {
        tenantId,
        toleranceCents,
        maxTransitDelayHours: body.maxTransitDelayHours,
        enableBatchSweepAggregation: body.enableBatchSweepAggregation,
      });

      // Serialize BigInt values to string for JSON output
      const jsonSafeResult = JSON.parse(
        JSON.stringify(result, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      res.status(200).json({
        success: true,
        data: jsonSafeResult,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Internal error" });
    }
  }
);
