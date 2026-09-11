import { RbacAuditTrail } from "./rbac-audit-logger";

describe("RBAC Hash-Chained Audit Trail", () => {
  const tenantId = "tenant_rbac_audit";

  it("fails fast if tenantId is missing", () => {
    expect(() => new RbacAuditTrail("")).toThrow(/Tenant context invariant violation/);
  });

  it("appends records with valid blockchain hash links", () => {
    const trail = new RbacAuditTrail(tenantId);

    const r1 = trail.append("user_01", "ADMIN", "TOKEN_ISSUE", "api_key_8801");
    expect(r1.previousRecordHash).toBe("0".repeat(64));
    expect(r1.recordHash).toMatch(/^[a-f0-9]{64}$/);

    const r2 = trail.append("user_02", "OWNER", "LEDGER_OVERRIDE", "entry_9901", {
      reason: "Manual bank fee adjustment",
    });
    expect(r2.previousRecordHash).toBe(r1.recordHash);

    const verification = trail.verifyChain();
    expect(verification.valid).toBe(true);
  });

  it("detects tampering when an audit record payload or link is altered", () => {
    const trail = new RbacAuditTrail(tenantId);
    trail.append("user_01", "ADMIN", "ROLE_CHANGE", "user_03");
    trail.append("user_02", "ADMIN", "ROLE_CHANGE", "user_04");

    const records = trail.getRecords() as unknown as Array<{
      actorId: string;
      recordHash: string;
    }>;
    // Tamper with record 0 actorId
    records[0]!.actorId = "attacker_evil";

    const verification = trail.verifyChain();
    expect(verification.valid).toBe(false);
    expect(verification.corruptedIndex).toBe(0);
    expect(verification.reason).toContain("tampering");
  });
});
