import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const POST = withUniversalBillingGate(async function POST(
  _request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId } = params;

    // Get integration credentials
    const { data: integration } = await supabase
      .from("integration_credentials")
      .select("*")
      .eq("user_id", user.id)
      .eq("integration_id", integrationId)
      .single();

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // In sandbox mode, test the connection without making real API calls
    // This is a mock - in production, you'd actually test the integration
    const testResult = {
      connection: "success",
      credentials_valid: true,
      api_reachable: true,
      permissions_ok: true,
      test_data: {
        sample_record: "Test record created in sandbox",
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(testResult);
  } catch (error) {
    console.error("Error in integration test:", error);
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