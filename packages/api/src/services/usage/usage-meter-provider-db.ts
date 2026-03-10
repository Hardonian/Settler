import { query } from "../../db";
import { logError } from "../../utils/logger";
import { UsageEvent, UsageMeterProvider } from "./usage-metering-contract";

export class DatabaseUsageMeterProvider implements UsageMeterProvider {
  readonly providerName = "database_audit_log";
  readonly status: "configured" | "unavailable";

  constructor(private readonly enabled: boolean) {
    this.status = enabled ? "configured" : "unavailable";
  }

  async meter(event: UsageEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await query(
        `INSERT INTO audit_logs (event, tenant_id, metadata, path)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [
          "usage_metered",
          event.tenant_id,
          JSON.stringify({
            usage_event_name: event.event_name,
            run_id: event.run_id ?? null,
            quantity: event.quantity,
            occurred_at: event.occurred_at,
            metadata: event.metadata ?? {},
          }),
          "/internal/usage-meter",
        ]
      );
    } catch (error) {
      logError("Failed to persist usage metering event", error, {
        tenantId: event.tenant_id,
        eventName: event.event_name,
      });
      throw error;
    }
  }
}

export function createDatabaseUsageMeterProviderFromEnv(): DatabaseUsageMeterProvider {
  const enabled =
    process.env.USAGE_METER_DB_ENABLED === "1" || process.env.USAGE_METER_DB_ENABLED === "true";

  return new DatabaseUsageMeterProvider(enabled);
}
