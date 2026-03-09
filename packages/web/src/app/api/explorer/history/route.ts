import { NextRequest, NextResponse } from "next/server";
import { listExecutionLedgerEntries } from "@/lib/explorer/ledger";

export async function GET(request: NextRequest) {
  const requestedTenant = request.nextUrl.searchParams.get("tenant") ?? undefined;
  const callerTenant = request.headers.get("x-tenant-id") ?? undefined;
  const isAdmin = request.headers.get("x-settler-admin") === "true";

  if (!isAdmin && requestedTenant && callerTenant && requestedTenant !== callerTenant) {
    return NextResponse.json({ error: "tenant_scope_violation" }, { status: 403 });
  }

  const tenantId = isAdmin ? requestedTenant : (requestedTenant ?? callerTenant);
  const offset = Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);
  const entries = await listExecutionLedgerEntries({ tenantId, offset, limit });

  return NextResponse.json({ entries, offset, limit, tenant: tenantId ?? null });
}
