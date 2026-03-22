/**
 * Demo Runs API
 *
 * GET /api/demo/runs?tenantId=... — returns showcase runs.
 * Falls back to default tenant (Acme Commerce) when tenantId is omitted.
 * No auth required. Read-only, deterministic.
 */

import { NextRequest } from "next/server";
import { getShowcaseDataset, getDefaultShowcaseTenant } from "@/lib/demo/showcase-data";
import { checkDemoRateLimit, demoJsonResponse } from "@/lib/demo/demo-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limited = checkDemoRateLimit(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") || getDefaultShowcaseTenant().id;
  const statusFilter = searchParams.get("status")?.toLowerCase();
  const searchFilter = searchParams.get("search")?.trim().toLowerCase();

  let runs = getShowcaseDataset().runs.filter((r) => r.tenantId === tenantId);

  if (statusFilter) {
    runs = runs.filter((r) => r.status === statusFilter);
  }
  if (searchFilter) {
    runs = runs.filter((r) => `${r.id} ${r.name}`.toLowerCase().includes(searchFilter));
  }

  return demoJsonResponse(runs);
}
