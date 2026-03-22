/**
 * Demo Integrations API
 *
 * GET /api/demo/integrations?tenantId=...
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

  const integrations = getShowcaseDataset().integrations.filter(
    (i) => i.tenantId === tenantId
  );

  return NextResponse.json(integrations);
}
