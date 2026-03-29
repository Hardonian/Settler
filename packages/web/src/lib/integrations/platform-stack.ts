import { appLogger } from "@/lib/utils/logger";

export type ExternalServiceKey =
  | "supabase_auth"
  | "openfga"
  | "temporal"
  | "opentelemetry"
  | "nango"
  | "airbyte";

export type IntegrationState =
  | "disabled"
  | "unconfigured"
  | "partially_configured"
  | "configured"
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unsupported";

export interface ExternalServiceStatus {
  service: ExternalServiceKey;
  enabled: boolean;
  configured: boolean;
  state: IntegrationState;
  reason: string;
  details: Record<string, string | number | boolean | null>;
}

interface ProbeTarget {
  url: string;
  timeoutMs?: number;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

async function probeHttp(target: ProbeTarget): Promise<"healthy" | "unavailable"> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), target.timeoutMs ?? 1500);
  try {
    const response = await fetch(target.url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok ? "healthy" : "unavailable";
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timeout);
  }
}

function getSupabaseStatus(env: NodeJS.ProcessEnv): ExternalServiceStatus {
  const enabled = parseBoolean(env.SUPABASE_AUTH_ENABLED, true);
  const hasPublicUrl = hasValue(env.NEXT_PUBLIC_SUPABASE_URL) || hasValue(env.SUPABASE_URL);
  const hasAnon = hasValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || hasValue(env.SUPABASE_ANON_KEY);
  const configured = hasPublicUrl && hasAnon;

  const enterpriseSsoEnabled = parseBoolean(env.SUPABASE_ENTERPRISE_SSO_ENABLED, false);
  const enterpriseSsoProviderConfigured =
    hasValue(env.SUPABASE_ENTERPRISE_SSO_PROVIDER_ID) &&
    hasValue(env.SUPABASE_ENTERPRISE_SSO_DOMAIN);

  let state: IntegrationState = "configured";
  let reason = "Supabase Auth configured";
  if (!enabled) {
    state = "disabled";
    reason = "SUPABASE_AUTH_ENABLED is false";
  } else if (!configured) {
    state = "unconfigured";
    reason = "Missing Supabase auth URL or anon key";
  } else if (enterpriseSsoEnabled && !enterpriseSsoProviderConfigured) {
    state = "partially_configured";
    reason = "Enterprise SSO enabled but provider/domain not fully configured";
  }

  return {
    service: "supabase_auth",
    enabled,
    configured,
    state,
    reason,
    details: {
      enterprise_sso_enabled: enterpriseSsoEnabled,
      enterprise_sso_state: enterpriseSsoEnabled
        ? enterpriseSsoProviderConfigured
          ? "configured"
          : "unconfigured"
        : "disabled",
      auth_url_present: hasPublicUrl,
      anon_key_present: hasAnon,
    },
  };
}

async function getOpenFgaStatus(env: NodeJS.ProcessEnv): Promise<ExternalServiceStatus> {
  const enabled = parseBoolean(env.OPENFGA_ENABLED, false);
  const configured = hasValue(env.OPENFGA_API_URL) && hasValue(env.OPENFGA_STORE_ID);

  if (!enabled) {
    return {
      service: "openfga",
      enabled,
      configured,
      state: "disabled",
      reason: "OPENFGA_ENABLED is false",
      details: {},
    };
  }

  if (!configured) {
    return {
      service: "openfga",
      enabled,
      configured,
      state: "unconfigured",
      reason: "Missing OPENFGA_API_URL or OPENFGA_STORE_ID",
      details: {
        model_id_present: hasValue(env.OPENFGA_MODEL_ID),
      },
    };
  }

  const probeUrl =
    env.OPENFGA_HEALTHCHECK_URL || `${env.OPENFGA_API_URL!.replace(/\/$/, "")}/healthz`;
  const health = await probeHttp({ url: probeUrl });

  return {
    service: "openfga",
    enabled,
    configured,
    state: health,
    reason: health === "healthy" ? "OpenFGA reachable" : "OpenFGA health probe failed",
    details: {
      store_id_present: true,
      model_id_present: hasValue(env.OPENFGA_MODEL_ID),
      probe_url: probeUrl,
    },
  };
}

function getTemporalStatus(env: NodeJS.ProcessEnv): ExternalServiceStatus {
  const enabled = parseBoolean(env.TEMPORAL_ENABLED, false);
  const workerEnabled = parseBoolean(env.TEMPORAL_WORKER_ENABLED, false);
  const configured =
    hasValue(env.TEMPORAL_ADDRESS) &&
    hasValue(env.TEMPORAL_NAMESPACE) &&
    hasValue(env.TEMPORAL_TASK_QUEUE);

  if (!enabled) {
    return {
      service: "temporal",
      enabled,
      configured,
      state: "disabled",
      reason: "TEMPORAL_ENABLED is false",
      details: { worker_enabled: workerEnabled },
    };
  }

  if (!configured) {
    return {
      service: "temporal",
      enabled,
      configured,
      state: "unconfigured",
      reason: "Missing TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, or TEMPORAL_TASK_QUEUE",
      details: { worker_enabled: workerEnabled },
    };
  }

  return {
    service: "temporal",
    enabled,
    configured,
    state: workerEnabled ? "configured" : "degraded",
    reason: workerEnabled
      ? "Temporal client and worker declared configured"
      : "Temporal client configured but worker disabled",
    details: {
      worker_enabled: workerEnabled,
      namespace: env.TEMPORAL_NAMESPACE || null,
      task_queue: env.TEMPORAL_TASK_QUEUE || null,
    },
  };
}

function getOtelStatus(env: NodeJS.ProcessEnv): ExternalServiceStatus {
  const explicitEnabled = parseBoolean(env.OTEL_ENABLED, false);
  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT || env.OTLP_ENDPOINT;
  const enabled = explicitEnabled || hasValue(endpoint);
  const configured = hasValue(endpoint);

  if (!enabled) {
    return {
      service: "opentelemetry",
      enabled,
      configured,
      state: "disabled",
      reason: "OTEL is not enabled",
      details: {},
    };
  }

  if (!configured) {
    return {
      service: "opentelemetry",
      enabled,
      configured,
      state: "partially_configured",
      reason: "OTEL enabled but exporter endpoint missing",
      details: {},
    };
  }

  return {
    service: "opentelemetry",
    enabled,
    configured,
    state: "configured",
    reason: "OTEL exporter endpoint configured",
    details: {
      exporter: endpoint || null,
      service_name: env.OTEL_SERVICE_NAME || env.SERVICE_NAME || "settler-web",
    },
  };
}

function getNangoStatus(env: NodeJS.ProcessEnv): ExternalServiceStatus {
  const enabled = parseBoolean(env.NANGO_ENABLED, false);
  const configured = hasValue(env.NANGO_BASE_URL) && hasValue(env.NANGO_SECRET_KEY);

  if (!enabled) {
    return {
      service: "nango",
      enabled,
      configured,
      state: "disabled",
      reason: "NANGO_ENABLED is false",
      details: {},
    };
  }

  return {
    service: "nango",
    enabled,
    configured,
    state: configured ? "configured" : "unconfigured",
    reason: configured
      ? "Nango API credentials configured"
      : "Missing NANGO_BASE_URL or NANGO_SECRET_KEY",
    details: {
      provider_config_keys_present: hasValue(env.NANGO_PROVIDER_CONFIGS_JSON),
    },
  };
}

function getAirbyteStatus(env: NodeJS.ProcessEnv): ExternalServiceStatus {
  const enabled = parseBoolean(env.AIRBYTE_ENABLED, false);
  const hasAuth =
    (hasValue(env.AIRBYTE_CLIENT_ID) && hasValue(env.AIRBYTE_CLIENT_SECRET)) ||
    hasValue(env.AIRBYTE_API_KEY);
  const configured = hasValue(env.AIRBYTE_BASE_URL) && hasAuth;

  if (!enabled) {
    return {
      service: "airbyte",
      enabled,
      configured,
      state: "disabled",
      reason: "AIRBYTE_ENABLED is false",
      details: {},
    };
  }

  return {
    service: "airbyte",
    enabled,
    configured,
    state: configured ? "configured" : "unconfigured",
    reason: configured
      ? "Airbyte API endpoint/auth configured"
      : "Missing AIRBYTE_BASE_URL or credentials",
    details: {
      workspace_id_present: hasValue(env.AIRBYTE_WORKSPACE_ID),
      supports_cdc: true,
    },
  };
}

export async function getExternalPlatformStatuses(
  env: NodeJS.ProcessEnv = process.env
): Promise<ExternalServiceStatus[]> {
  try {
    return [
      getSupabaseStatus(env),
      await getOpenFgaStatus(env),
      getTemporalStatus(env),
      getOtelStatus(env),
      getNangoStatus(env),
      getAirbyteStatus(env),
    ];
  } catch (error) {
    appLogger.error("Failed to resolve external platform statuses", { error });
    return [
      {
        service: "supabase_auth",
        enabled: true,
        configured: false,
        state: "unavailable",
        reason: "Failed to resolve platform status",
        details: {},
      },
    ];
  }
}

export function summarizePlatformStatus(services: ExternalServiceStatus[]): "healthy" | "degraded" {
  return services.some((service) =>
    ["unavailable", "degraded", "unconfigured", "partially_configured"].includes(service.state)
  )
    ? "degraded"
    : "healthy";
}
