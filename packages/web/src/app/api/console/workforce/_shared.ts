import { NextResponse } from "next/server";
import { requireActiveSubscriptionOrExceptionIntelligencePack } from "@/lib/security/billing-enforcement";
import { resolveTenantMembershipScope } from "@/lib/supabase/tenant-membership";
import type { NextRequest } from "next/server";

export type TenantGateResult =
  | { ok: true; tenantId: string }
  | { ok: false; response: NextResponse };

/**
 * Fail-closed tenant for console workforce routes (matches /api/console/intelligence pattern).
 */
export async function gateConsoleTenant(request: NextRequest): Promise<TenantGateResult> {
  const billing = await requireActiveSubscriptionOrExceptionIntelligencePack(request);
  if (!billing.allowed) {
    return {
      ok: false,
      response:
        billing.error ??
        NextResponse.json(
          {
            error: "Subscription or Exception Intelligence Pack required",
            code: "INTELLIGENCE_PACK_OR_SUBSCRIPTION_REQUIRED",
          },
          { status: 403 }
        ),
    };
  }

  let tenantIds: string[];
  try {
    const scope = await resolveTenantMembershipScope();
    tenantIds = scope.tenantIds;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Tenant scope is unavailable.",
          code: "TENANT_SCOPE_UNAVAILABLE",
        },
        { status: 503 }
      ),
    };
  }

  if (tenantIds.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No tenant membership found.", code: "TENANT_REQUIRED" },
        { status: 409 }
      ),
    };
  }

  const tenantId = tenantIds[0];
  if (!tenantId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No tenant membership found.", code: "TENANT_REQUIRED" },
        { status: 409 }
      ),
    };
  }

  return { ok: true, tenantId };
}
