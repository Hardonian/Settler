/**
 * Demo Metrics API
 *
 * GET /api/demo/metrics?tenantId=...
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

  const metrics = getShowcaseDataset().metrics.find((m) => m.tenantId === tenantId);

  if (!metrics) {
    return demoJsonResponse({ error: "Tenant not found" }, 404);
  }

  return demoJsonResponse(metrics);
}
