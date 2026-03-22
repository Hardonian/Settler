/**
 * Demo Tenants API
 *
 * GET /api/demo/tenants — returns all showcase tenants.
 * No auth required. Read-only, deterministic.
 */

import { NextRequest } from "next/server";
import { getShowcaseDataset } from "@/lib/demo/showcase-data";
import { checkDemoRateLimit, demoJsonResponse } from "@/lib/demo/demo-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limited = checkDemoRateLimit(request);
  if (limited) return limited;

  const { tenants } = getShowcaseDataset();
  return demoJsonResponse(tenants);
}
