/**
 * ERP Journal Service (API Control Plane)
 *
 * Manages tenant-isolated ERP journal synthesis, chart of accounts mapping,
 * and export payloads for NetSuite SuiteTalk and SAP S/4HANA.
 */

import {
  erpJournalSynthesizer,
  ErpJournalEntry,
  ErpTargetSystem,
  ErpChartOfAccountsMapping,
  DEFAULT_ERP_CHART_OF_ACCOUNTS,
  TriangularSettlementInput,
  NetSuiteJournalPayload,
  SapS4HanaJournalPayload,
} from "@settler/reconciliation-core";
import { isValidTenantUuid } from "../../utils/tenant-id";
import { logInfo, logWarn } from "../../utils/logger";

export interface ErpExportResult {
  journalId: string;
  tenantId: string;
  targetSystem: ErpTargetSystem;
  merkleProofHash: string;
  payload: NetSuiteJournalPayload | SapS4HanaJournalPayload | Record<string, unknown>;
}

export class ErpJournalService {
  // Tenant-isolated in-memory store: Map<tenantId, Map<journalId, ErpJournalEntry>>
  private journals: Map<string, Map<string, ErpJournalEntry>> = new Map();

  // Tenant-isolated chart of accounts: Map<tenantId, ErpChartOfAccountsMapping>
  private coaMappings: Map<string, ErpChartOfAccountsMapping> = new Map();

  private ensureTenantStore(tenantId: string): void {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    if (!this.journals.has(tenantId)) {
      this.journals.set(tenantId, new Map());
    }
    if (!this.coaMappings.has(tenantId)) {
      this.coaMappings.set(tenantId, { ...DEFAULT_ERP_CHART_OF_ACCOUNTS });
    }
  }

  /**
   * Updates custom Chart of Accounts mapping for a tenant
   */
  public setTenantChartOfAccounts(
    tenantId: string,
    mapping: Partial<ErpChartOfAccountsMapping>
  ): ErpChartOfAccountsMapping {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    this.ensureTenantStore(tenantId);
    const updated = {
      ...this.coaMappings.get(tenantId)!,
      ...mapping,
    };
    this.coaMappings.set(tenantId, updated);
    logInfo("Updated ERP Chart of Accounts for tenant", { tenantId });
    return updated;
  }

  /**
   * Retrieves Chart of Accounts mapping for a tenant
   */
  public getTenantChartOfAccounts(tenantId: string): ErpChartOfAccountsMapping {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    this.ensureTenantStore(tenantId);
    return this.coaMappings.get(tenantId)!;
  }

  /**
   * Synthesizes and stores an ERP journal from a converged settlement
   */
  public synthesizeFromSettlement(
    tenantId: string,
    settlement: TriangularSettlementInput,
    options: { targetSystem?: ErpTargetSystem; subsidiaryId?: string } = {}
  ): ErpJournalEntry {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    this.ensureTenantStore(tenantId);
    const mapping = this.coaMappings.get(tenantId);

    const journal = erpJournalSynthesizer.synthesizeFromTriangularSettlement({
      tenantId,
      settlement,
      targetSystem: options.targetSystem ?? "NETSUITE",
      mapping,
      subsidiaryId: options.subsidiaryId,
    });

    // Store in tenant namespace
    this.journals.get(tenantId)!.set(journal.journalId, journal);

    logInfo("Synthesized balanced ERP journal entry", {
      tenantId,
      journalId: journal.journalId,
      orderReference: settlement.orderReference,
      totalDebitCents: journal.totalDebitCents.toString(),
      isBalanced: journal.isBalanced,
      merkleProofHash: journal.merkleProofHash,
    });

    return journal;
  }

  /**
   * Synthesizes and stores a batch ERP journal from multiple settlements
   */
  public synthesizeBatchJournal(
    tenantId: string,
    batchReference: string,
    settlements: TriangularSettlementInput[],
    options: { targetSystem?: ErpTargetSystem; postingDate?: string } = {}
  ): ErpJournalEntry {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    this.ensureTenantStore(tenantId);
    const mapping = this.coaMappings.get(tenantId);

    const journal = erpJournalSynthesizer.synthesizeBatchJournal({
      tenantId,
      batchReference,
      settlements,
      postingDate: options.postingDate,
      targetSystem: options.targetSystem ?? "NETSUITE",
      mapping,
    });

    this.journals.get(tenantId)!.set(journal.journalId, journal);

    logInfo("Synthesized balanced batch ERP journal entry", {
      tenantId,
      journalId: journal.journalId,
      batchReference,
      itemCount: settlements.length,
      merkleProofHash: journal.merkleProofHash,
    });

    return journal;
  }

  /**
   * Retrieves all journal entries for a tenant
   */
  public getTenantJournals(tenantId: string): ErpJournalEntry[] {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    this.ensureTenantStore(tenantId);
    return Array.from(this.journals.get(tenantId)!.values());
  }

  /**
   * Retrieves a single journal entry by ID with strict tenant scoping
   */
  public getJournalById(tenantId: string, journalId: string): ErpJournalEntry | null {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error("Invalid tenant UUID");
    }
    this.ensureTenantStore(tenantId);
    return this.journals.get(tenantId)!.get(journalId) ?? null;
  }

  /**
   * Exports an ERP journal entry into native destination format
   */
  public exportJournal(
    tenantId: string,
    journalId: string,
    options: { targetSystem?: ErpTargetSystem; subsidiaryId?: string; companyCode?: string } = {}
  ): ErpExportResult {
    const journal = this.getJournalById(tenantId, journalId);
    if (!journal) {
      throw new Error(`Journal entry ${journalId} not found for tenant`);
    }

    const targetSystem = options.targetSystem ?? journal.targetSystem;
    let payload: NetSuiteJournalPayload | SapS4HanaJournalPayload | Record<string, unknown>;

    if (targetSystem === "NETSUITE") {
      payload = erpJournalSynthesizer.exportToNetSuite(journal, {
        subsidiaryId: options.subsidiaryId,
      });
    } else if (targetSystem === "SAP_S4HANA") {
      payload = erpJournalSynthesizer.exportToSapS4Hana(journal, {
        companyCode: options.companyCode,
      });
    } else {
      payload = {
        journalId: journal.journalId,
        postingDate: journal.postingDate,
        currency: journal.currency,
        memo: journal.memo,
        merkleProofHash: journal.merkleProofHash,
        lines: journal.lines.map((l) => ({
          ...l,
          debitCents: l.debitCents.toString(),
          creditCents: l.creditCents.toString(),
        })),
      };
    }

    return {
      journalId: journal.journalId,
      tenantId,
      targetSystem,
      merkleProofHash: journal.merkleProofHash,
      payload,
    };
  }
}

export const erpJournalService = new ErpJournalService();
