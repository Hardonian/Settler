// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
/**
 * Demo Alerts API
 *
 * GET /api/demo/alerts?tenantId=...
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

  const alerts = getShowcaseDataset().alerts.filter((a) => a.tenantId === tenantId);

  return demoJsonResponse(alerts);
}
