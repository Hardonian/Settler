import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
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
    const hasDown = systems.some((s) => s.status === "down");
    const hasDegraded = systems.some((s) => s.status === "degraded");
    const allOperational = systems.every((s) => s.status === "operational");
    
    const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : allOperational ? "operational" : "degraded";

    return NextResponse.json({ systems, overallStatus });
  } catch (error) {
    console.error("Error in status GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
