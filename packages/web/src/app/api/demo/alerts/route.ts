/**
 * Demo Alerts API
 *
 * GET /api/demo/alerts?tenantId=...
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

  const alerts = getShowcaseDataset().alerts.filter(
    (a) => a.tenantId === tenantId
  );

  return NextResponse.json(alerts);
}
