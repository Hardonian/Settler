/**
 * Governance Middleware
 * Enforces tenant-level governance controls including freeze state
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { query } from "../db";
import { getCachedTenantFreezeState } from "../utils/governance-cache";

export interface GovernanceError extends Error {
  code: string;
  statusCode: number;
  frozen: boolean;
  frozen_at?: string;
  freeze_reason?: string;
}

/**
 * Check if tenant is currently frozen
 */
export async function checkTenantFrozen(tenantId: string): Promise<{
  frozen: boolean;
  frozen_at?: string;
  frozen_by?: string;
  freeze_reason?: string;
}> {
  try {
    const result = await query<{
      frozen: boolean;
      frozen_at: string | null;
      frozen_by: string | null;
      freeze_reason: string | null;
    }>(
      `SELECT frozen, frozen_at, frozen_by, freeze_reason FROM tenant_governance WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.length === 0) {
      // No governance record = unfrozen by default
      return { frozen: false };
    }

    const state = result[0];
    if (!state) {
      return { frozen: false };
    }

    return {
      frozen: state.frozen,
      frozen_at: state.frozen_at || undefined,
      frozen_by: state.frozen_by || undefined,
      freeze_reason: state.freeze_reason || undefined,
    };
  } catch (error) {
    // On any error, default to FROZEN. This is a "fail-closed" security posture.
    console.error(`Governance check failed for tenant ${tenantId}. Defaulting to frozen.`, error);
    return { frozen: true };
  }
}

/**
 * Middleware: Block write operations when tenant is frozen
 * Use this on mutation routes that should respect freeze state
 */
export function enforceFreezeState(options?: {
  /** Allow execution even when frozen (for governance unfreeze itself) */
  allowWhenFrozen?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Use cached freeze state (default: true) */
  useCache?: boolean;
}) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip check if explicitly allowed
    if (options?.allowWhenFrozen) {
      next();
      return;
    }

    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(400).json({
        error: "TENANT_CONTEXT_REQUIRED",
        message: "Tenant context is required",
        traceId: req.traceId,
      });
      return;
    }

    // Use cached state by default for performance
    const freezeState =
      options?.useCache === false
        ? await checkTenantFrozen(tenantId)
        : await getCachedTenantFreezeState(tenantId);

    if (freezeState.frozen) {
      const error: GovernanceError = new Error(
        options?.errorMessage ||
          "Operation blocked: Tenant is in read-only mode. Unfreeze the system to enable write operations."
      ) as GovernanceError;
      error.code = "GOVERNANCE_FREEZE_ACTIVE";
      error.statusCode = 423; // 423 Locked
      error.frozen = true;
      error.frozen_at = freezeState.frozen_at;
      error.freeze_reason = freezeState.freeze_reason;

      res.status(423).json({
        error: "GOVERNANCE_FREEZE_ACTIVE",
        message: error.message,
        frozen: true,
        frozen_at: freezeState.frozen_at,
        freeze_reason: freezeState.freeze_reason,
        traceId: req.traceId,
      });
      return;
    }

    next();
  };
}

/**
 * Explicit governance bypass - only for critical admin/governance operations
 * Documents intent to skip freeze checks
 */
export const bypassFreeze = enforceFreezeState({ allowWhenFrozen: true });
