export class ImmutableLedgerViolationError extends Error {
  public readonly code = "SETTLER_INVARIANT_IMMUTABLE_LEDGER";
  public readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "ImmutableLedgerViolationError";
  }
}

export type JournalLifecycleStatus = "DRAFT" | "PENDING" | "FINALIZED" | "POSTED" | "ARCHIVED";

export interface LedgerMutationTarget {
  tenantId: string;
  journalId: string;
  currentStatus: JournalLifecycleStatus;
  operation: "INSERT" | "UPDATE" | "DELETE";
}

/**
 * Immutable Ledger Append-Only Log Enforcer (#16)
 * Enforces strict append-only semantics on finalized reconciliation journals at the application layer.
 * Any SQL UPDATE or DELETE targeting finalized or posted transactions is strictly rejected.
 */
export class ImmutableJournalGuard {
  private static readonly LOCKED_STATUSES: Set<JournalLifecycleStatus> = new Set([
    "FINALIZED",
    "POSTED",
    "ARCHIVED",
  ]);

  /**
   * Asserts that a proposed mutation on a ledger entity does not violate append-only immutability.
   */
  public static assertMutationPermitted(target: LedgerMutationTarget): void {
    if (!target.tenantId || typeof target.tenantId !== "string") {
      throw new ImmutableLedgerViolationError(
        "TenantId invariant violation: Every ledger mutation must specify a tenant context"
      );
    }

    if (this.LOCKED_STATUSES.has(target.currentStatus)) {
      if (target.operation === "UPDATE") {
        throw new ImmutableLedgerViolationError(
          `Immutable Ledger Invariant Violation: Journal ${target.journalId} (Tenant: ${target.tenantId}) is in locked state '${target.currentStatus}'. SQL UPDATE operations are strictly prohibited on finalized ledger journals.`
        );
      }
      if (target.operation === "DELETE") {
        throw new ImmutableLedgerViolationError(
          `Immutable Ledger Invariant Violation: Journal ${target.journalId} (Tenant: ${target.tenantId}) is in locked state '${target.currentStatus}'. SQL DELETE operations are strictly prohibited on finalized ledger journals.`
        );
      }
    }
  }

  /**
   * Returns PostgreSQL DDL for database-level trigger enforcer
   */
  public static getPostgresTriggerSql(): string {
    return `
CREATE OR REPLACE FUNCTION enforce_immutable_settlement_journals()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IN ('FINALIZED', 'POSTED', 'ARCHIVED')) THEN
        RAISE EXCEPTION 'Immutable Ledger Invariant Violation: Direct % is prohibited on finalized journal %', TG_OP, OLD.id
        USING ERRCODE = '55000'; -- Object not in prerequisite state
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_immutable_settlement_journals ON journals;
CREATE TRIGGER trg_enforce_immutable_settlement_journals
BEFORE UPDATE OR DELETE ON journals
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_settlement_journals();
`.trim();
  }
}
