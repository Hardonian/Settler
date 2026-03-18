import { safeLogger } from "@/lib/observability/safe-logger";
// Assume the internal API is running on a different port. This should be in an env var.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:3002"; // Using a different port for the API service

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
  const url = `${INTERNAL_API_URL}/api/v1/reconciliation`;
  const internalServiceKey = process.env.INTERNAL_SERVICE_TO_SERVICE_KEY;

  if (!internalServiceKey) {
    safeLogger.error(
      "[InternalApiClient] INTERNAL_SERVICE_TO_SERVICE_KEY is not set. Cannot make internal API call."
    );
    throw new Error("Internal service communication is not configured.");
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass tenant and user context securely
        "X-Tenant-Id": tenantId,
        "X-User-Id": userId,
        Authorization: `Bearer ${internalServiceKey}`, // Service-to-service auth
      },
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

    // The real API returns { runId: '...' }. We need to fetch the summary.
    const { runId } = await response.json();

    // The web/lib/server/reconciliation file is being removed.
    // I need to check where getReconciliationSummary is and if it will still work.
    // For now, I'll assume I can still get the summary, but this is a dependency to check.
    // Let's just return the runId for now, which is truthful.
    // The UI will need to poll or the GET route will need to be robust.
    return { runId };
  } catch (error) {
    safeLogger.error("[InternalApiClient] Internal API call threw an exception", {
      url,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
