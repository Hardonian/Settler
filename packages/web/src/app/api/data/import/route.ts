import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const POST = withUniversalBillingGate(async function POST(request: NextRequest) {
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
        const { id: _id, ...jobData } = job as Record<string, unknown>;
        await (supabase.from("reconciliation_jobs") as any).upsert({
          ...jobData,
          user_id: user.id,
        });
      }
    }

    // Import integrations (without sensitive credentials)
    if (integrations && Array.isArray(integrations)) {
      for (const integration of integrations) {
        const integrationTyped = integration as { integration_id?: string; is_connected?: boolean };
        await (supabase.from("integration_credentials") as any).upsert({
          user_id: user.id,
          integration_id: integrationTyped.integration_id,
          is_connected: integrationTyped.is_connected,
          // Don't import credentials for security
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    appLogger.error("Error in import POST", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' });
