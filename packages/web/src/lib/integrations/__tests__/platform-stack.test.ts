import {
  getExternalPlatformStatuses,
  summarizePlatformStatus,
} from "@/lib/integrations/platform-stack";

describe("external platform stack status", () => {
  test("reports disabled integrations truthfully when not enabled", async () => {
    const statuses = await getExternalPlatformStatuses({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_AUTH_ENABLED: "true",
      OPENFGA_ENABLED: "false",
      TEMPORAL_ENABLED: "false",
      NANGO_ENABLED: "false",
      AIRBYTE_ENABLED: "false",
      OTEL_ENABLED: "false",
    } as NodeJS.ProcessEnv);

    const byService = Object.fromEntries(statuses.map((status) => [status.service, status]));
    expect(byService.supabase_auth.state).toBe("configured");
    expect(byService.openfga.state).toBe("disabled");
    expect(byService.temporal.state).toBe("disabled");
    expect(byService.nango.state).toBe("disabled");
    expect(byService.airbyte.state).toBe("disabled");
    expect(byService.opentelemetry.state).toBe("disabled");
    expect(summarizePlatformStatus(statuses)).toBe("healthy");
  });

  test("reports partial and unconfigured states for enabled but incomplete services", async () => {
    const statuses = await getExternalPlatformStatuses({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_ENTERPRISE_SSO_ENABLED: "true",
      OPENFGA_ENABLED: "true",
      OPENFGA_API_URL: "https://openfga.local",
      TEMPORAL_ENABLED: "true",
      TEMPORAL_ADDRESS: "temporal:7233",
      TEMPORAL_NAMESPACE: "default",
      TEMPORAL_TASK_QUEUE: "settler",
      TEMPORAL_WORKER_ENABLED: "false",
      NANGO_ENABLED: "true",
      AIRBYTE_ENABLED: "true",
      OTEL_ENABLED: "true",
    } as NodeJS.ProcessEnv);

    const byService = Object.fromEntries(statuses.map((status) => [status.service, status]));
    expect(byService.supabase_auth.state).toBe("partially_configured");
    expect(byService.openfga.state).toBe("unconfigured");
    expect(byService.temporal.state).toBe("degraded");
    expect(byService.nango.state).toBe("unconfigured");
    expect(byService.airbyte.state).toBe("unconfigured");
    expect(byService.opentelemetry.state).toBe("partially_configured");
    expect(summarizePlatformStatus(statuses)).toBe("degraded");
  });
});
