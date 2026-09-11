import { LEDGER_SUBGRAPH_SCHEMA_SDL, createLedgerSubgraphResolvers } from "../ledger-subgraph";

describe("GraphQL Ledger Subgraph", () => {
  const resolvers = createLedgerSubgraphResolvers();

  it("exports valid SDL schema with Apollo Federation directives", () => {
    expect(LEDGER_SUBGRAPH_SCHEMA_SDL).toContain('@key(fields: "tenantId")');
    expect(LEDGER_SUBGRAPH_SCHEMA_SDL).toContain("type TenantLedger");
    expect(LEDGER_SUBGRAPH_SCHEMA_SDL).toContain("type MultiRailFlowTelemetry");
  });

  it("resolves ledger telemetry when tenantId matches authenticated session", async () => {
    const result = (await resolvers.Query.ledgerByTenant(
      {},
      { tenantId: "tenant-enterprise-01" },
      { authenticatedTenantId: "tenant-enterprise-01", permissions: ["recon:read"] }
    )) as any;

    expect(result.tenantId).toBe("tenant-enterprise-01");
    expect(result.totalBalanceCents).toBe("48291000");
    expect(result.supportedRails).toContain("stripe");
    expect(result.supportedRails).toContain("paypal");
  });

  it("rejects cross-tenant GraphQL queries with Tenant mismatch error", async () => {
    await expect(
      resolvers.Query.ledgerByTenant(
        {},
        { tenantId: "tenant-enterprise-01" },
        { authenticatedTenantId: "tenant-competitor-99", permissions: ["recon:read"] }
      )
    ).rejects.toThrow("Tenant mismatch");
  });
});
