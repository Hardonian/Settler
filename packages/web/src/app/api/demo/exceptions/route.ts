/**
 * Demo Exceptions API
 *
 * GET /api/demo/exceptions?tenantId=...&status=...&severity=...
 * No auth required. Read-only, deterministic.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getShowcaseDataset,
  getDefaultShowcaseTenant,
} from "@/lib/demo/showcase-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId =
    searchParams.get("tenantId") || getDefaultShowcaseTenant().id;
  const statusFilter = searchParams.get("status")?.toLowerCase();
  const severityFilter = searchParams.get("severity")?.toLowerCase();
  const runIdFilter = searchParams.get("runId");

  let exceptions = getShowcaseDataset().exceptions.filter(
    (e) => e.tenantId === tenantId
  );

  if (statusFilter) {
    exceptions = exceptions.filter((e) => e.status === statusFilter);
  }
  if (severityFilter) {
    exceptions = exceptions.filter((e) => e.severity === severityFilter);
  }
  if (runIdFilter) {
    exceptions = exceptions.filter((e) => e.runId === runIdFilter);
  }

  return NextResponse.json(exceptions);
}
