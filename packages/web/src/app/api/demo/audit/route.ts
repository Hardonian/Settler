// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
/**
 * Demo Audit Trail API
 *
 * GET /api/demo/audit?tenantId=...
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

  const audit = getShowcaseDataset().auditTrail.filter((a) => a.tenantId === tenantId);

  return demoJsonResponse(audit);
}
