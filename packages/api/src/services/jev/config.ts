export type JevMode = "off" | "shadow" | "recommend";

export interface JevConfig {
  mode: JevMode;
  apiKey?: string;
  baseURL?: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  batchSize: number;
  minConfidence: number;
  circuitFailureThreshold: number;
  circuitResetMs: number;
  tenantAllowlist: ReadonlySet<string>;
}

const clampInteger = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const clampNumber = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

export function loadJevConfig(
  source: Readonly<Record<string, string | undefined>> = process.env
): JevConfig {
  const configuredMode = source.JEV_MODE?.trim().toLowerCase();
  const mode: JevMode =
    configuredMode === "shadow" || configuredMode === "recommend" ? configuredMode : "off";
  const allowlist = new Set(
    (source.JEV_TENANT_ALLOWLIST ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  return {
    mode,
    apiKey: source.TYPESAFE_API_KEY?.trim() || undefined,
    baseURL: source.TYPESAFE_BASE_URL?.trim() || undefined,
    model: source.TYPESAFE_DEFAULT_MODEL?.trim() || "jev-latest",
    timeoutMs: clampInteger(source.JEV_TIMEOUT_MS, 3_000, 500, 15_000),
    maxRetries: clampInteger(source.JEV_MAX_RETRIES, 1, 0, 3),
    batchSize: clampInteger(source.JEV_BATCH_SIZE, 10, 1, 20),
    minConfidence: clampNumber(source.JEV_MIN_CONFIDENCE, 0.82, 0.5, 0.99),
    circuitFailureThreshold: clampInteger(source.JEV_CIRCUIT_FAILURE_THRESHOLD, 3, 1, 20),
    circuitResetMs: clampInteger(source.JEV_CIRCUIT_RESET_MS, 60_000, 5_000, 600_000),
    tenantAllowlist: allowlist,
  };
}

export function isJevEnabledForTenant(config: JevConfig, tenantId: string): boolean {
  if (config.mode === "off" || !config.apiKey) return false;
  return config.tenantAllowlist.has("*") || config.tenantAllowlist.has(tenantId);
}
