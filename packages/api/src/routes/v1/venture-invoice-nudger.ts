import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { queryWithTenant, transactionWithTenant } from "../../db";
import { handleRouteError } from "../../utils/error-handler";

const router: Router = Router();

const runNudgerSchema = z.object({
  body: z.object({
    minDaysOverdue: z.number().int().min(1).max(365).optional().default(7),
    maxInvoices: z.number().int().min(1).max(1000).optional().default(200),
    lookbackDays: z.number().int().min(1).max(365).optional().default(14),
    execute: z.boolean().optional().default(false),
  }),
});

const listRunsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

const getRunSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
});

type InvoiceRow = {
  id: string;
  external_id: string;
  invoice_number: string | null;
  customer_id: string | null;
  customer_name: string | null;
  amount_cents: string;
  currency: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
};

router.post(
  "/invoice-nudger/run",
  requirePermission(Permission.OPERATOR_WRITE),
  validateRequest(runNudgerSchema),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenant context" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Missing user context" });
    }

    try {
      const parsed = runNudgerSchema.parse({ body: req.body });
      const { minDaysOverdue, maxInvoices, lookbackDays, execute } = parsed.body;

      const invoices = await queryWithTenant<InvoiceRow>(
        tenantId,
        `SELECT
          id,
          external_id,
          invoice_number,
          customer_id,
          customer_name,
          amount_cents::text,
          currency,
          status,
          issue_date::text,
          due_date::text,
          paid_at::text
        FROM financial_invoices
        WHERE tenant_id = $1
          AND due_date IS NOT NULL
          AND due_date <= (CURRENT_DATE - ($2::int * INTERVAL '1 day'))
          AND status IN ('overdue', 'sent', 'open')
          AND paid_at IS NULL
        ORDER BY due_date ASC
        LIMIT $3`,
        [tenantId, minDaysOverdue, maxInvoices]
      );

      const runRecord = await transactionWithTenant(tenantId, async (client) => {
        const runInsert = await client.query<{
          id: string;
          created_at: string;
        }>(
          `INSERT INTO venture_invoice_nudge_runs (
            tenant_id,
            created_by,
            status,
            min_days_overdue,
            lookback_days,
            execute_mode,
            total_scanned
          ) VALUES ($1, $2, 'running', $3, $4, $5, $6)
          RETURNING id, created_at`,
          [tenantId, userId, minDaysOverdue, lookbackDays, execute, invoices.length]
        );

        const run = runInsert.rows[0];
        if (!run) {
          throw new Error("Failed to create nudger run");
        }

        let nudged = 0;
        let suppressed = 0;

        for (const invoice of invoices) {
          const amountCents = Number(invoice.amount_cents);

          const paymentSignal = await client.query<{ signal_count: string }>(
            `SELECT COUNT(*)::text AS signal_count
             FROM financial_transactions t
             WHERE t.tenant_id = $1
               AND t.occurred_at >= NOW() - ($2::int * INTERVAL '1 day')
               AND (
                 (t.reference_id IS NOT NULL AND t.reference_id = $3)
                 OR ($4::text IS NOT NULL AND t.description ILIKE ('%' || $4 || '%'))
                 OR ($5::text IS NOT NULL AND t.description ILIKE ('%' || $5 || '%'))
               )
               AND (
                 t.amount_cents = $6
                 OR t.amount_cents = -$6
               )`,
            [
              tenantId,
              lookbackDays,
              invoice.external_id,
              invoice.invoice_number,
              invoice.customer_name,
              amountCents,
            ]
          );

          const hasPaymentSignal = Number(paymentSignal.rows[0]?.signal_count ?? "0") > 0;

          const reconSignal = await client.query<{ signal_count: string }>(
            `SELECT COUNT(*)::text AS signal_count
             FROM reconciliation_runs r
             WHERE r.tenant_id = $1
               AND r.created_at >= NOW() - ($2::int * INTERVAL '1 day')
               AND r.status IN ('running', 'pending', 'completed')`,
            [tenantId, lookbackDays]
          );

          const hasReconSignal = Number(reconSignal.rows[0]?.signal_count ?? "0") > 0;

          const action = hasPaymentSignal
            ? "suppress"
            : execute
              ? "queue_nudge"
              : "recommend_nudge";

          const reason = hasPaymentSignal
            ? "payment_signal_detected"
            : hasReconSignal
              ? "no_payment_signal_recon_active"
              : "no_payment_signal";

          if (action === "suppress") suppressed += 1;
          else nudged += 1;

          await client.query(
            `INSERT INTO venture_invoice_nudge_items (
              run_id,
              tenant_id,
              invoice_id,
              external_id,
              invoice_number,
              customer_id,
              customer_name,
              amount_cents,
              currency,
              due_date,
              action,
              reason,
              has_payment_signal,
              has_recon_signal
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )`,
            [
              run.id,
              tenantId,
              invoice.id,
              invoice.external_id,
              invoice.invoice_number,
              invoice.customer_id,
              invoice.customer_name,
              amountCents,
              invoice.currency,
              invoice.due_date,
              action,
              reason,
              hasPaymentSignal,
              hasReconSignal,
            ]
          );
        }

        await client.query(
          `UPDATE venture_invoice_nudge_runs
           SET status = 'completed',
               total_nudged = $2,
               total_suppressed = $3,
               completed_at = NOW()
           WHERE id = $1 AND tenant_id = $4`,
          [run.id, nudged, suppressed, tenantId]
        );

        return {
          runId: run.id,
          createdAt: run.created_at,
          totalScanned: invoices.length,
          totalNudged: nudged,
          totalSuppressed: suppressed,
          execute,
        };
      });

      return res.status(201).json({ data: runRecord });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to run invoice nudger", 500, {
        userId,
        tenantId,
      });
    }
  }
);

router.get(
  "/invoice-nudger/runs",
  requirePermission(Permission.OPERATOR_READ),
  validateRequest(listRunsSchema),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenant context" });
    }

    try {
      const parsed = listRunsSchema.parse({ query: req.query });
      const runs = await queryWithTenant(
        tenantId,
        `SELECT
          id,
          status,
          min_days_overdue AS "minDaysOverdue",
          lookback_days AS "lookbackDays",
          execute_mode AS "executeMode",
          total_scanned AS "totalScanned",
          total_nudged AS "totalNudged",
          total_suppressed AS "totalSuppressed",
          created_at AS "createdAt",
          completed_at AS "completedAt"
        FROM venture_invoice_nudge_runs
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
        [tenantId, parsed.query.limit]
      );

      return res.status(200).json({ data: runs });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to list invoice nudger runs", 500, {
        tenantId,
      });
    }
  }
);

router.get(
  "/invoice-nudger/runs/:runId",
  requirePermission(Permission.OPERATOR_READ),
  validateRequest(getRunSchema),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenant context" });
    }

    try {
      const { runId } = getRunSchema.parse({ params: req.params }).params;

      const runs = await queryWithTenant(
        tenantId,
        `SELECT
          id,
          status,
          min_days_overdue AS "minDaysOverdue",
          lookback_days AS "lookbackDays",
          execute_mode AS "executeMode",
          total_scanned AS "totalScanned",
          total_nudged AS "totalNudged",
          total_suppressed AS "totalSuppressed",
          created_at AS "createdAt",
          completed_at AS "completedAt"
        FROM venture_invoice_nudge_runs
        WHERE tenant_id = $1 AND id = $2
        LIMIT 1`,
        [tenantId, runId]
      );

      const run = runs[0];
      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }

      const items = await queryWithTenant(
        tenantId,
        `SELECT
          id,
          invoice_id AS "invoiceId",
          external_id AS "externalId",
          invoice_number AS "invoiceNumber",
          customer_id AS "customerId",
          customer_name AS "customerName",
          amount_cents AS "amountCents",
          currency,
          due_date AS "dueDate",
          action,
          reason,
          has_payment_signal AS "hasPaymentSignal",
          has_recon_signal AS "hasReconSignal",
          created_at AS "createdAt"
        FROM venture_invoice_nudge_items
        WHERE tenant_id = $1 AND run_id = $2
        ORDER BY due_date ASC, created_at ASC`,
        [tenantId, runId]
      );

      return res.status(200).json({ data: { run, items } });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to fetch invoice nudger run", 500, {
        tenantId,
      });
    }
  }
);

export default router;
