import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock edge function health (in production, fetch from Supabase Edge Functions monitoring)
    const functions = [
      {
        name: "integration-sync-stripe",
        status: "healthy",
        invocations: 1250,
        errors: 2,
        avgDuration: 145,
      },
      {
        name: "integration-sync-shopify",
        status: "healthy",
        invocations: 980,
        errors: 0,
        avgDuration: 132,
      },
      {
        name: "compute-bill",
        status: "healthy",
        invocations: 450,
        errors: 1,
        avgDuration: 89,
      },
      {
        name: "sync-usage-to-stripe",
        status: "degraded",
        invocations: 320,
        errors: 8,
        avgDuration: 245,
      },
    ];

    return NextResponse.json({ functions });
  } catch (error) {
    console.error("Error in edge-functions GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
