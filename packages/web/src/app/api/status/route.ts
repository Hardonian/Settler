import { NextRequest, NextResponse } from "next/server";

// Cache status for 30 seconds to reduce load while keeping it fresh
export const revalidate = 30;
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // In production, fetch from monitoring system (e.g., UptimeRobot, Pingdom)
    // For now, return mock data
    const systems = [
      {
        name: "API",
        status: "operational" as const,
        uptime: 99.99,
      },
      {
        name: "Database",
        status: "operational" as const,
        uptime: 99.98,
      },
      {
        name: "Edge Functions",
        status: "operational" as const,
        uptime: 99.95,
      },
      {
        name: "Integration Sync",
        status: "operational" as const,
        uptime: 99.92,
      },
    ];

    // Determine overall status based on system statuses
    // Since all systems are "operational" in mock data, overall status is operational
    // In production, this would check actual system statuses
    const overallStatus = "operational";

    const response = NextResponse.json({ systems, overallStatus });
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error("Error in status GET:", error);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    // Don't cache errors
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}
