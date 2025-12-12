import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock system health data (in production, fetch from monitoring system)
    const health = [
      {
        component: "API Server",
        status: "healthy",
        metrics: {
          cpu: 45,
          memory: 62,
          requests: 1250,
          errors: 2,
        },
      },
      {
        component: "Database",
        status: "healthy",
        metrics: {
          cpu: 38,
          memory: 55,
          requests: 3200,
          errors: 0,
        },
      },
      {
        component: "Redis Cache",
        status: "healthy",
        metrics: {
          cpu: 25,
          memory: 40,
          requests: 8500,
          errors: 0,
        },
      },
      {
        component: "Edge Functions",
        status: "degraded",
        metrics: {
          cpu: 72,
          memory: 68,
          requests: 450,
          errors: 5,
        },
      },
    ];

    return NextResponse.json({ health });
  } catch (error) {
    console.error("Error in system-health GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
