import { prisma } from "@/shared/db/prismaClient";

const EVENT_TYPE_DELIMITER_REGEX = /[:-]/;

interface AggregateErrorQuantityRow {
  error_quantity: string | number | bigint | null;
}

interface DailyUsageBucketRow {
  day: Date | string;
  calls: string | number | bigint;
  errors: string | number | bigint;
}

export interface UsageSummaryAggregate {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  groupedEventTypes: number;
  matchedRows: number;
}

export interface UsageDailyBucket {
  date: string;
  calls: number;
  errors: number;
}

type NumericLike = string | number | bigint | null | undefined;

function toNumeric(value: NumericLike): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number(value) || 0;
}

export function parseUsageEventType(eventType: string): {
  service: string;
  operation: string;
} {
  const normalized = eventType.trim();
  if (!normalized) {
    return {
      service: "unknown",
      operation: "unknown",
    };
  }

  const [service, ...operationParts] = normalized.split(EVENT_TYPE_DELIMITER_REGEX);

  return {
    service: service || "unknown",
    operation: operationParts.length > 0 ? operationParts.join("-") : "unknown",
  };
}

async function queryErrorQuantity(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Try camelCase schema first (Prisma default), then snake_case fallback.
  const queries = [
    {
      sql: `
        SELECT COALESCE(SUM(CASE
          WHEN ("metadata" ? 'error') OR ("metadata" ->> 'status' = 'error')
          THEN "quantity"
          ELSE 0
        END), 0)::text AS error_quantity
        FROM usage_events
        WHERE "billingAccountId" = $1::uuid
          AND "timestamp" >= $2::timestamptz
          AND "timestamp" <= $3::timestamptz
      `,
      params: [billingAccountId, startDate.toISOString(), endDate.toISOString()],
    },
    {
      sql: `
        SELECT COALESCE(SUM(CASE
          WHEN (metadata ? 'error') OR (metadata ->> 'status' = 'error')
          THEN quantity
          ELSE 0
        END), 0)::text AS error_quantity
        FROM usage_events
        WHERE billing_account_id = $1::uuid
          AND "timestamp" >= $2::timestamptz
          AND "timestamp" <= $3::timestamptz
      `,
      params: [billingAccountId, startDate.toISOString(), endDate.toISOString()],
    },
  ];

  for (const candidate of queries) {
    try {
      const rows = (await prisma.$queryRawUnsafe(
        candidate.sql,
        ...candidate.params
      )) as AggregateErrorQuantityRow[];
      const first = rows[0];
      return toNumeric(first?.error_quantity);
    } catch {
      // Try next schema variant.
    }
  }

  return 0;
}

export async function getUsageSummaryAggregate(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageSummaryAggregate> {
  const grouped = await prisma.usageEvent.groupBy({
    by: ["eventType"],
    where: {
      billingAccountId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      quantity: true,
    },
    _count: {
      _all: true,
    },
  });

  const byService: Record<string, number> = {};
  const byOperation: Record<string, number> = {};

  let totalCalls = 0;
  let matchedRows = 0;

  for (const row of grouped) {
    const quantity = toNumeric(row._sum.quantity);
    totalCalls += quantity;
    matchedRows += row._count._all;

    const { service, operation } = parseUsageEventType(row.eventType);
    byService[service] = (byService[service] || 0) + quantity;
    byOperation[operation] = (byOperation[operation] || 0) + quantity;
  }

  const errorCalls = await queryErrorQuantity(billingAccountId, startDate, endDate);

  return {
    totalCalls,
    byService,
    byOperation,
    errorRate: totalCalls > 0 ? errorCalls / totalCalls : 0,
    groupedEventTypes: grouped.length,
    matchedRows,
  };
}

export async function getUsageDailyBuckets(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageDailyBucket[]> {
  const queries = [
    {
      sql: `
        SELECT
          DATE_TRUNC('day', "timestamp")::date AS day,
          COALESCE(SUM("quantity"), 0)::text AS calls,
          COALESCE(SUM(CASE
            WHEN ("metadata" ? 'error') OR ("metadata" ->> 'status' = 'error')
            THEN "quantity"
            ELSE 0
          END), 0)::text AS errors
        FROM usage_events
        WHERE "billingAccountId" = $1::uuid
          AND "timestamp" >= $2::timestamptz
          AND "timestamp" <= $3::timestamptz
        GROUP BY day
        ORDER BY day ASC
      `,
      params: [billingAccountId, startDate.toISOString(), endDate.toISOString()],
    },
    {
      sql: `
        SELECT
          DATE_TRUNC('day', "timestamp")::date AS day,
          COALESCE(SUM(quantity), 0)::text AS calls,
          COALESCE(SUM(CASE
            WHEN (metadata ? 'error') OR (metadata ->> 'status' = 'error')
            THEN quantity
            ELSE 0
          END), 0)::text AS errors
        FROM usage_events
        WHERE billing_account_id = $1::uuid
          AND "timestamp" >= $2::timestamptz
          AND "timestamp" <= $3::timestamptz
        GROUP BY day
        ORDER BY day ASC
      `,
      params: [billingAccountId, startDate.toISOString(), endDate.toISOString()],
    },
  ];

  for (const candidate of queries) {
    try {
      const rows = (await prisma.$queryRawUnsafe(
        candidate.sql,
        ...candidate.params
      )) as DailyUsageBucketRow[];
      return rows.map((row) => {
        const dayDate = row.day instanceof Date ? row.day : new Date(row.day);
        return {
          date: dayDate.toISOString().slice(0, 10),
          calls: toNumeric(row.calls),
          errors: toNumeric(row.errors),
        };
      });
    } catch {
      // Try the alternate schema variant.
    }
  }

  return [];
}
