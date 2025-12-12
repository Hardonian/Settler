import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

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
    const { jobs, integrations } = body;

    // Import jobs
    if (jobs && Array.isArray(jobs)) {
      for (const job of jobs) {
        const { id, ...jobData } = job as any;
        await supabase.from("reconciliation_jobs").upsert({
          ...jobData,
          user_id: user.id,
        } as any);
      }
    }

    // Import integrations (without sensitive credentials)
    if (integrations && Array.isArray(integrations)) {
      for (const integration of integrations) {
        await supabase.from("integration_credentials").upsert({
          user_id: user.id,
          integration_id: (integration as any).integration_id,
          is_connected: (integration as any).is_connected,
          // Don't import credentials for security
        } as any);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in import POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
