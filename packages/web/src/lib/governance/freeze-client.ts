export interface GovernanceFreezeErrorDetails {
  message: string;
  reason: string | null;
  frozenAt: string | null;
  traceId: string | null;
}

interface GovernanceFreezePayload {
  error?: unknown;
  message?: unknown;
  freeze_reason?: unknown;
  frozen_at?: unknown;
  traceId?: unknown;
}

export function parseGovernanceFreezeError(
  payload: unknown,
  status?: number
): GovernanceFreezeErrorDetails | null {
  if (!payload || typeof payload !== "object") {
    return status === 423
      ? {
          message: "This action is blocked while the tenant is frozen.",
          reason: null,
          frozenAt: null,
          traceId: null,
        }
      : null;
  }

  const candidate = payload as GovernanceFreezePayload;
  const isFreezeError = status === 423 || candidate.error === "GOVERNANCE_FREEZE_ACTIVE";

  if (!isFreezeError) {
    return null;
  }

  return {
    message:
      typeof candidate.message === "string" && candidate.message.trim().length > 0
        ? candidate.message
        : "This action is blocked while the tenant is frozen.",
    reason:
      typeof candidate.freeze_reason === "string" && candidate.freeze_reason.trim().length > 0
        ? candidate.freeze_reason
        : null,
    frozenAt: typeof candidate.frozen_at === "string" ? candidate.frozen_at : null,
    traceId: typeof candidate.traceId === "string" ? candidate.traceId : null,
  };
}

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { message?: unknown; error?: unknown };

  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message;
  }

  if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
    return candidate.error;
  }

  return fallback;
}

export function getGovernanceRecoveryHref() {
  return "/console/settings?tab=governance#governance";
}
