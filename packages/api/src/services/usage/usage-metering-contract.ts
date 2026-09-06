import { z } from "zod";

export const USAGE_EVENT_NAME = {
  RUNS_EXECUTED: "runs_executed",
  RECORDS_PROCESSED: "records_processed",
  IMPORTS_PROCESSED: "imports_processed",
  REPLAY_RUNS: "replay_runs",
  OPERATOR_ACTIONS: "operator_actions",
  API_CALLS: "api_calls",
} as const;

export type UsageEventName = (typeof USAGE_EVENT_NAME)[keyof typeof USAGE_EVENT_NAME];

export const usageEventSchema = z.object({
  tenant_id: z.string().min(1),
  run_id: z.string().optional(),
  event_name: z.enum([
    USAGE_EVENT_NAME.RUNS_EXECUTED,
    USAGE_EVENT_NAME.RECORDS_PROCESSED,
    USAGE_EVENT_NAME.IMPORTS_PROCESSED,
    USAGE_EVENT_NAME.REPLAY_RUNS,
    USAGE_EVENT_NAME.OPERATOR_ACTIONS,
    USAGE_EVENT_NAME.API_CALLS,
  ]),
  quantity: z.number().nonnegative(),
  occurred_at: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UsageEvent = z.infer<typeof usageEventSchema>;

export interface UsageMeterProvider {
  readonly providerName: string;
  readonly status: "installed" | "configured" | "unavailable" | "unsupported_oss";
  meter(event: UsageEvent): Promise<void>;
}

export class NoopUsageMeterProvider implements UsageMeterProvider {
  readonly providerName = "noop";
  readonly status = "unavailable" as const;

  async meter(_event: UsageEvent): Promise<void> {
    return;
  }
}
