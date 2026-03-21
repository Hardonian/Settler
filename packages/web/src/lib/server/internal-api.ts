import { safeLogger } from "@/lib/observability/safe-logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReconciliationRunPayload = { ingestionId: string; config?: any };

/**
 * Internal engine base URL. Must be explicitly set in production.
 * Defaults to localhost only for local dev — no silent fallback in production.
 */
function getInternalApiUrl(): string {
  const url = process.env.INTERNAL_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw Object.assign(
        new Error("INTERNAL_API_URL is not configured. Reconciliation engine unavailable."),
        { code: "ENGINE_NOT_CONFIGURED", status: 503 }
      );
    }
    return "http://localhost:3002";
  }
  return url;
}

/** Exported to allow callers to surface a 503 before making real network calls. */
export function assertInternalEngineConfigured(): void {
  getInternalApiUrl(); // throws if misconfigured in production
}

/**
 * Check whether the internal reconciliation engine is reachable.
 * Returns { ok: true } or { ok: false, reason: string }.
 */
export async function checkInternalEngineHealth(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  let baseUrl: string;
  try {
    baseUrl = getInternalApiUrl();
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Engine not configured" };
  }

  const internalServiceKey = process.env.INTERNAL_SERVICE_TO_SERVICE_KEY;
  if (!internalServiceKey) {
    return { ok: false, reason: "INTERNAL_SERVICE_TO_SERVICE_KEY not set" };
  }

  try {
    const headers: Record<string, string> = internalServiceKey.startsWith("rk_")
      ? { "X-API-Key": internalServiceKey }
      : { Authorization: `Bearer ${internalServiceKey}` };

    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      return { ok: false, reason: `Engine health check returned HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, reason: `Engine unreachable: ${msg}` };
  }
}

/**
 * Calls the internal reconciliation engine to trigger a real run.
 * Fails fast with a 503 if the engine is not configured or unreachable.
 */
export async function triggerInternalReconciliationRun(
  tenantId: string,
  userId: string,
  payload: ReconciliationRunPayload
) {
  const internalServiceKey = process.env.INTERNAL_SERVICE_TO_SERVICE_KEY;

  if (!internalServiceKey) {
    safeLogger.error(
      "[InternalApiClient] INTERNAL_SERVICE_TO_SERVICE_KEY is not set. Cannot make internal API call."
    );
    throw Object.assign(
      new Error("Reconciliation engine not configured. Contact your system administrator."),
      { code: "ENGINE_NOT_CONFIGURED", status: 503 }
    );
  }

  let baseUrl: string;
  try {
    baseUrl = getInternalApiUrl();
  } catch (err) {
    throw Object.assign(
      new Error("Reconciliation engine not configured."),
      { code: "ENGINE_NOT_CONFIGURED", status: 503, cause: err }
    );
  }

  const url = `${baseUrl}/api/v1/reconciliation/run`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
    "X-User-Id": userId,
    ...(internalServiceKey.startsWith("rk_")
      ? { "X-API-Key": internalServiceKey }
      : { Authorization: `Bearer ${internalServiceKey}` }),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    safeLogger.error("[InternalApiClient] Engine unreachable", { url, error: msg });
    throw Object.assign(
      new Error(`Reconciliation engine unreachable: ${msg}`),
      { code: "ENGINE_UNAVAILABLE", status: 503 }
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    safeLogger.error("[InternalApiClient] Failed to trigger reconciliation run", {
      status: response.status,
      url,
      errorBody,
    });
    if (response.status === 503 || response.status === 502) {
      throw Object.assign(
        new Error("Reconciliation engine is currently unavailable. Please try again later."),
        { code: "ENGINE_UNAVAILABLE", status: 503 }
      );
    }
    throw new Error(`Internal API call failed with status ${response.status}`);
  }

  const { runId } = await response.json();
  return { runId };
}
