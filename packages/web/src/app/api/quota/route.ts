import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock quota data (in production, fetch from quota tracking system)
    const quotas = [
      {
        endpoint: "/api/reconcile",
        limit: 10000,
        used: 7850,
        resetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        endpoint: "/api/integrations/sync",
        limit: 5000,
        used: 4200,
        resetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        endpoint: "/api/webhooks",
        limit: 20000,
        used: 15200,
        resetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({ quotas });
  } catch (error) {
    console.error("Error in quota GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
