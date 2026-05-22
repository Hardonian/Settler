/**
 * Public Reality API Route
 *
 * GET /api/public/reality - Get public-facing reality metrics for /trust page
 * Filtered and aggregated view suitable for public consumption
 */

import { NextRequest, NextResponse } from "next/server";
import { publicRoute } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { getPublicRealityData } from "@/lib/public/reality-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/public/reality
 */
export const GET = withSecurity(
  publicRoute(async function GET(_request: NextRequest) {
    const data = await getPublicRealityData();
    return NextResponse.json(data);
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
