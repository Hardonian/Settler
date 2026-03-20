import { safeLogger } from "@/lib/observability/safe-logger";
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:3002";

interface ReconciliationRunPayload {
  ingestionId: string;
  config?: any;
}

/**
 * Calls the internal 'api' service to trigger a real reconciliation run.
 * This acts as a bridge from the 'web' frontend service to the core backend engine.
 */
export async function triggerInternalReconciliationRun(
  tenantId: string,
  userId: string,
  payload: ReconciliationRunPayload
) {
  const url = `${INTERNAL_API_URL}/api/v1/reconciliation/run`;
  const internalServiceKey = process.env.INTERNAL_SERVICE_TO_SERVICE_KEY;

  if (!internalServiceKey) {
    safeLogger.error(
      "[InternalApiClient] INTERNAL_SERVICE_TO_SERVICE_KEY is not set. Cannot make internal API call."
    );
    throw new Error("Internal service communication is not configured.");
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // Pass tenant and user context for strict downstream scoping.
      "X-Tenant-Id": tenantId,
      "X-User-Id": userId,
    };

    if (internalServiceKey.startsWith("rk_")) {
      headers["X-API-Key"] = internalServiceKey;
    } else {
      headers.Authorization = `Bearer ${internalServiceKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      safeLogger.error("[InternalApiClient] Failed to trigger reconciliation run", {
        status: response.status,
        url,
        errorBody,
      });
      throw new Error(`Internal API call failed with status ${response.status}`);
    }

    const { runId } = await response.json();
    return { runId };
  } catch (error) {
    safeLogger.error("[InternalApiClient] Internal API call threw an exception", {
      url,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
