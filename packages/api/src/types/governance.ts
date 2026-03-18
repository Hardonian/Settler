/**
 * Governance State Types
 * Shared type definitions for governance/freeze state across the platform
 */

export interface GovernanceState {
  frozen: boolean;
  frozen_at: string | null;
  frozen_by: string | null;
  freeze_reason: string | null;
  updated_at: string;
}

export interface BlockedByFreezeError {
  error: "GOVERNANCE_FREEZE_ACTIVE";
  message: string;
  frozen: true;
  frozen_at?: string;
  freeze_reason?: string;
  traceId?: string;
}

/**
 * Standard 423 Locked response for frozen operations
 */
export function createFreezeBlockedResponse(
  freezeState: GovernanceState,
  customMessage?: string,
  traceId?: string
): { statusCode: 423; body: BlockedByFreezeError } {
  return {
    statusCode: 423,
    body: {
      error: "GOVERNANCE_FREEZE_ACTIVE",
      message:
        customMessage ||
        "Operation blocked: Tenant is in read-only mode. Unfreeze the system to enable write operations.",
      frozen: true,
      frozen_at: freezeState.frozen_at || undefined,
      freeze_reason: freezeState.freeze_reason || undefined,
      traceId,
    },
  };
}
