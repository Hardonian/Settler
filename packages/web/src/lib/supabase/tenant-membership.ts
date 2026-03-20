import { createClient } from "@/lib/supabase/server";

export class TenantMembershipError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface TenantMembershipScope {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  tenantIds: string[];
}

export async function resolveTenantMembershipScope(): Promise<TenantMembershipScope> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new TenantMembershipError(401, "UNAUTHORIZED", "Authentication required");
  }

  const { data: memberships, error: membershipsError } = (await supabase
    .from("tenant_users" as any)
    .select("tenant_id")
    .eq("user_id", user.id)) as {
    data: Array<{ tenant_id: string | null }> | null;
    error: { message?: string } | null;
  };

  if (membershipsError) {
    throw new TenantMembershipError(
      500,
      "TENANT_SCOPE_LOOKUP_FAILED",
      "Failed to resolve tenant scope"
    );
  }

  const tenantIds = Array.from(
    new Set(
      (memberships || [])
        .map((membership) => membership.tenant_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (tenantIds.length === 0) {
    throw new TenantMembershipError(403, "FORBIDDEN", "No tenant membership found");
  }

  return {
    supabase,
    userId: user.id,
    tenantIds,
  };
}

export function assertTenantMembership(tenantIds: string[], tenantId: string): void {
  if (!tenantIds.includes(tenantId)) {
    throw new TenantMembershipError(403, "FORBIDDEN", "Tenant access denied");
  }
}

export function resolveTenantForMutation(
  tenantIds: string[],
  requestedTenantId?: string | null
): string {
  if (requestedTenantId) {
    assertTenantMembership(tenantIds, requestedTenantId);
    return requestedTenantId;
  }

  if (tenantIds.length === 1) {
    const [firstTenantId] = tenantIds;
    if (firstTenantId) {
      return firstTenantId;
    }
  }

  throw new TenantMembershipError(
    400,
    "TENANT_REQUIRED",
    "Explicit tenant_id/workspace_id is required for multi-tenant users"
  );
}
