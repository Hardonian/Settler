export const LEDGER_SUBGRAPH_SCHEMA_SDL = `
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type TenantLedger @key(fields: "tenantId") {
    tenantId: ID!
    totalBalanceCents: String!
    unsettledFloatCents: String!
    activeDisputeReserveCents: String!
    merkleRootSha256: String!
    supportedRails: [String!]!
    recentBatches(limit: Int): [ReconciliationBatch!]!
  }

  type ReconciliationBatch {
    batchId: ID!
    rail: String!
    grossAmountCents: String!
    feeCents: String!
    netAmountCents: String!
    status: String!
    timestamp: String!
    proofpackHash: String!
  }

  type MultiRailFlowTelemetry {
    tenantId: ID!
    windowMinutes: Int!
    stripeVolumeCents: String!
    paypalVolumeCents: String!
    fednowVolumeCents: String!
    sepaVolumeCents: String!
    totalInterchangeSavedCents: String!
  }

  type Query {
    ledgerByTenant(tenantId: ID!): TenantLedger
    multiRailFlow(tenantId: ID!, windowMinutes: Int): MultiRailFlowTelemetry
  }
`.trim();

export interface LedgerQueryContext {
  authenticatedTenantId: string;
  permissions: string[];
}

export interface LedgerSubgraphResolvers {
  Query: {
    ledgerByTenant: (
      parent: unknown,
      args: { tenantId: string },
      context: LedgerQueryContext
    ) => Promise<unknown>;
    multiRailFlow: (
      parent: unknown,
      args: { tenantId: string; windowMinutes?: number },
      context: LedgerQueryContext
    ) => Promise<unknown>;
  };
}

/**
 * GraphQL Subgraph for Ledger Telemetry (#37)
 * Exposes Apollo Federation-compatible GraphQL schema and resolvers for multi-rail balance graph topologies.
 */
export const createLedgerSubgraphResolvers = (): LedgerSubgraphResolvers => ({
  Query: {
    ledgerByTenant: async (_parent, args, context) => {
      // Invariant: Tenant isolation check
      if (!context.authenticatedTenantId || context.authenticatedTenantId !== args.tenantId) {
        throw new Error(
          `Tenant mismatch: Authenticated tenant '${context.authenticatedTenantId}' cannot access ledger for '${args.tenantId}'`
        );
      }

      return {
        tenantId: args.tenantId,
        totalBalanceCents: "48291000", // $482,910.00
        unsettledFloatCents: "1250000", // $12,500.00
        activeDisputeReserveCents: "340000", // $3,400.00
        merkleRootSha256: "0x892a0192847291a091823abce128371289371298371238472918294719283712",
        supportedRails: ["stripe", "paypal", "fednow", "sepa", "chase_bai2"],
        recentBatches: [
          {
            batchId: "batch_20260911_01",
            rail: "stripe",
            grossAmountCents: "24500000",
            feeCents: "710500",
            netAmountCents: "23789500",
            status: "MATCHED_AND_SEALED",
            timestamp: "2026-09-11T12:00:00Z",
            proofpackHash: "sha256:7f4c3e1a8904",
          },
        ],
      };
    },
    multiRailFlow: async (_parent, args, context) => {
      if (!context.authenticatedTenantId || context.authenticatedTenantId !== args.tenantId) {
        throw new Error(
          `Tenant mismatch: Authenticated tenant '${context.authenticatedTenantId}' cannot access flow metrics for '${args.tenantId}'`
        );
      }

      return {
        tenantId: args.tenantId,
        windowMinutes: args.windowMinutes || 60,
        stripeVolumeCents: "14500000",
        paypalVolumeCents: "8900000",
        fednowVolumeCents: "12000000",
        sepaVolumeCents: "6400000",
        totalInterchangeSavedCents: "184000",
      };
    },
  },
});
