import { NextRequest, NextResponse } from "next/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime

export const GET = withUniversalBillingGate(function GET(request: NextRequest, { params }, { feature: 'GET API' });: { params: { integrationId: string } }) {
  try {
    const { integrationId: _integrationId } = params;
    const searchParams = request.nextUrl.searchParams;
    const currentVersion = searchParams.get("current") || "1.0.0";

    // Mock version data (in production, fetch from integration registry)
    const versionInfo = {
      current: currentVersion,
      latest: "2.1.0",
      changelog: [
        "Improved error handling for API rate limits",
        "Added support for webhook retries",
        "Enhanced data validation",
        "Performance optimizations",
      ],
      breakingChanges: currentVersion.startsWith("1.")
        ? ["API response format changed (migration required)", "Webhook signature format updated"]
        : [],
      requiresMigration: currentVersion.startsWith("1."),
    };

    return NextResponse.json(versionInfo);
  } catch (error) {
    console.error("Error in versions GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}
