import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { getTenantContext } from "@/lib/tenant/server";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
} from "@/lib/supabase/tenant-membership";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL =
  process.env.SETTLER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function resolveAuthenticatedTenantId(): Promise<string> {
  const [scope, tenantContext] = await Promise.all([
    resolveTenantMembershipScope(),
    getTenantContext(),
  ]);
  return resolveTenantForMutation(scope.tenantIds, tenantContext.tenantId || null);
}

function upstreamHeaders(request: NextRequest, tenantId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
    Authorization: request.headers.get("authorization") || "",
  };
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const tenantId = await resolveAuthenticatedTenantId();
      const response = await fetch(
        `${API_BASE_URL}/api/v2/ledger/parity/status?tenantId=${tenantId}`,
        {
          headers: upstreamHeaders(request, tenantId),
          cache: "no-store",
        }
      );
      const body = await response.json().catch(() => ({ error: "Invalid upstream response" }));
      return NextResponse.json(body, { status: response.status });
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "Failed to fetch ledger parity status" },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    try {
      const tenantId = await resolveAuthenticatedTenantId();
      const payload = await request.json().catch(() => ({}));

      const response = await fetch(`${API_BASE_URL}/api/v2/ledger/parity/verify`, {
        method: "POST",
        headers: upstreamHeaders(request, tenantId),
        body: JSON.stringify({ ...payload, tenantId }),
      });
      const body = await response.json().catch(() => ({ error: "Invalid upstream response" }));
      return NextResponse.json(body, { status: response.status });
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "Failed to execute parity verification" },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
