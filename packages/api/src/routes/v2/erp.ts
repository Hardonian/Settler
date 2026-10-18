/**
 * Autonomous ERP Journal Entry Routes (API v2)
 *
 * REST API for synthesizing, inspecting, and exporting GAAP/IFRS balanced
 * compound journal entries for NetSuite SuiteTalk and SAP S/4HANA OData.
 */

import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { erpJournalService } from "../../services/erp/erp-journal-service";
import { isValidTenantUuid } from "../../utils/tenant-id";
import { handleRouteError } from "../../utils/error-handler";

export const erpRouter: Router = Router();

function resolveTenantId(req: Request): string | null {
  return (req as AuthRequest).tenantId ?? null;
}

/**
 * POST /api/v2/erp/journal/synthesize
 * Synthesizes a balanced journal entry from a settlement triplet
 */
erpRouter.post(
  "/journal/synthesize",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      if (req.body?.tenantId && req.body.tenantId !== tenantId) {
        res.status(403).json({ error: "Tenant mismatch" });
        return;
      }

      const { settlement, settlements, batchReference, targetSystem, subsidiaryId } = req.body;

      if (batchReference && Array.isArray(settlements)) {
        const batchJournal = erpJournalService.synthesizeBatchJournal(
          tenantId,
          batchReference,
          settlements,
          { targetSystem }
        );
        const serialized = JSON.parse(
          JSON.stringify(batchJournal, (_, v) => (typeof v === "bigint" ? v.toString() : v))
        );
        res.status(200).json({ success: true, data: serialized });
        return;
      }

      if (!settlement || !settlement.orderReference) {
        res.status(400).json({ error: "settlement object with orderReference is required" });
        return;
      }

      const journal = erpJournalService.synthesizeFromSettlement(tenantId, settlement, {
        targetSystem,
        subsidiaryId,
      });

      const serialized = JSON.parse(
        JSON.stringify(journal, (_, v) => (typeof v === "bigint" ? v.toString() : v))
      );

      res.status(200).json({ success: true, data: serialized });
    } catch (error) {
      handleRouteError(res, error, "Failed to synthesize ERP journal entry");
    }
  }
);

/**
 * GET /api/v2/erp/journal/list
 * Lists all synthesized journal entries for the tenant
 */
erpRouter.get(
  "/journal/list",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);
      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      const journals = erpJournalService.getTenantJournals(tenantId);
      const serialized = JSON.parse(
        JSON.stringify(journals, (_, v) => (typeof v === "bigint" ? v.toString() : v))
      );

      res.status(200).json({ success: true, data: serialized });
    } catch (error) {
      handleRouteError(res, error, "Failed to retrieve ERP journal entries");
    }
  }
);

/**
 * GET /api/v2/erp/journal/:journalId
 * Retrieves a single journal entry by ID
 */
erpRouter.get(
  "/journal/:journalId",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);
      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      const journalId = String(req.params.journalId);
      const journal = erpJournalService.getJournalById(tenantId, journalId);

      if (!journal) {
        res.status(404).json({ error: "ERP Journal entry not found" });
        return;
      }

      const serialized = JSON.parse(
        JSON.stringify(journal, (_, v) => (typeof v === "bigint" ? v.toString() : v))
      );

      res.status(200).json({ success: true, data: serialized });
    } catch (error) {
      handleRouteError(res, error, "Failed to retrieve ERP journal entry");
    }
  }
);

/**
 * GET /api/v2/erp/journal/:journalId/export
 * Exports the journal into native NetSuite SuiteTalk or SAP S/4HANA format
 */
erpRouter.get(
  "/journal/:journalId/export",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const tenantId = resolveTenantId(req);
      if (!tenantId || !isValidTenantUuid(tenantId)) {
        res.status(400).json({ error: "Valid tenant context is required" });
        return;
      }

      const journalId = String(req.params.journalId);
      const targetSystem = req.query.targetSystem as any;
      const subsidiaryId =
        typeof req.query.subsidiaryId === "string" ? req.query.subsidiaryId : undefined;
      const companyCode =
        typeof req.query.companyCode === "string" ? req.query.companyCode : undefined;

      const exportResult = erpJournalService.exportJournal(tenantId, journalId, {
        targetSystem,
        subsidiaryId,
        companyCode,
      });

      res.status(200).json({ success: true, data: exportResult });
    } catch (error) {
      handleRouteError(res, error, "Failed to export ERP journal");
    }
  }
);

/**
 * GET /api/v2/erp/coa
 * Retrieves current Chart of Accounts mapping
 */
erpRouter.get("/coa", async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId || !isValidTenantUuid(tenantId)) {
      res.status(400).json({ error: "Valid tenant context is required" });
      return;
    }

    const coa = erpJournalService.getTenantChartOfAccounts(tenantId);
    res.status(200).json({ success: true, data: coa });
  } catch (error) {
    handleRouteError(res, error, "Failed to retrieve Chart of Accounts");
  }
});

/**
 * POST /api/v2/erp/coa
 * Updates Chart of Accounts mapping for the tenant
 */
erpRouter.post("/coa", async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId || !isValidTenantUuid(tenantId)) {
      res.status(400).json({ error: "Valid tenant context is required" });
      return;
    }

    const updated = erpJournalService.setTenantChartOfAccounts(tenantId, req.body?.mapping ?? {});
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    handleRouteError(res, error, "Failed to update Chart of Accounts");
  }
});
