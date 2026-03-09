import { NextRequest, NextResponse } from "next/server";
import { getExecutionLedgerEntry } from "@/lib/explorer/ledger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getExecutionLedgerEntry(id);
  if (!entry) {
    return NextResponse.json({ error: "execution_not_found" }, { status: 404 });
  }

  const callerTenant = request.headers.get("x-tenant-id") ?? undefined;
  const isAdmin = request.headers.get("x-settler-admin") === "true";
  if (!isAdmin && callerTenant && callerTenant !== entry.tenant_id) {
    return NextResponse.json({ error: "tenant_scope_violation" }, { status: 403 });
  }

  return NextResponse.json({ entry });
}
