/**
 * Demo Tenants API
 *
 * GET /api/demo/tenants — returns all showcase tenants.
 * No auth required. Read-only, deterministic.
 */

import { NextResponse } from "next/server";
import { getShowcaseDataset } from "@/lib/demo/showcase-data";

export const runtime = "nodejs";

export async function GET() {
  const { tenants } = getShowcaseDataset();
  return NextResponse.json(tenants);
}
