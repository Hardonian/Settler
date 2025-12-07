import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobs, integrations, settings } = body;

    // Import jobs
    if (jobs && Array.isArray(jobs)) {
      for (const job of jobs) {
        await supabase.from("reconciliation_jobs").upsert({
          ...job,
          user_id: user.id,
          id: undefined, // Let database generate new ID
        });
      }
    }

    // Import integrations (without sensitive credentials)
    if (integrations && Array.isArray(integrations)) {
      for (const integration of integrations) {
        await supabase.from("integration_credentials").upsert({
          user_id: user.id,
          integration_id: integration.integration_id,
          is_connected: integration.is_connected,
          // Don't import credentials for security
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in import POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
