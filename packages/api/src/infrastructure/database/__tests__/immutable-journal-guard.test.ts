import { ImmutableJournalGuard, ImmutableLedgerViolationError } from "../immutable-journal-guard";

describe("ImmutableJournalGuard", () => {
  it("permits INSERT operations on draft or pending journals", () => {
    expect(() => {
      ImmutableJournalGuard.assertMutationPermitted({
        tenantId: "tenant-us-01",
        journalId: "jnl-901",
        currentStatus: "DRAFT",
        operation: "INSERT",
      });
    }).not.toThrow();
  });

  it("permits UPDATE operations on DRAFT journals before finalization", () => {
    expect(() => {
      ImmutableJournalGuard.assertMutationPermitted({
        tenantId: "tenant-us-01",
        journalId: "jnl-902",
        currentStatus: "DRAFT",
        operation: "UPDATE",
      });
    }).not.toThrow();
  });

  it("throws ImmutableLedgerViolationError when attempting to UPDATE a FINALIZED journal", () => {
    expect(() => {
      ImmutableJournalGuard.assertMutationPermitted({
        tenantId: "tenant-us-01",
        journalId: "jnl-903",
        currentStatus: "FINALIZED",
        operation: "UPDATE",
      });
    }).toThrow(ImmutableLedgerViolationError);
  });

  it("throws ImmutableLedgerViolationError when attempting to DELETE a POSTED journal", () => {
    expect(() => {
      ImmutableJournalGuard.assertMutationPermitted({
        tenantId: "tenant-us-01",
        journalId: "jnl-904",
        currentStatus: "POSTED",
        operation: "DELETE",
      });
    }).toThrow(ImmutableLedgerViolationError);
  });

  it("enforces tenantId requirement on all ledger mutations", () => {
    expect(() => {
      ImmutableJournalGuard.assertMutationPermitted({
        tenantId: "",
        journalId: "jnl-905",
        currentStatus: "DRAFT",
        operation: "INSERT",
      });
    }).toThrow(/TenantId invariant violation/);
  });
});
