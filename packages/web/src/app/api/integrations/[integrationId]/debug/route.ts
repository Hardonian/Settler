import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const POST = withUniversalBillingGate(async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { error: errorMessage } = body;

    // In production, this would use AI/ML to analyze the error
    // For now, return mock diagnostic data
    const debugResult = {
      error: errorMessage,
      solution: `For ${integrationId}, this error typically occurs when API credentials are invalid or expired. Please verify your API keys in the integration settings and ensure they have the correct permissions.`,
      documentation: `See the ${integrationId} integration documentation for detailed troubleshooting steps. Common issues include: invalid API keys, rate limiting, network connectivity, and permission scopes.`,
      relatedErrors: [
        "Invalid API key",
        "Rate limit exceeded",
        "Authentication failed",
        "Permission denied",
      ],
    };

    return NextResponse.json(debugResult);
  } catch (error) {
    console.error("Error in debug POST:", error);
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