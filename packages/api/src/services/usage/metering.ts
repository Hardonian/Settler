import { logError } from "../../utils/logger";
import { createDatabaseUsageMeterProviderFromEnv } from "./usage-meter-provider-db";
import {
  UsageEvent,
  USAGE_EVENT_NAME,
  UsageEventName,
  usageEventSchema,
} from "./usage-metering-contract";

const usageMeterProvider = createDatabaseUsageMeterProviderFromEnv();

const LEGACY_METRIC_TO_CANONICAL: Record<string, UsageEventName> = {
  reconciliations: USAGE_EVENT_NAME.RUNS_EXECUTED,
  exports: USAGE_EVENT_NAME.IMPORTS_PROCESSED,
  playground_runs: USAGE_EVENT_NAME.OPERATOR_ACTIONS,
};

export function resolveCanonicalUsageEventName(metricType: string): UsageEventName | null {
  return LEGACY_METRIC_TO_CANONICAL[metricType] ?? null;
}

export async function meterValidatedUsageEvent(event: UsageEvent): Promise<void> {
  const parsed = usageEventSchema.safeParse(event);
  if (!parsed.success) {
    logError("Invalid usage metering event payload", new Error(parsed.error.message), {
      event,
    });
    return;
  }

  try {
    await usageMeterProvider.meter(parsed.data);
  } catch {
    // metering is non-blocking by contract
  }
}

export async function meterFromLegacyUsageMetric(params: {
  tenantId: string;
  runId?: string;
  metricType: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const eventName = resolveCanonicalUsageEventName(params.metricType);
  if (!eventName) {
    return;
  }

  await meterValidatedUsageEvent({
    tenant_id: params.tenantId,
    run_id: params.runId,
    event_name: eventName,
    quantity: params.quantity,
    occurred_at: new Date().toISOString(),
    metadata: {
      metric_type: params.metricType,
      ...(params.metadata ?? {}),
    },
  });
}
