import type { Pool, PoolClient, QueryResult } from "pg";

import { PostgresEventStore } from "../../infrastructure/eventsourcing/EventStore";
import type { EventEnvelope } from "../../domain/eventsourcing/EventEnvelope";
import { assertTenantScopedEventCollection } from "../utils/tenant-contract-assertions";

function createMockPool(rows: unknown[]): Pool {
  const query = jest.fn(
    async (): Promise<QueryResult> =>
      ({
        rows: [...rows],
        command: "SELECT",
        rowCount: rows.length,
        oid: 0,
        fields: [],
      }) as unknown as QueryResult
  );

  const connect = jest.fn(
    async (): Promise<PoolClient> =>
      ({
        query: jest.fn(async () => ({ rows: [] })) as unknown as PoolClient["query"],
        release: jest.fn(),
      }) as unknown as PoolClient
  );

  return { query, connect } as unknown as Pool;
}

describe("PostgresEventStore tenant contract", () => {
  it("returns event collections with tenant metadata from query methods", async () => {
    const rows = [
      {
        id: "evt-1",
        aggregate_id: "agg-1",
        aggregate_type: "job",
        event_type: "job.created",
        event_version: 1,
        data: { ok: true },
        metadata: {
          tenant_id: "tenant-1",
          timestamp: "2025-01-01T00:00:00.000Z",
          correlation_id: "corr-1",
        },
        created_at: "2025-01-01T00:00:00.000Z",
      },
    ];

    const store = new PostgresEventStore(createMockPool(rows));

    const byType = await store.getEventsByType("job.created");
    assertTenantScopedEventCollection(byType, "tenant-1");

    const byAggregate = await store.getEvents("agg-1", "job");
    assertTenantScopedEventCollection(byAggregate, "tenant-1");

    const byCorrelation = await store.getEventsByCorrelationId("corr-1");
    assertTenantScopedEventCollection(byCorrelation, "tenant-1");
  });

  it("writes tenant_id in append payload", async () => {
    const query = jest.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [] }));
    const store = new PostgresEventStore({ query } as unknown as Pool);

    const event: EventEnvelope = {
      id: "evt-1",
      aggregate_id: "agg-1",
      aggregate_type: "job",
      event_type: "job.created",
      event_version: 1,
      data: { test: true },
      metadata: {
        tenant_id: "tenant-1",
        timestamp: "2025-01-01T00:00:00.000Z",
        correlation_id: "corr-1",
      },
      created_at: new Date("2025-01-01T00:00:00.000Z"),
    };

    await store.append(event);

    expect(query).toHaveBeenCalledTimes(1);
    const params = (query.mock.calls[0]?.[1] ?? []) as unknown[];
    expect(params[7]).toBe("tenant-1");
  });
});
