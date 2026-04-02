import { NextRequest, NextResponse } from "next/server";
import { requireAuth, type UnifiedAuthContext } from "@/lib/api/unified-auth";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";

export type TenantCapabilityState =
  | "available"
  | "degraded"
  | "unavailable"
  | "unauthorized"
  | "setup_required"
  | "partial";

export interface TenantCapabilityEnvelope {
  state: Exclude<TenantCapabilityState, "available" | "partial">;
  reason: string;
}

export interface TenantRequestContext {
  auth: UnifiedAuthContext;
  userId: string;
  tenantId: string;
}

export class TenantContextResolutionError extends Error {
  readonly status: number;
  readonly code: string;
  readonly capability: TenantCapabilityEnvelope;

  constructor(status: number, code: string, message: string, capability: TenantCapabilityEnvelope) {
    super(message);
    this.status = status;
    this.code = code;
    this.capability = capability;
  }
}

export async function requireTenantRequestContext(
  request: NextRequest
): Promise<TenantRequestContext> {
  let auth: UnifiedAuthContext;

  try {
    auth = await requireAuth(request);
  } catch {
    throw new TenantContextResolutionError(401, "AUTH_REQUIRED", "Authentication required", {
      state: "unauthorized",
      reason: "auth_required",
    });
  }

  if (auth.tenantId) {
    return {
      auth,
      userId: auth.userId,
      tenantId: auth.tenantId,
    };
  }

  if (auth.type === "api_key") {
    throw new TenantContextResolutionError(
      401,
      "API_KEY_TENANT_REQUIRED",
      "API key requests must include a tenant-bound key.",
      {
        state: "unauthorized",
        reason: "api_key_tenant_required",
      }
    );
  }

  try {
    const { userId, tenantIds } = await resolveTenantMembershipScope();
    const tenantId = resolveTenantForMutation(tenantIds);

    return {
      auth,
      userId,
      tenantId,
    };
  } catch (error) {
    if (error instanceof TenantMembershipError) {
      if (error.status === 401) {
        throw new TenantContextResolutionError(401, error.code, error.message, {
          state: "unauthorized",
          reason: "auth_required",
        });
      }

      if (error.code === "TENANT_REQUIRED" || error.code === "FORBIDDEN") {
        throw new TenantContextResolutionError(
          409,
          "TENANT_CONTEXT_REQUIRED",
          "Select or finish setting up a workspace before using this feature.",
          {
            state: "setup_required",
            reason: "tenant_context_required",
          }
        );
      }

      throw new TenantContextResolutionError(503, error.code, error.message, {
        state: "degraded",
        reason: "tenant_scope_unavailable",
      });
    }

    throw new TenantContextResolutionError(
      503,
      "TENANT_SCOPE_UNAVAILABLE",
      "Tenant scope resolution is currently unavailable.",
      {
        state: "degraded",
        reason: "tenant_scope_unavailable",
      }
    );
  }
}

export function buildTenantContextErrorResponse(error: unknown): NextResponse {
  if (error instanceof TenantContextResolutionError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        capability: error.capability,
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      error: "Tenant context is currently unavailable.",
      code: "TENANT_SCOPE_UNAVAILABLE",
      capability: {
        state: "degraded",
        reason: "tenant_scope_unavailable",
      },
    },
    { status: 503 }
  );
}
