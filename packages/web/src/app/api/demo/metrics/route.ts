/**
 * Demo Metrics API
 *
 * GET /api/demo/metrics?tenantId=...
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

  const metrics = getShowcaseDataset().metrics.find(
    (m) => m.tenantId === tenantId
  );

  if (!metrics) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(metrics);
}
