import {
  assertTenantMembership,
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { authenticateRequest } from "@/lib/api/unified-auth";
import type { NextRequest } from "next/server";

export interface ConsoleTenantContext {
  tenantId: string;
  userId: string;
}

/**
 * Resolve tenant + user for console BFF routes: browser session only (never API keys).
 */
export async function requireConsoleTenantContext(
  request: NextRequest
): Promise<ConsoleTenantContext> {
  const authContext = await authenticateRequest(request);
  if (!authContext) {
    throw new TenantMembershipError(401, "UNAUTHORIZED", "Authentication required");
  }
  if (authContext.type !== "session") {
    throw new TenantMembershipError(
      403,
      "SESSION_REQUIRED",
      "This console endpoint requires a signed-in browser session"
    );
  }

  const { userId, tenantIds } = await resolveTenantMembershipScope();
  let tenantId: string;
  if (authContext.tenantId) {
    assertTenantMembership(tenantIds, authContext.tenantId);
    tenantId = authContext.tenantId;
  } else {
    tenantId = resolveTenantForMutation(tenantIds);
  }

  return { tenantId, userId };
}
